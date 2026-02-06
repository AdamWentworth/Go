package cache

import (
	"bytes"
	"compress/gzip"
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"
)

type JSONGzipCacheConfig struct {
	Name         string
	BuildPayload func(ctx context.Context) (any, error)
	Logger       *slog.Logger
	GzipLevel    int
}

type BuildStats struct {
	Name      string    `json:"name"`
	TotalMs   int64     `json:"totalMs"`
	BuildMs   int64     `json:"buildMs"`
	MarshalMs int64     `json:"marshalMs"`
	GzipMs    int64     `json:"gzipMs"`
	Count     *int      `json:"count,omitempty"`
	JSONBytes int       `json:"jsonBytes"`
	GzipBytes int       `json:"gzipBytes"`
	BuiltAt   time.Time `json:"builtAt"`
}

type Stats struct {
	Name      string      `json:"name"`
	HasCache  bool        `json:"hasCache"`
	ETag      string      `json:"etag,omitempty"`
	BuiltAt   *time.Time  `json:"builtAt,omitempty"`
	LastBuild *BuildStats `json:"lastBuild,omitempty"`
}

type JSONGzipCache struct {
	name         string
	buildPayload func(ctx context.Context) (any, error)
	log          *slog.Logger
	gzipLevel    int

	mu        sync.RWMutex
	jsonB     []byte
	gzipB     []byte
	etag      string
	builtAt   time.Time
	lastBuild *BuildStats

	buildMu sync.Mutex
}

func NewJSONGzipCache(cfg JSONGzipCacheConfig) *JSONGzipCache {
	l := cfg.Logger
	if l == nil {
		l = slog.Default()
	}
	level := cfg.GzipLevel
	if level == 0 {
		level = gzip.BestSpeed
	}
	return &JSONGzipCache{
		name:         cfg.Name,
		buildPayload: cfg.BuildPayload,
		log:          l,
		gzipLevel:    level,
	}
}

func (c *JSONGzipCache) Invalidate() {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.jsonB = nil
	c.gzipB = nil
	c.etag = ""
	c.builtAt = time.Time{}
	c.lastBuild = nil
}

func (c *JSONGzipCache) EnsureBuilt(ctx context.Context) error {
	c.mu.RLock()
	has := len(c.jsonB) > 0 && len(c.gzipB) > 0 && c.etag != ""
	c.mu.RUnlock()
	if has {
		return nil
	}

	c.buildMu.Lock()
	defer c.buildMu.Unlock()

	c.mu.RLock()
	has = len(c.jsonB) > 0 && len(c.gzipB) > 0 && c.etag != ""
	c.mu.RUnlock()
	if has {
		return nil
	}

	if c.buildPayload == nil {
		return errors.New("BuildPayload is nil")
	}

	totalStart := time.Now()
	buildStart := time.Now()
	payload, err := c.buildPayload(ctx)
	if err != nil {
		return err
	}
	buildMs := time.Since(buildStart)

	marshalStart := time.Now()
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	marshalMs := time.Since(marshalStart)

	gzipStart := time.Now()
	gz, err := gzipBytes(body, c.gzipLevel)
	if err != nil {
		return err
	}
	etag := computeStrongETag(body)
	gzipMs := time.Since(gzipStart)
	totalMs := time.Since(totalStart)

	var countPtr *int
	if arr, ok := payload.([]any); ok {
		n := len(arr)
		countPtr = &n
	}

	stats := &BuildStats{
		Name:      c.name,
		TotalMs:   totalMs.Milliseconds(),
		BuildMs:   buildMs.Milliseconds(),
		MarshalMs: marshalMs.Milliseconds(),
		GzipMs:    gzipMs.Milliseconds(),
		Count:     countPtr,
		JSONBytes: len(body),
		GzipBytes: len(gz),
		BuiltAt:   time.Now(),
	}

	c.mu.Lock()
	c.jsonB = body
	c.gzipB = gz
	c.etag = etag
	c.builtAt = stats.BuiltAt
	c.lastBuild = stats
	c.mu.Unlock()

	count := 0
	if stats.Count != nil {
		count = *stats.Count
	}
	c.log.Info(fmt.Sprintf(
		"Cache build complete (%s): total=%dms (db+compose=%dms, stringify=%dms, gzip+etag=%dms), count=%d, json=%dB, gz=%dB",
		c.name,
		stats.TotalMs,
		stats.BuildMs,
		stats.MarshalMs,
		stats.GzipMs,
		count,
		stats.JSONBytes,
		stats.GzipBytes,
	))

	return nil
}

func (c *JSONGzipCache) Send(w http.ResponseWriter, r *http.Request) (status int, bytesOut int, encoding string, cacheHit bool, err error) {
	c.mu.RLock()
	body := c.jsonB
	gz := c.gzipB
	etag := c.etag
	builtAt := c.builtAt
	c.mu.RUnlock()

	cacheHit = len(body) > 0 && etag != ""
	if !cacheHit {
		http.Error(w, "cache not ready", http.StatusServiceUnavailable)
		return http.StatusServiceUnavailable, 0, "none", false, errors.New("cache not ready")
	}

	if inm := r.Header.Get("If-None-Match"); inm != "" && ifNoneMatch(etag, inm) {
		setCommonHeaders(w, etag, builtAt)
		w.WriteHeader(http.StatusNotModified)
		return http.StatusNotModified, 0, "none", true, nil
	}

	setCommonHeaders(w, etag, builtAt)
	w.Header().Set("Content-Type", "application/json; charset=utf-8")

	if acceptsGzip(r) && len(gz) > 0 {
		w.Header().Set("Content-Encoding", "gzip")
		w.WriteHeader(http.StatusOK)
		n, werr := w.Write(gz)
		if werr != nil {
			return http.StatusOK, n, "gzip", true, werr
		}
		return http.StatusOK, n, "gzip", true, nil
	}

	w.WriteHeader(http.StatusOK)
	n, werr := w.Write(body)
	if werr != nil {
		return http.StatusOK, n, "identity", true, werr
	}
	return http.StatusOK, n, "identity", true, nil
}

func (c *JSONGzipCache) Stats() Stats {
	c.mu.RLock()
	defer c.mu.RUnlock()
	var bt *time.Time
	if !c.builtAt.IsZero() {
		t := c.builtAt
		bt = &t
	}
	return Stats{
		Name:      c.name,
		HasCache:  len(c.jsonB) > 0 && len(c.gzipB) > 0 && c.etag != "",
		ETag:      c.etag,
		BuiltAt:   bt,
		LastBuild: c.lastBuild,
	}
}

func computeStrongETag(body []byte) string {
	sum := sha256.Sum256(body)
	b64 := base64.StdEncoding.EncodeToString(sum[:])
	return `"` + b64 + `"`
}

func ifNoneMatch(currentETag, headerVal string) bool {
	if currentETag == "" {
		return false
	}
	h := strings.TrimSpace(headerVal)
	if h == "*" {
		return true
	}
	for _, part := range strings.Split(h, ",") {
		tok := strings.TrimSpace(part)
		if tok == "" {
			continue
		}
		if strings.HasPrefix(tok, "W/") {
			tok = strings.TrimSpace(strings.TrimPrefix(tok, "W/"))
		}
		if tok == currentETag {
			return true
		}
	}
	return false
}

func acceptsGzip(r *http.Request) bool {
	ae := r.Header.Get("Accept-Encoding")
	if ae == "" {
		return false
	}

	gzipQ := -1.0
	starQ := -1.0

	for _, part := range strings.Split(ae, ",") {
		p := strings.TrimSpace(part)
		if p == "" {
			continue
		}
		coding, params, _ := strings.Cut(p, ";")
		coding = strings.ToLower(strings.TrimSpace(coding))
		q := 1.0
		if params != "" {
			for _, param := range strings.Split(params, ";") {
				param = strings.TrimSpace(param)
				if strings.HasPrefix(param, "q=") {
					if v, err := strconv.ParseFloat(strings.TrimPrefix(param, "q="), 64); err == nil {
						q = v
					}
				}
			}
		}

		if coding == "gzip" {
			gzipQ = q
		} else if coding == "*" {
			starQ = q
		}
	}

	if gzipQ >= 0 {
		return gzipQ > 0
	}
	if starQ >= 0 {
		return starQ > 0
	}
	return false
}

func setCommonHeaders(w http.ResponseWriter, etag string, builtAt time.Time) {
	w.Header().Set("Cache-Control", "public, max-age=60")
	w.Header().Set("ETag", etag)
	if !builtAt.IsZero() {
		w.Header().Set("Last-Modified", builtAt.UTC().Format(http.TimeFormat))
	}
}

func gzipBytes(b []byte, level int) ([]byte, error) {
	var buf bytes.Buffer
	zw, err := gzip.NewWriterLevel(&buf, level)
	if err != nil {
		return nil, err
	}
	if _, err := zw.Write(b); err != nil {
		_ = zw.Close()
		return nil, err
	}
	if err := zw.Close(); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}
