package api

import (
	"context"
	"database/sql"
	"encoding/json"
	"log/slog"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/prometheus/client_golang/prometheus/promhttp"

	"pokemon_data/internal/cache"
	"pokemon_data/internal/config"
	"pokemon_data/internal/metrics"
)

type RouterDeps struct {
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

	ipr, err := NewIPResolver(deps.Cfg.TrustedProxyCIDRs, log)
	if err != nil {
		log.Error("invalid TRUSTED_PROXY_CIDRS; forwarding headers will be ignored", slog.String("err", err.Error()))
		ipr = &IPResolver{}
	}

	prettyJSON := deps.Cfg.JSONPretty

	writeJSON := func(w http.ResponseWriter, v any) {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		enc := json.NewEncoder(w)
		if prettyJSON {
			enc.SetIndent("", "  ")
		}
		_ = enc.Encode(v)
	}

	r.Use(middleware.Recoverer)
	r.Use(middleware.RequestID)
	r.Use(middleware.Timeout(120 * time.Second))

	r.Use(corsMiddleware(deps.Cfg, log))
	r.Use(metrics.Middleware())
	r.Use(requestLogMiddleware(log, ipr.ClientIP))

	if deps.Cfg.InternalOnlyEnabled {
		guard, err := NewCIDRGuard(deps.Cfg.InternalOnlyCIDRs, log)
		if err != nil {
			log.Error("invalid INTERNAL_ONLY_CIDRS; internal guard disabled", slog.String("err", err.Error()))
		} else {
			r.Group(func(ir chi.Router) {
				ir.Use(InternalOnlyMiddleware(guard, ipr.ClientIP))
				ir.Handle("/metrics", promhttp.Handler())
				MountPprof(ir)

				ir.Get("/internal/cache/stats", func(w http.ResponseWriter, r *http.Request) {
					writeJSON(w, deps.PayloadCache.Stats())
				})

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

	r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	r.Get("/readyz", func(w http.ResponseWriter, r *http.Request) {
		type readyResp struct {
			OK         bool   `json:"ok"`
			DB         bool   `json:"db"`
			CacheReady bool   `json:"cacheReady"`
			Message    string `json:"message,omitempty"`
		}

		resp := readyResp{OK: false, DB: false, CacheReady: false}

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

	var pokemonHandler http.Handler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), deps.Cfg.CacheBuildTimeout)
		defer cancel()

		if err := deps.PayloadCache.EnsureBuilt(ctx); err != nil {
			log.Error("cache ensure failed", slog.String("err", err.Error()))
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}

		_, _, _, _, sendErr := deps.PayloadCache.Send(w, r)
		if sendErr != nil {
			log.Warn("cache send write error", slog.String("err", sendErr.Error()))
		}
	})

	if deps.Cfg.RateLimitEnabled {
		lim := NewIPRateLimiter(deps.Cfg.RateLimitRPS, deps.Cfg.RateLimitBurst, 5*time.Minute)
		pokemonHandler = RateLimitMiddleware(baseCtx, lim, ipr.ClientIP)(pokemonHandler)
	}
	r.Method(http.MethodGet, "/pokemon/pokemons", pokemonHandler)

	return r
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

func requestLogMiddleware(log *slog.Logger, ipFn func(*http.Request) string) func(http.Handler) http.Handler {
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

			ip := ""
			if ipFn != nil {
				ip = ipFn(r)
			}

			ua := r.Header.Get("User-Agent")

			log.Info("request",
				slog.String("method", r.Method),
				slog.String("route", route),
				slog.String("path", r.URL.Path),
				slog.Int("status", sr.status),
				slog.Int("bytes", sr.bytes),
				slog.Duration("duration", dur),
				slog.String("req_id", reqID),
				slog.String("ip", ip),
				slog.String("ua", ua),
			)
		})
	}
}
