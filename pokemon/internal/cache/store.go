package cache

import (
	"context"
	"time"
)

// StoredPayload is the immutable representation persisted by an L2 cache.
// ETag is the content version used by both HTTP clients and Redis pointers.
type StoredPayload struct {
	JSONBytes []byte
	GzipBytes []byte
	ETag      string
	BuiltAt   time.Time
}

// BuildLock coordinates cold builds across API replicas. Failure to acquire
// or release a lock must never prevent the caller from falling back to a local
// PostgreSQL build.
type BuildLock interface {
	Release(ctx context.Context) error
}

// PayloadStore is the optional L2 boundary used by JSONGzipCache. Implementors
// keep payload versions immutable and expose a lightweight current-version
// pointer for cross-replica invalidation checks.
type PayloadStore interface {
	Load(ctx context.Context, cacheName string) (StoredPayload, bool, error)
	CurrentVersion(ctx context.Context, cacheName string) (version string, found bool, invalidated bool, err error)
	Save(ctx context.Context, cacheName string, payload StoredPayload, ttl time.Duration) error
	Invalidate(ctx context.Context, cacheName string, ttl time.Duration) error
	AcquireBuildLock(ctx context.Context, cacheName string, ttl time.Duration) (BuildLock, bool, error)
	Ping(ctx context.Context) error
	Close() error
}
