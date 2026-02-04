package api

import (
	"context"
	"encoding/json"
	"log/slog"
	"net"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"

	"pokemon_data/internal/cache"
	"pokemon_data/internal/config"
)

type RouterDeps struct {
	Cfg          config.Config
	Logger       *slog.Logger
	PayloadCache *cache.JSONGzipCache
}

func NewRouter(deps RouterDeps) http.Handler {
	r := chi.NewRouter()

	log := deps.Logger
	if log == nil {
		log = slog.Default()
	}

	r.Use(middleware.Recoverer)
	r.Use(middleware.RealIP)
	r.Use(middleware.Timeout(120 * time.Second))

	// CORS (matches existing Go behavior and Node intent)
	r.Use(corsMiddleware(deps.Cfg, log))

	// Node-like request logs
	r.Use(nodeRequestLogMiddleware(log))

	// Health
	r.Get("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	// Main endpoint
	r.Get("/pokemon/pokemons", func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), deps.Cfg.CacheBuildTimeout)
		defer cancel()

		if err := deps.PayloadCache.EnsureBuilt(ctx); err != nil {
			log.Info("Error serving /pokemon/pokemons: cache ensure failed")
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}

		_, _, _, _ = deps.PayloadCache.Send(w, r)
	})

	// Cache stats
	r.Get("/internal/cache/stats", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, deps.PayloadCache.Stats())
	})

	// Cache refresh
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
}

func (sr *statusRecorder) WriteHeader(code int) {
	sr.status = code
	sr.ResponseWriter.WriteHeader(code)
}

func nodeRequestLogMiddleware(log *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := clientIP(r)
			log.Info("Incoming request: " + r.Method + " " + r.URL.Path + " from " + ip)

			start := time.Now()
			sr := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
			next.ServeHTTP(sr, r)
			totalMs := time.Since(start).Milliseconds()

			log.Info("Response " + r.URL.Path + ": status=" + strconv.Itoa(sr.status) + " totalMs=" + strconv.FormatInt(totalMs, 10) + "ms")
		})
	}
}

func clientIP(r *http.Request) string {
	ip := r.Header.Get("X-Forwarded-For")
	if ip != "" {
		parts := strings.Split(ip, ",")
		if len(parts) > 0 && strings.TrimSpace(parts[0]) != "" {
			return strings.TrimSpace(parts[0])
		}
	}
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err == nil && host != "" {
		return host
	}
	return r.RemoteAddr
}

// corsMiddleware implements the same allowlist behavior as the original Go code:
// - allow if origin is in cfg.AllowedOrigins OR (AllowCloudflareSub and origin ends with .cloudflare.com)
// - set headers for allowed origins
// - block and log unauthorized origins with 403
func corsMiddleware(cfg config.Config, log *slog.Logger) func(http.Handler) http.Handler {
	allowed := make(map[string]struct{}, len(cfg.AllowedOrigins))
	for _, o := range cfg.AllowedOrigins {
		allowed[o] = struct{}{}
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			if origin == "" {
				next.ServeHTTP(w, r)
				return
			}

			if _, ok := allowed[origin]; ok || (cfg.AllowCloudflareSub && strings.HasSuffix(origin, ".cloudflare.com")) {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Vary", "Origin, Accept-Encoding")
				w.Header().Set("Access-Control-Allow-Credentials", "true")
				w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")

				if r.Method == http.MethodOptions {
					w.WriteHeader(http.StatusNoContent)
					return
				}
				next.ServeHTTP(w, r)
				return
			}

			if log != nil {
				log.Warn("Unauthorized CORS access attempt from origin: " + origin)
			}
			http.Error(w, "CORS forbidden", http.StatusForbidden)
		})
	}
}
