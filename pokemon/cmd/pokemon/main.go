package main

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"pokemon_data/internal/api"
	"pokemon_data/internal/builder"
	"pokemon_data/internal/cache"
	"pokemon_data/internal/config"
	"pokemon_data/internal/db"
	"pokemon_data/internal/logging"
)

func main() {
	cfg := config.Load()

	logger := slog.New(logging.NewNodeFmtHandler(os.Stdout, cfg.LogLevel))
	slog.SetDefault(logger)

	var sqlDB *sql.DB
	var err error
	sqlDB, err = db.OpenPostgres(cfg.CatalogDatabaseURL)
	if err != nil {
		logger.Error(fmt.Sprintf("db open failed: %v", err))
		os.Exit(1)
	}
	defer func() { _ = sqlDB.Close() }()

	payloadBuilder := builder.New(sqlDB, logger)

	var l2Store cache.PayloadStore
	if cfg.RedisURL != "" {
		redisStore, redisErr := cache.NewRedisPayloadStore(cache.RedisPayloadStoreConfig{
			URL:       cfg.RedisURL,
			KeyPrefix: cfg.RedisKeyPrefix,
		})
		if redisErr != nil {
			logger.Warn("Redis L2 cache configuration is invalid; continuing with memory and PostgreSQL", "err", redisErr)
		} else {
			l2Store = redisStore
			defer func() { _ = redisStore.Close() }()
			pingCtx, pingCancel := context.WithTimeout(context.Background(), cfg.RedisOpTimeout)
			if pingErr := redisStore.Ping(pingCtx); pingErr != nil {
				logger.Warn("Redis L2 cache is unavailable at startup; requests will fall back safely", "err", pingErr)
			} else {
				logger.Info("Redis L2 cache connected", "key_prefix", cfg.RedisKeyPrefix)
			}
			pingCancel()
		}
	}

	newPayloadCache := func(name string, build func(context.Context) (any, error)) *cache.JSONGzipCache {
		return cache.NewJSONGzipCache(cache.JSONGzipCacheConfig{
			Name:                    name,
			BuildPayload:            build,
			Logger:                  logger,
			GzipLevel:               6,
			Store:                   l2Store,
			StoreTTL:                cfg.RedisCacheTTL,
			StoreOperationTimeout:   cfg.RedisOpTimeout,
			StoreRevalidateInterval: cfg.RedisRevalidate,
			StoreBuildLockTTL:       cfg.RedisBuildLockTTL,
			StoreBuildWait:          cfg.RedisBuildWait,
		})
	}

	payloadCache := newPayloadCache("/pokemon/pokemons", payloadBuilder.BuildFullPokemonPayload)
	catalogCache := newPayloadCache("/pokemon/catalog", payloadBuilder.BuildCatalogPayload)
	pokedexCache := newPayloadCache("/pokemon/pokedex", payloadBuilder.BuildPokedexSpeciesPayload)
	movesCache := newPayloadCache("/pokemon/moves", payloadBuilder.BuildMovesPayload)
	raidDataCache := newPayloadCache("/pokemon/raid-data", payloadBuilder.BuildRaidDataPayload)
	maxDataCache := newPayloadCache("/pokemon/max-data", payloadBuilder.BuildMaxBattlePayload)
	pvpDataCache := newPayloadCache("/pokemon/pvp-data", payloadBuilder.BuildPvPRankingsPayload)

	baseCtx, baseCancel := context.WithCancel(context.Background())
	defer baseCancel()

	router := api.NewRouter(api.RouterDeps{
		BaseContext:             baseCtx,
		Cfg:                     cfg,
		Logger:                  logger,
		DB:                      sqlDB,
		PayloadCache:            payloadCache,
		CatalogCache:            catalogCache,
		PokedexCache:            pokedexCache,
		MovesCache:              movesCache,
		RaidDataCache:           raidDataCache,
		MaxDataCache:            maxDataCache,
		PvPDataCache:            pvpDataCache,
		InvalidatePayloadBundle: payloadBuilder.InvalidatePokemonPayloadBundle,
	})

	srv := &http.Server{
		Addr:              fmt.Sprintf("0.0.0.0:%d", cfg.Port),
		Handler:           router,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      60 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	logger.Info(fmt.Sprintf("Server is running on http://0.0.0.0:%d and accessible on the network", cfg.Port))

	if cfg.CachePrewarm {
		go func() {
			logger.Info("Prewarming Pokemon catalog caches at startup.")
			ctx, cancel := context.WithTimeout(context.Background(), cfg.CacheBuildTimeout)
			defer cancel()
			for _, entry := range []struct {
				name  string
				cache *cache.JSONGzipCache
			}{
				{name: "/pokemon/pokemons", cache: payloadCache},
				{name: "/pokemon/catalog", cache: catalogCache},
				{name: "/pokemon/pokedex", cache: pokedexCache},
				{name: "/pokemon/moves", cache: movesCache},
				{name: "/pokemon/raid-data", cache: raidDataCache},
				{name: "/pokemon/max-data", cache: maxDataCache},
				{name: "/pokemon/pvp-data", cache: pvpDataCache},
			} {
				if err := entry.cache.EnsureBuilt(ctx); err != nil {
					logger.Error(fmt.Sprintf("Prewarm failed for %s: %v", entry.name, err))
					return
				}
			}
			logger.Info("Prewarm complete")
		}()
	}

	go func() {
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error(fmt.Sprintf("server error: %v", err))
			os.Exit(1)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)
	<-stop

	logger.Info("shutdown requested")

	baseCancel()

	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		logger.Error(fmt.Sprintf("shutdown error: %v", err))
	}
	logger.Info("shutdown complete")
}
