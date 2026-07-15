package config

import (
	"testing"
	"time"
)

func TestLoadRedisDefaults(t *testing.T) {
	for _, key := range []string{
		"REDIS_URL",
		"REDIS_KEY_PREFIX",
		"REDIS_CACHE_TTL",
		"REDIS_OPERATION_TIMEOUT",
		"REDIS_REVALIDATE_INTERVAL",
		"REDIS_BUILD_LOCK_TTL",
		"REDIS_BUILD_WAIT",
	} {
		t.Setenv(key, "")
	}

	cfg := Load()
	if cfg.RedisURL != "" || cfg.RedisKeyPrefix != "pokegonexus:pokemon:v1" {
		t.Fatalf("unexpected Redis defaults: URL=%q prefix=%q", cfg.RedisURL, cfg.RedisKeyPrefix)
	}
	if cfg.RedisCacheTTL != 24*time.Hour || cfg.RedisOpTimeout != 300*time.Millisecond || cfg.RedisRevalidate != 5*time.Second {
		t.Fatalf("unexpected Redis timing defaults: %+v", cfg)
	}
	if cfg.RedisBuildLockTTL != 2*time.Minute || cfg.RedisBuildWait != 5*time.Second {
		t.Fatalf("unexpected Redis build coordination defaults: %+v", cfg)
	}
}

func TestLoadRedisOverrides(t *testing.T) {
	t.Setenv("REDIS_URL", "redis://cache.internal:6379/4")
	t.Setenv("REDIS_KEY_PREFIX", "custom:catalog")
	t.Setenv("REDIS_CACHE_TTL", "2h")
	t.Setenv("REDIS_OPERATION_TIMEOUT", "750ms")
	t.Setenv("REDIS_REVALIDATE_INTERVAL", "9s")
	t.Setenv("REDIS_BUILD_LOCK_TTL", "90s")
	t.Setenv("REDIS_BUILD_WAIT", "7s")

	cfg := Load()
	if cfg.RedisURL != "redis://cache.internal:6379/4" || cfg.RedisKeyPrefix != "custom:catalog" {
		t.Fatalf("Redis identity overrides not loaded: %+v", cfg)
	}
	if cfg.RedisCacheTTL != 2*time.Hour || cfg.RedisOpTimeout != 750*time.Millisecond || cfg.RedisRevalidate != 9*time.Second {
		t.Fatalf("Redis timing overrides not loaded: %+v", cfg)
	}
	if cfg.RedisBuildLockTTL != 90*time.Second || cfg.RedisBuildWait != 7*time.Second {
		t.Fatalf("Redis coordination overrides not loaded: %+v", cfg)
	}
}
