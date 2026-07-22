package api

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"log/slog"
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
	BaseContext context.Context

	Cfg                     config.Config
	Logger                  *slog.Logger
	DB                      *sql.DB
	PayloadCache            *cache.JSONGzipCache // Legacy /pokemon/pokemons response.
	CatalogCache            *cache.JSONGzipCache
	MovesCache              *cache.JSONGzipCache
	RaidDataCache           *cache.JSONGzipCache
	InvalidatePayloadBundle func()
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
	peerIP := remoteIP

	prettyJSON := deps.Cfg.JSONPretty
	fullCache := deps.PayloadCache
	catalogCache := deps.CatalogCache
	movesCache := deps.MovesCache
	raidDataCache := deps.RaidDataCache
	if catalogCache == nil {
		catalogCache = fullCache
	}

	writeJSON := func(w http.ResponseWriter, v any) {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		enc := json.NewEncoder(w)
		if prettyJSON {
			enc.SetIndent("", "  ")
		}
		_ = enc.Encode(v)
	}

	writeJSONWithETag := func(w http.ResponseWriter, r *http.Request, v any) {
		raw, err := json.Marshal(v)
		if err != nil {
			log.Error("json marshal failed", slog.String("err", err.Error()))
			http.Error(w, "internal server error", http.StatusInternalServerError)
			return
		}

		sum := sha256.Sum256(raw)
		etag := `"` + hex.EncodeToString(sum[:]) + `"`
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("ETag", etag)

		if r.Header.Get("If-None-Match") == etag {
			w.WriteHeader(http.StatusNotModified)
			return
		}

		w.WriteHeader(http.StatusOK)
		_, _ = w.Write(raw)
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
				ir.Use(InternalOnlyMiddleware(guard, peerIP))
				ir.Handle("/metrics", promhttp.Handler())
				MountPprof(ir)

				ir.Get("/internal/cache/stats", func(w http.ResponseWriter, r *http.Request) {
					writeJSON(w, pokemonCacheStats(fullCache, catalogCache, movesCache, raidDataCache))
				})

				ir.Post("/internal/cache/refresh", func(w http.ResponseWriter, r *http.Request) {
					if deps.Cfg.CacheRefreshToken != "" {
						if r.Header.Get("X-Cache-Refresh-Token") != deps.Cfg.CacheRefreshToken {
							w.WriteHeader(http.StatusForbidden)
							return
						}
					}
					invalidatePokemonCaches(fullCache, catalogCache, movesCache, raidDataCache, deps.InvalidatePayloadBundle)
					w.WriteHeader(http.StatusNoContent)
				})
			})
		}
	} else {
		r.Handle("/metrics", promhttp.Handler())
		MountPprof(r)

		r.Get("/internal/cache/stats", func(w http.ResponseWriter, r *http.Request) {
			writeJSON(w, pokemonCacheStats(fullCache, catalogCache, movesCache, raidDataCache))
		})

		r.Post("/internal/cache/refresh", func(w http.ResponseWriter, r *http.Request) {
			if deps.Cfg.CacheRefreshToken != "" {
				if r.Header.Get("X-Cache-Refresh-Token") != deps.Cfg.CacheRefreshToken {
					w.WriteHeader(http.StatusForbidden)
					return
				}
			}
			invalidatePokemonCaches(fullCache, catalogCache, movesCache, raidDataCache, deps.InvalidatePayloadBundle)
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

		cacheStats := catalogCache.Stats()
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

	newPokemonPayloadHandler := func(name string, payloadCache *cache.JSONGzipCache) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if payloadCache == nil {
				http.Error(w, "payload cache not configured", http.StatusServiceUnavailable)
				return
			}

			ctx, cancel := context.WithTimeout(r.Context(), deps.Cfg.CacheBuildTimeout)
			defer cancel()

			if err := payloadCache.EnsureBuilt(ctx); err != nil {
				log.Error("cache ensure failed", slog.String("cache", name), slog.String("err", err.Error()))
				http.Error(w, "internal server error", http.StatusInternalServerError)
				return
			}

			_, _, _, _, sendErr := payloadCache.Send(w, r)
			if sendErr != nil {
				log.Warn("cache send write error", slog.String("cache", name), slog.String("err", sendErr.Error()))
			}
		})
	}

	pokemonHandler := newPokemonPayloadHandler("pokemonFull", fullCache)
	catalogHandler := newPokemonPayloadHandler("catalog", catalogCache)
	movesHandler := newPokemonPayloadHandler("moves", movesCache)
	raidDataHandler := newPokemonPayloadHandler("raidData", raidDataCache)

	var manifestHandler http.Handler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), deps.Cfg.CacheBuildTimeout)
		defer cancel()

		for name, payloadCache := range map[string]*cache.JSONGzipCache{
			"pokemonFull": fullCache,
			"catalog":     catalogCache,
			"moves":       movesCache,
			"raidData":    raidDataCache,
		} {
			if payloadCache == nil {
				log.Error("manifest cache missing", slog.String("cache", name))
				http.Error(w, "internal server error", http.StatusInternalServerError)
				return
			}
			if err := payloadCache.EnsureBuilt(ctx); err != nil {
				log.Error("manifest cache ensure failed", slog.String("cache", name), slog.String("err", err.Error()))
				http.Error(w, "internal server error", http.StatusInternalServerError)
				return
			}
		}

		fullStats := fullCache.Stats()
		catalogStats := catalogCache.Stats()
		movesStats := movesCache.Stats()
		raidDataStats := raidDataCache.Stats()
		catalogVersion := strings.Trim(catalogStats.ETag, `"`)
		manifest := pokemonCatalogManifest{
			SchemaVersion:  3,
			CatalogVersion: catalogVersion,
			GeneratedAt:    latestCacheBuildAt(fullStats, catalogStats, movesStats, raidDataStats),
			Chunks: map[string]pokemonCatalogChunk{
				"pokemonFull": newPokemonCatalogChunk("pokemonFull", "/pokemons", fullStats),
				"catalog":     newPokemonCatalogChunk("catalog", "/catalog", catalogStats),
				"moves":       newPokemonCatalogChunk("moves", "/moves", movesStats),
				"raidData":    newPokemonCatalogChunk("raidData", "/raid-data", raidDataStats),
			},
		}

		writeJSONWithETag(w, r, manifest)
	})

	if deps.Cfg.RateLimitEnabled {
		lim := NewIPRateLimiter(deps.Cfg.RateLimitRPS, deps.Cfg.RateLimitBurst, 5*time.Minute)
		pokemonHandler = RateLimitMiddleware(baseCtx, lim, ipr.ClientIP)(pokemonHandler)
		catalogHandler = RateLimitMiddleware(baseCtx, lim, ipr.ClientIP)(catalogHandler)
		movesHandler = RateLimitMiddleware(baseCtx, lim, ipr.ClientIP)(movesHandler)
		raidDataHandler = RateLimitMiddleware(baseCtx, lim, ipr.ClientIP)(raidDataHandler)
		manifestHandler = RateLimitMiddleware(baseCtx, lim, ipr.ClientIP)(manifestHandler)
	}
	r.Method(http.MethodGet, "/pokemon/manifest", manifestHandler)
	r.Method(http.MethodGet, "/pokemon/pokemons", pokemonHandler)
	r.Method(http.MethodGet, "/pokemon/catalog", catalogHandler)
	r.Method(http.MethodGet, "/pokemon/moves", movesHandler)
	r.Method(http.MethodGet, "/pokemon/raid-data", raidDataHandler)

	return r
}

func newPokemonCatalogChunk(name string, endpoint string, stats cache.Stats) pokemonCatalogChunk {
	return pokemonCatalogChunk{
		Name:        name,
		Endpoint:    endpoint,
		ContentType: "application/json",
		ETag:        stats.ETag,
		Version:     strings.Trim(stats.ETag, `"`),
		BytesJSON:   stats.BytesJSON,
		BytesGzip:   stats.BytesGzip,
	}
}

func latestCacheBuildAt(stats ...cache.Stats) time.Time {
	var latest time.Time
	for _, stat := range stats {
		if stat.LastBuiltAt.After(latest) {
			latest = stat.LastBuiltAt
		}
	}
	return latest.UTC()
}

func pokemonCacheStats(full, catalog, moves, raidData *cache.JSONGzipCache) map[string]cache.Stats {
	stats := map[string]cache.Stats{}
	for name, payloadCache := range map[string]*cache.JSONGzipCache{
		"pokemonFull": full,
		"catalog":     catalog,
		"moves":       moves,
		"raidData":    raidData,
	} {
		if payloadCache != nil {
			stats[name] = payloadCache.Stats()
		}
	}
	return stats
}

func invalidatePokemonCaches(full, catalog, moves, raidData *cache.JSONGzipCache, invalidateBundle func()) {
	if invalidateBundle != nil {
		invalidateBundle()
	}
	seen := map[*cache.JSONGzipCache]struct{}{}
	for _, payloadCache := range []*cache.JSONGzipCache{full, catalog, moves, raidData} {
		if payloadCache == nil {
			continue
		}
		if _, exists := seen[payloadCache]; exists {
			continue
		}
		seen[payloadCache] = struct{}{}
		payloadCache.Invalidate()
	}
}

type pokemonCatalogManifest struct {
	SchemaVersion  int                            `json:"schemaVersion"`
	CatalogVersion string                         `json:"catalogVersion"`
	GeneratedAt    time.Time                      `json:"generatedAt"`
	Chunks         map[string]pokemonCatalogChunk `json:"chunks"`
}

type pokemonCatalogChunk struct {
	Name        string `json:"name"`
	Endpoint    string `json:"endpoint"`
	ContentType string `json:"contentType"`
	ETag        string `json:"etag"`
	Version     string `json:"version"`
	BytesJSON   int    `json:"bytesJson"`
	BytesGzip   int    `json:"bytesGzip"`
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
			if shouldSkipRequestLog(route, r.URL.Path) {
				return
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

func shouldSkipRequestLog(route, path string) bool {
	switch route {
	case "/metrics", "/healthz", "/readyz":
		return true
	}
	switch path {
	case "/metrics", "/healthz", "/readyz":
		return true
	}
	return false
}
