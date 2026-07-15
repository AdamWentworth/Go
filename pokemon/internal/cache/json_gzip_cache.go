package cache

import (
	"bytes"
	"compress/gzip"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strings"
	"sync"
	"time"

	"golang.org/x/sync/singleflight"
)

type JSONGzipCacheConfig struct {
	Name                    string
	BuildPayload            func(ctx context.Context) (any, error)
	Logger                  *slog.Logger
	GzipLevel               int
	Store                   PayloadStore
	StoreTTL                time.Duration
	StoreOperationTimeout   time.Duration
	StoreRevalidateInterval time.Duration
	StoreBuildLockTTL       time.Duration
	StoreBuildWait          time.Duration
}

type Stats struct {
	HasCache        bool      `json:"hasCache"`
	LastBuiltAt     time.Time `json:"lastBuiltAt,omitempty"`
	LastBuildError  string    `json:"lastBuildError,omitempty"`
	BuildCount      int64     `json:"buildCount"`
	BuildErrorCount int64     `json:"buildErrorCount"`
	BytesJSON       int       `json:"bytesJson"`
	BytesGzip       int       `json:"bytesGzip"`
	ETag            string    `json:"etag,omitempty"`
	LastSource      string    `json:"lastSource,omitempty"`
	L1HitCount      int64     `json:"l1HitCount"`
	L2HitCount      int64     `json:"l2HitCount"`
	L2MissCount     int64     `json:"l2MissCount"`
	L2WriteCount    int64     `json:"l2WriteCount"`
	L2ErrorCount    int64     `json:"l2ErrorCount"`
	L2Enabled       bool      `json:"l2Enabled"`
}

// JSONGzipCache caches a JSON payload (and its gzip-compressed form) with an ETag.
// It uses singleflight to ensure at most one build is in-flight at a time.
type JSONGzipCache struct {
	name         string
	buildPayload func(ctx context.Context) (any, error)
	log          *slog.Logger
	gzipLevel    int
	store        PayloadStore
	storeTTL     time.Duration
	storeTimeout time.Duration
	revalidate   time.Duration
	lockTTL      time.Duration
	lockWait     time.Duration

	mu sync.RWMutex
	// cached response data
	jsonBytes      []byte
	gzipBytes      []byte
	etag           string
	lastStoreCheck time.Time

	// stats
	stats Stats

	// coalesce concurrent builds
	sf singleflight.Group
}

func NewJSONGzipCache(cfg JSONGzipCacheConfig) *JSONGzipCache {
	l := cfg.Logger
	if l == nil {
		l = slog.Default()
	}
	level := cfg.GzipLevel
	if level == 0 {
		level = gzip.DefaultCompression
	}
	storeTTL := cfg.StoreTTL
	if storeTTL <= 0 {
		storeTTL = 24 * time.Hour
	}
	storeTimeout := cfg.StoreOperationTimeout
	if storeTimeout <= 0 {
		storeTimeout = 300 * time.Millisecond
	}
	revalidate := cfg.StoreRevalidateInterval
	if revalidate <= 0 {
		revalidate = 5 * time.Second
	}
	lockTTL := cfg.StoreBuildLockTTL
	if lockTTL <= 0 {
		lockTTL = 2 * time.Minute
	}
	lockWait := cfg.StoreBuildWait
	if lockWait <= 0 {
		lockWait = 5 * time.Second
	}
	return &JSONGzipCache{
		name:         cfg.Name,
		buildPayload: cfg.BuildPayload,
		log:          l,
		gzipLevel:    level,
		store:        cfg.Store,
		storeTTL:     storeTTL,
		storeTimeout: storeTimeout,
		revalidate:   revalidate,
		lockTTL:      lockTTL,
		lockWait:     lockWait,
		stats: Stats{
			HasCache:  false,
			L2Enabled: cfg.Store != nil,
		},
	}
}

func (c *JSONGzipCache) Stats() Stats {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.stats
}

func (c *JSONGzipCache) Invalidate() {
	if c == nil {
		return
	}
	c.invalidateMemory()
	if c.store == nil {
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), c.storeTimeout)
	defer cancel()
	if err := c.store.Invalidate(ctx, c.name, c.storeTTL); err != nil {
		c.recordL2Error("invalidate", err)
		return
	}
	observeCacheOperation(c.name, "l2", "invalidate", "success")
}

func (c *JSONGzipCache) invalidateMemory() {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.jsonBytes = nil
	c.gzipBytes = nil
	c.etag = ""
	c.stats.HasCache = false
	c.stats.BytesJSON = 0
	c.stats.BytesGzip = 0
	c.stats.ETag = ""
	c.stats.LastSource = ""
}

// EnsureBuilt ensures the cache is built exactly once per invalidation.
// If multiple goroutines call EnsureBuilt concurrently, only one build executes.
func (c *JSONGzipCache) EnsureBuilt(ctx context.Context) error {
	if c == nil {
		return errors.New("cache is nil")
	}
	if ctx == nil {
		ctx = context.Background()
	}

	if c.hasMemoryPayload() && !c.memoryPayloadStale(ctx) {
		c.recordL1Hit()
		return nil
	}

	_, err, _ := c.sf.Do("build", func() (any, error) {
		// Re-check under lock (another build might have completed while we waited for singleflight).
		if c.hasMemoryPayload() && !c.memoryPayloadStale(ctx) {
			c.recordL1Hit()
			return nil, nil
		}

		if c.store != nil {
			if loaded := c.loadFromStore(ctx); loaded {
				return nil, nil
			}

			lock, acquired, contended := c.acquireBuildLock(ctx)
			if acquired {
				defer c.releaseBuildLock(lock)
			} else if contended && c.waitForStoreBuild(ctx) {
				return nil, nil
			}
		}
		return nil, c.build(ctx)
	})
	return err
}

func (c *JSONGzipCache) build(ctx context.Context) error {
	start := time.Now()
	c.mu.Lock()
	c.stats.BuildCount++
	c.mu.Unlock()

	payload, err := c.buildPayload(ctx)
	if err != nil {
		c.recordBuildError("cache build failed", err, start)
		return err
	}

	raw, err := json.Marshal(payload)
	if err != nil {
		c.recordBuildError("cache json marshal failed", err, start)
		return err
	}

	var gzBuf bytes.Buffer
	gzw, err := gzip.NewWriterLevel(&gzBuf, c.gzipLevel)
	if err != nil {
		c.recordBuildError("cache gzip writer failed", err, start)
		return err
	}
	if _, err := gzw.Write(raw); err != nil {
		_ = gzw.Close()
		c.recordBuildError("cache gzip write failed", err, start)
		return err
	}
	if err := gzw.Close(); err != nil {
		c.recordBuildError("cache gzip close failed", err, start)
		return err
	}

	sum := sha256.Sum256(raw)
	etag := `"` + hex.EncodeToString(sum[:]) + `"`

	entry := StoredPayload{
		JSONBytes: raw,
		GzipBytes: gzBuf.Bytes(),
		ETag:      etag,
		BuiltAt:   time.Now().UTC(),
	}
	c.applyStoredPayload(entry, "postgres")
	cacheBuildDuration.WithLabelValues(c.name, "success").Observe(time.Since(start).Seconds())
	observeCacheOperation(c.name, "postgres", "build", "success")

	c.log.Info("cache built",
		slog.String("name", c.name),
		slog.Duration("duration", time.Since(start)),
		slog.Int("bytes_json", len(raw)),
		slog.Int("bytes_gzip", len(entry.GzipBytes)),
	)
	c.saveToStore(ctx, entry)
	return nil
}

func (c *JSONGzipCache) hasMemoryPayload() bool {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.stats.HasCache
}

func (c *JSONGzipCache) recordL1Hit() {
	c.mu.Lock()
	c.stats.L1HitCount++
	c.mu.Unlock()
	observeCacheOperation(c.name, "l1", "load", "hit")
}

func (c *JSONGzipCache) memoryPayloadStale(ctx context.Context) bool {
	if c.store == nil {
		return false
	}

	c.mu.Lock()
	if time.Since(c.lastStoreCheck) < c.revalidate {
		c.mu.Unlock()
		return false
	}
	c.lastStoreCheck = time.Now()
	localVersion := strings.Trim(c.etag, `"`)
	c.mu.Unlock()

	storeCtx, cancel := c.storeContext(ctx)
	defer cancel()
	version, found, invalidated, err := c.store.CurrentVersion(storeCtx, c.name)
	if err != nil {
		c.recordL2Error("version", err)
		return false
	}
	if !found {
		observeCacheOperation(c.name, "l2", "version", "miss")
		return false
	}
	if !invalidated && version == localVersion {
		observeCacheOperation(c.name, "l2", "version", "current")
		return false
	}

	observeCacheOperation(c.name, "l2", "version", "stale")
	c.invalidateMemory()
	return true
}

func (c *JSONGzipCache) loadFromStore(ctx context.Context) bool {
	storeCtx, cancel := c.storeContext(ctx)
	defer cancel()
	entry, found, err := c.store.Load(storeCtx, c.name)
	if err != nil {
		c.recordL2Error("load", err)
		return false
	}
	if !found {
		c.mu.Lock()
		c.stats.L2MissCount++
		c.mu.Unlock()
		observeCacheOperation(c.name, "l2", "load", "miss")
		return false
	}
	if err := validateStoredPayload(entry); err != nil {
		c.recordL2Error("load_invalid", err)
		return false
	}

	c.applyStoredPayload(entry, "redis")
	c.mu.Lock()
	c.stats.L2HitCount++
	c.mu.Unlock()
	observeCacheOperation(c.name, "l2", "load", "hit")
	c.log.Info("cache restored from Redis", slog.String("name", c.name), slog.Int("bytes_json", len(entry.JSONBytes)))
	return true
}

func (c *JSONGzipCache) saveToStore(ctx context.Context, entry StoredPayload) {
	if c.store == nil {
		return
	}
	storeCtx, cancel := c.storeContext(ctx)
	defer cancel()
	if err := c.store.Save(storeCtx, c.name, entry, c.storeTTL); err != nil {
		c.recordL2Error("save", err)
		return
	}
	c.mu.Lock()
	c.stats.L2WriteCount++
	c.lastStoreCheck = time.Now()
	c.mu.Unlock()
	observeCacheOperation(c.name, "l2", "save", "success")
}

func (c *JSONGzipCache) applyStoredPayload(entry StoredPayload, source string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.jsonBytes = bytes.Clone(entry.JSONBytes)
	c.gzipBytes = bytes.Clone(entry.GzipBytes)
	c.etag = entry.ETag
	c.lastStoreCheck = time.Now()
	c.stats.HasCache = true
	c.stats.LastBuiltAt = entry.BuiltAt
	c.stats.LastBuildError = ""
	c.stats.BytesJSON = len(entry.JSONBytes)
	c.stats.BytesGzip = len(entry.GzipBytes)
	c.stats.ETag = entry.ETag
	c.stats.LastSource = source
}

func (c *JSONGzipCache) acquireBuildLock(ctx context.Context) (BuildLock, bool, bool) {
	storeCtx, cancel := c.storeContext(ctx)
	defer cancel()
	lock, acquired, err := c.store.AcquireBuildLock(storeCtx, c.name, c.lockTTL)
	if err != nil {
		c.recordL2Error("lock", err)
		return nil, false, false
	}
	result := "contended"
	if acquired {
		result = "acquired"
	}
	observeCacheOperation(c.name, "l2", "lock", result)
	return lock, acquired, !acquired
}

func (c *JSONGzipCache) releaseBuildLock(lock BuildLock) {
	if lock == nil {
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), c.storeTimeout)
	defer cancel()
	if err := lock.Release(ctx); err != nil {
		c.recordL2Error("unlock", err)
	}
}

func (c *JSONGzipCache) waitForStoreBuild(ctx context.Context) bool {
	deadline := time.NewTimer(c.lockWait)
	defer deadline.Stop()
	ticker := time.NewTicker(100 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return false
		case <-deadline.C:
			observeCacheOperation(c.name, "l2", "lock_wait", "timeout")
			return false
		case <-ticker.C:
			if c.loadFromStore(ctx) {
				observeCacheOperation(c.name, "l2", "lock_wait", "loaded")
				return true
			}
		}
	}
}

func (c *JSONGzipCache) storeContext(parent context.Context) (context.Context, context.CancelFunc) {
	if parent == nil {
		parent = context.Background()
	}
	return context.WithTimeout(parent, c.storeTimeout)
}

func (c *JSONGzipCache) recordBuildError(message string, err error, start time.Time) {
	c.mu.Lock()
	c.stats.BuildErrorCount++
	c.stats.LastBuildError = err.Error()
	c.stats.HasCache = false
	c.mu.Unlock()
	cacheBuildDuration.WithLabelValues(c.name, "error").Observe(time.Since(start).Seconds())
	observeCacheOperation(c.name, "postgres", "build", "error")
	c.log.Error(message, slog.String("name", c.name), slog.String("err", err.Error()))
}

func (c *JSONGzipCache) recordL2Error(operation string, err error) {
	c.mu.Lock()
	c.stats.L2ErrorCount++
	c.mu.Unlock()
	observeCacheOperation(c.name, "l2", operation, "error")
	c.log.Warn("Redis cache operation failed; continuing without L2", slog.String("name", c.name), slog.String("operation", operation), slog.String("err", err.Error()))
}

func validateStoredPayload(entry StoredPayload) error {
	if len(entry.JSONBytes) == 0 || entry.ETag == "" {
		return errors.New("redis payload is missing JSON bytes or ETag")
	}
	sum := sha256.Sum256(entry.JSONBytes)
	want := `"` + hex.EncodeToString(sum[:]) + `"`
	if entry.ETag != want {
		return fmt.Errorf("redis payload ETag mismatch: got %s want %s", entry.ETag, want)
	}
	return nil
}

// Send serves the cached payload.
//
// Returns:
// - status: the HTTP status written (200/304/503)
// - etag: the cache ETag (if available)
// - gz: whether gzip was served
// - bytes: number of body bytes written
// - err: any write error (e.g., client disconnect)
func (c *JSONGzipCache) Send(w http.ResponseWriter, r *http.Request) (status int, etag string, gz bool, bytes int, err error) {
	if c == nil {
		http.Error(w, "cache not configured", http.StatusServiceUnavailable)
		return http.StatusServiceUnavailable, "", false, 0, nil
	}

	c.mu.RLock()
	has := c.stats.HasCache
	etag = c.etag
	jsonBytes := c.jsonBytes
	gzipBytes := c.gzipBytes
	c.mu.RUnlock()

	if !has || len(jsonBytes) == 0 {
		http.Error(w, "cache not ready", http.StatusServiceUnavailable)
		return http.StatusServiceUnavailable, "", false, 0, nil
	}

	// ETag handling
	if inm := r.Header.Get("If-None-Match"); inm != "" && etag != "" && inm == etag {
		w.Header().Set("ETag", etag)
		w.WriteHeader(http.StatusNotModified)
		return http.StatusNotModified, etag, false, 0, nil
	}

	acceptsGzip := false
	if ae := r.Header.Get("Accept-Encoding"); ae != "" {
		// Accept-Encoding can include q-values; substring match is sufficient for gzip.
		if strings.Contains(strings.ToLower(ae), "gzip") {
			acceptsGzip = true
		}
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("ETag", etag)

	if acceptsGzip && len(gzipBytes) > 0 {
		w.Header().Set("Content-Encoding", "gzip")
		w.Header().Set("Vary", "Accept-Encoding")
		w.WriteHeader(http.StatusOK)
		n, e := w.Write(gzipBytes)
		return http.StatusOK, etag, true, n, e
	}

	w.Header().Set("Vary", "Accept-Encoding")
	w.WriteHeader(http.StatusOK)
	n, e := w.Write(jsonBytes)
	return http.StatusOK, etag, false, n, e
}
