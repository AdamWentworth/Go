package main

import (
	"context"
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

	dsn := cfg.SQLitePath
	if dsn == "" {
		dsn = "./data/pokego.db"
	}

	sqlDB, err := db.OpenSQLite(dsn)
	if err != nil {
		logger.Error(fmt.Sprintf("db open failed: %v", err))
		os.Exit(1)
	}
	defer func() { _ = sqlDB.Close() }()

	payloadBuilder := builder.New(sqlDB, logger)

	payloadCache := cache.NewJSONGzipCache(cache.JSONGzipCacheConfig{
		Name:         "/pokemon/pokemons",
		BuildPayload: payloadBuilder.BuildFullPokemonPayload,
		Logger:       logger,
		GzipLevel:    6,
	})

	baseCtx, baseCancel := context.WithCancel(context.Background())
	defer baseCancel()

	router := api.NewRouter(api.RouterDeps{
		BaseContext:  baseCtx,
		Cfg:          cfg,
		Logger:       logger,
		DB:           sqlDB,
		PayloadCache: payloadCache,
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
			logger.Info("Prewarming /pokemon/pokemons cache at startup.")
			ctx, cancel := context.WithTimeout(context.Background(), cfg.CacheBuildTimeout)
			defer cancel()
			if err := payloadCache.EnsureBuilt(ctx); err != nil {
				logger.Error(fmt.Sprintf("Prewarm failed: %v", err))
				return
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
