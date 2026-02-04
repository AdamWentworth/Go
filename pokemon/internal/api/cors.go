package api

import (
	"log/slog"
	"net/http"
	"strings"

	"pokemon_data/internal/config"
)

// corsMiddleware enforces a simple origin allowlist.
// - Allows if origin is in cfg.AllowedOrigins OR (cfg.AllowCloudflareSub and origin ends with .cloudflare.com)
// - Adds standard CORS headers for allowed origins
// - Answers preflight OPTIONS with 204
// - Blocks disallowed origins with 403
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
				w.Header().Set("Access-Control-Max-Age", "600")

				if r.Method == http.MethodOptions {
					w.WriteHeader(http.StatusNoContent)
					return
				}

				next.ServeHTTP(w, r)
				return
			}

			if log != nil {
				log.Warn("unauthorized cors origin", slog.String("origin", origin))
			}
			http.Error(w, "CORS forbidden", http.StatusForbidden)
		})
	}
}
