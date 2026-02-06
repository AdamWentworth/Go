package api

import (
	"context"
	"database/sql"
	"encoding/json"
	"log/slog"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/prometheus/client_golang/prometheus/promhttp"

	"pokemon_data/internal/cache"
	"pokemon_data/internal/config"
	"pokemon_data/internal/metrics"
)

type RouterDeps struct {
	// BaseContext is used to tie background goroutines (e.g., rate-limiter cleanup) to process lifetime.
	// If nil, context.Background() is used.
	BaseContext context.Context

	Cfg          config.Config
	Logger       *slog.Logger
	DB           *sql.DB
	PayloadCache *cache.JSONGzipCache
}

func NewRouter(deps RouterDeps) http.Handler {
	r := chi.NewRouter()

	log := deps.Logger
	if log == nil {
		log = slog.Default()
	}

	baseCtx := deps.BaseContext
	if baseCtx == nil {
		baseCtx = context.Background()
	}

	r.Use(middleware.Recoverer)
	r.Use(middleware.RealIP)

	// Adds X-Request-Id and stores it in context. If caller supplies X-Request-Id, chi will reuse it.
	r.Use(middleware.RequestID)

	r.Use(middleware.Timeout(120 * time.Second))

	// CORS allowlist middleware (cors.go)
	r.Use(corsMiddleware(deps.Cfg, log))

	// Prometheus request metrics (metrics_http.go)
	r.Use(metrics.Middleware())

	// Structured request logs (includes req_id)
	r.Use(requestLogMiddleware(log))

	// Internal endpoints: /metrics, /internal/*, /debug/pprof/*
	// Mounted exactly once to avoid chi panics.
	if deps.Cfg.InternalOnlyEnabled {
		guard, err := NewCIDRGuard(deps.Cfg.InternalOnlyCIDRs, log)
		if err != nil {
			// Fail safe: if config is invalid, do NOT start up with a broken guard.
			log.Error("invalid INTERNAL_ONLY_CIDRS; internal guard disabled", slog.String("err", err.Error()))
		} else {
			r.Group(func(ir chi.Router) {
				ir.Use(InternalOnlyMiddleware(guard, clientIP))
				ir.Handle("/metrics", promhttp.Handler())
				MountPprof(ir)

				// Cache stats
				ir.Get("/internal/cache/stats", func(w http.ResponseWriter, r *http.Request) {
					writeJSON(w, deps.PayloadCache.Stats())
				})

				// Cache refresh
				ir.Post("/internal/cache/refresh", func(w http.ResponseWriter, r *http.Request) {
					if deps.Cfg.CacheRefreshToken != "" {
						if r.Header.Get("X-Cache-Refresh-Token") != deps.Cfg.CacheRefreshToken {
							w.WriteHeader(http.StatusForbidden)
							return
						}
					}
					deps.PayloadCache.Invalidate()
					w.WriteHeader(http.StatusNoContent)
				})
			})
		}
	} else {
		// Unrestricted internal endpoints (dev/local use).
		r.Handle("/metrics", promhttp.Handler())
		MountPprof(r)

		r.Get("/internal/cache/stats", func(w http.ResponseWriter, r *http.Request) {
			writeJSON(w, deps.PayloadCache.Stats())
		})

		r.Post("/internal/cache/refresh", func(w http.ResponseWriter, r *http.Request) {
			if deps.Cfg.CacheRefreshToken != "" {
				if r.Header.Get("X-Cache-Refresh-Token") != deps.Cfg.CacheRefreshToken {
					w.WriteHeader(http.StatusForbidden)
					return
				}
			}
			deps.PayloadCache.Invalidate()
			w.WriteHeader(http.StatusNoContent)
		})
	}

	// Liveness: process is up.
	r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	// Readiness: dependencies are usable.
	// - DB must respond to a ping.
	// - If CACHE_PREWARM is enabled, require the payload cache to already be built.
	r.Get("/readyz", func(w http.ResponseWriter, r *http.Request) {
		type readyResp struct {
			OK         bool   `json:"ok"`
			DB         bool   `json:"db"`
			CacheReady bool   `json:"cacheReady"`
			Message    string `json:"message,omitempty"`
		}

		resp := readyResp{OK: false, DB: false, CacheReady: false}

		// DB ping with a short timeout so readiness isn't sticky.
		if deps.DB != nil {
			ctx, cancel := context.WithTimeout(r.Context(), 1*time.Second)
			defer cancel()
			if err := deps.DB.PingContext(ctx); err == nil {
				resp.DB = true
			} else {
				resp.Message = "db not ready"
			}
		} else {
			resp.Message = "db not configured"
		}

		cacheStats := deps.PayloadCache.Stats()
		if deps.Cfg.CachePrewarm {
			resp.CacheReady = cacheStats.HasCache
			if !resp.CacheReady && resp.Message == "" {
				resp.Message = "cache not ready"
			}
		} else {
			// If not prewarming, cache can be built on-demand.
			resp.CacheReady = true
		}

		resp.OK = resp.DB && resp.CacheReady
		if !resp.OK {
			w.WriteHeader(http.StatusServiceUnavailable)
		} else {
			w.WriteHeader(http.StatusOK)
		}
		writeJSON(w, resp)
	})

	// Main endpoint (optionally rate-limited via RATE_LIMIT_* envs)
	var pokemonHandler http.Handler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), deps.Cfg.CacheBuildTimeout)
		defer cancel()

		if err := deps.PayloadCache.EnsureBuilt(ctx); err != nil {
			log.Error("cache ensure failed", slog.String("err", err.Error()))
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}

		_, _, _, _ = deps.PayloadCache.Send(w, r)
	})

	if deps.Cfg.RateLimitEnabled {
		lim := NewIPRateLimiter(deps.Cfg.RateLimitRPS, deps.Cfg.RateLimitBurst, 5*time.Minute)
		pokemonHandler = RateLimitMiddleware(baseCtx, lim, clientIP)(pokemonHandler)
	}
	r.Method(http.MethodGet, "/pokemon/pokemons", pokemonHandler)

	return r
}

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	enc := json.NewEncoder(w)
	enc.SetIndent("", "  ")
	_ = enc.Encode(v)
}

type statusRecorder struct {
	http.ResponseWriter
	status int
	bytes  int
}

func (sr *statusRecorder) WriteHeader(code int) {
	sr.status = code
	sr.ResponseWriter.WriteHeader(code)
}

func (sr *statusRecorder) Write(p []byte) (int, error) {
	n, err := sr.ResponseWriter.Write(p)
	sr.bytes += n
	return n, err
}

func requestLogMiddleware(log *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			sr := &statusRecorder{ResponseWriter: w, status: http.StatusOK}

			next.ServeHTTP(sr, r)

			dur := time.Since(start)
			reqID := middleware.GetReqID(r.Context())
			route := chi.RouteContext(r.Context()).RoutePattern()
			if route == "" {
				route = r.URL.Path
			}

			ip := clientIP(r)
			ua := r.Header.Get("User-Agent")

			// Parse host without port if present, for cleaner logs.
			host := r.Host
			if h, _, err := net.SplitHostPort(r.Host); err == nil && h != "" {
				host = h
			}

			log.Info("request",
				slog.String("method", r.Method),
				slog.String("route", route),
				slog.String("path", r.URL.Path),
				slog.Int("status", sr.status),
				slog.Int("bytes", sr.bytes),
				slog.Duration("duration", dur),
				slog.String("req_id", reqID),
				slog.String("ip", ip),
				slog.String("host", host),
				slog.String("ua", ua),
			)
		})
	}
}

// clientIP returns the best-guess client IP.
// Assumes chi/middleware.RealIP ran earlier.
func clientIP(r *http.Request) string {
	// Prefer X-Forwarded-For (first entry).
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		// Take the first IP in the list.
		parts := strings.Split(xff, ",")
		if len(parts) > 0 {
			ip := strings.TrimSpace(parts[0])
			if ip != "" {
				return ip
			}
		}
	}

	// Fall back to X-Real-IP.
	if xr := strings.TrimSpace(r.Header.Get("X-Real-IP")); xr != "" {
		return xr
	}

	// Finally, RemoteAddr (may include port).
	if host, _, err := net.SplitHostPort(r.RemoteAddr); err == nil && host != "" {
		return host
	}
	return r.RemoteAddr
}
