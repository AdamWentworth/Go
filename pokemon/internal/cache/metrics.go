package cache

import (
	"errors"

	"github.com/prometheus/client_golang/prometheus"
)

var (
	cacheOperations = prometheus.NewCounterVec(prometheus.CounterOpts{
		Name: "pokemon_catalog_cache_operations_total",
		Help: "Pokemon catalog cache operations by cache, tier, operation, and result.",
	}, []string{"cache", "tier", "operation", "result"})
	cacheBuildDuration = prometheus.NewHistogramVec(prometheus.HistogramOpts{
		Name:    "pokemon_catalog_cache_build_duration_seconds",
		Help:    "Time spent building Pokemon catalog payloads from PostgreSQL.",
		Buckets: prometheus.DefBuckets,
	}, []string{"cache", "result"})
)

func init() {
	registerCacheCollector(cacheOperations)
	registerCacheCollector(cacheBuildDuration)
}

func registerCacheCollector(collector prometheus.Collector) {
	if err := prometheus.Register(collector); err != nil {
		var alreadyRegistered prometheus.AlreadyRegisteredError
		if errors.As(err, &alreadyRegistered) {
			return
		}
		panic(err)
	}
}

func observeCacheOperation(cacheName, tier, operation, result string) {
	cacheOperations.WithLabelValues(cacheName, tier, operation, result).Inc()
}
