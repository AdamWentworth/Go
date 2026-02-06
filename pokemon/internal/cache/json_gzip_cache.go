package cache

import (
	"bytes"
	"compress/gzip"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"sync"
	"time"

	"strings"

	"golang.org/x/sync/singleflight"
)

type JSONGzipCacheConfig struct {
	Name         string
	BuildPayload func(ctx context.Context) (any, error)
	Logger       *slog.Logger
	GzipLevel    int
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
}

// JSONGzipCache caches a JSON payload (and its gzip-compressed form) with an ETag.
// It uses singleflight to ensure at most one build is in-flight at a time.
type JSONGzipCache struct {
	name         string
	buildPayload func(ctx context.Context) (any, error)
	log          *slog.Logger
	gzipLevel    int

	mu sync.RWMutex
	// cached response data
	jsonBytes []byte
	gzipBytes []byte
	etag      string

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
	return &JSONGzipCache{
		name:         cfg.Name,
		buildPayload: cfg.BuildPayload,
		log:          l,
		gzipLevel:    level,
		stats: Stats{
			HasCache: false,
		},
	}
}

func (c *JSONGzipCache) Stats() Stats {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.stats
}

func (c *JSONGzipCache) Invalidate() {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.jsonBytes = nil
	c.gzipBytes = nil
	c.etag = ""
	c.stats.HasCache = false
	c.stats.BytesJSON = 0
	c.stats.BytesGzip = 0
	c.stats.ETag = ""
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

	// Fast path: already built
	c.mu.RLock()
	has := c.stats.HasCache
	c.mu.RUnlock()
	if has {
		return nil
	}

	_, err, _ := c.sf.Do("build", func() (any, error) {
		// Re-check under lock (another build might have completed while we waited for singleflight).
		c.mu.RLock()
		has2 := c.stats.HasCache
		c.mu.RUnlock()
		if has2 {
			return nil, nil
		}
		return nil, c.build(ctx)
	})
	return err
}

func (c *JSONGzipCache) build(ctx context.Context) error {
	start := time.Now()

	payload, err := c.buildPayload(ctx)
	c.mu.Lock()
	defer c.mu.Unlock()

	c.stats.BuildCount++
	if err != nil {
		c.stats.BuildErrorCount++
		c.stats.LastBuildError = err.Error()
		// Keep cache invalid on build failures
		c.stats.HasCache = false
		c.log.Error("cache build failed", slog.String("name", c.name), slog.String("err", err.Error()))
		return err
	}

	raw, err := json.Marshal(payload)
	if err != nil {
		c.stats.BuildErrorCount++
		c.stats.LastBuildError = err.Error()
		c.stats.HasCache = false
		c.log.Error("cache json marshal failed", slog.String("name", c.name), slog.String("err", err.Error()))
		return err
	}

	var gzBuf bytes.Buffer
	gzw, err := gzip.NewWriterLevel(&gzBuf, c.gzipLevel)
	if err != nil {
		c.stats.BuildErrorCount++
		c.stats.LastBuildError = err.Error()
		c.stats.HasCache = false
		c.log.Error("cache gzip writer failed", slog.String("name", c.name), slog.String("err", err.Error()))
		return err
	}
	if _, err := gzw.Write(raw); err != nil {
		_ = gzw.Close()
		c.stats.BuildErrorCount++
		c.stats.LastBuildError = err.Error()
		c.stats.HasCache = false
		c.log.Error("cache gzip write failed", slog.String("name", c.name), slog.String("err", err.Error()))
		return err
	}
	if err := gzw.Close(); err != nil {
		c.stats.BuildErrorCount++
		c.stats.LastBuildError = err.Error()
		c.stats.HasCache = false
		c.log.Error("cache gzip close failed", slog.String("name", c.name), slog.String("err", err.Error()))
		return err
	}

	sum := sha256.Sum256(raw)
	etag := `"` + hex.EncodeToString(sum[:]) + `"`

	c.jsonBytes = raw
	c.gzipBytes = gzBuf.Bytes()
	c.etag = etag

	c.stats.HasCache = true
	c.stats.LastBuiltAt = time.Now()
	c.stats.LastBuildError = ""
	c.stats.BytesJSON = len(raw)
	c.stats.BytesGzip = len(c.gzipBytes)
	c.stats.ETag = etag

	c.log.Info("cache built",
		slog.String("name", c.name),
		slog.Duration("duration", time.Since(start)),
		slog.Int("bytes_json", len(raw)),
		slog.Int("bytes_gzip", len(c.gzipBytes)),
	)
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

