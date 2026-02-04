package cache_test

import (
	"bytes"
	"compress/gzip"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"pokemon_data/internal/cache"
)

func TestEnsureBuilt_BuildsOnceUnderConcurrency(t *testing.T) {
	var calls int32
	build := func(ctx context.Context) (any, error) {
		atomic.AddInt32(&calls, 1)
		// Add a tiny delay to increase contention.
		time.Sleep(10 * time.Millisecond)
		return []any{map[string]any{"ok": true}}, nil
	}

	c := cache.NewJSONGzipCache(cache.JSONGzipCacheConfig{
		Name:         "/pokemon/pokemons",
		BuildPayload: build,
		GzipLevel:    6,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	var wg sync.WaitGroup
	for i := 0; i < 20; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			if err := c.EnsureBuilt(ctx); err != nil {
				t.Errorf("EnsureBuilt: %v", err)
			}
		}()
	}
	wg.Wait()

	if got := atomic.LoadInt32(&calls); got != 1 {
		t.Fatalf("expected BuildPayload called once, got %d", got)
	}
}

func TestSend_GzipAndETagAnd304(t *testing.T) {
	build := func(ctx context.Context) (any, error) {
		return []any{map[string]any{"pokemon_id": 1}}, nil
	}

	c := cache.NewJSONGzipCache(cache.JSONGzipCacheConfig{
		Name:         "/pokemon/pokemons",
		BuildPayload: build,
		GzipLevel:    6,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	if err := c.EnsureBuilt(ctx); err != nil {
		t.Fatalf("EnsureBuilt: %v", err)
	}

	// First request with gzip accepted.
	req1 := httptest.NewRequest(http.MethodGet, "/pokemon/pokemons", nil)
	req1.Header.Set("Accept-Encoding", "gzip")
	rr1 := httptest.NewRecorder()
	status, _, enc, hit := c.Send(rr1, req1)

	if !hit {
		t.Fatalf("expected cacheHit=true")
	}
	if status != http.StatusOK {
		t.Fatalf("expected 200, got %d", status)
	}
	if enc != "gzip" {
		t.Fatalf("expected gzip encoding, got %q", enc)
	}
	etag := rr1.Header().Get("ETag")
	if etag == "" {
		t.Fatalf("expected ETag set")
	}
	if rr1.Header().Get("Content-Encoding") != "gzip" {
		t.Fatalf("expected Content-Encoding=gzip, got %q", rr1.Header().Get("Content-Encoding"))
	}

	gr, err := gzip.NewReader(bytes.NewReader(rr1.Body.Bytes()))
	if err != nil {
		t.Fatalf("gzip reader: %v", err)
	}
	defer gr.Close()
	raw, err := io.ReadAll(gr)
	if err != nil {
		t.Fatalf("gzip read: %v", err)
	}
	var v any
	if err := json.Unmarshal(raw, &v); err != nil {
		t.Fatalf("invalid json after gunzip: %v", err)
	}

	// Second request with If-None-Match should be 304.
	req2 := httptest.NewRequest(http.MethodGet, "/pokemon/pokemons", nil)
	req2.Header.Set("If-None-Match", etag)
	rr2 := httptest.NewRecorder()
	status2, n2, enc2, hit2 := c.Send(rr2, req2)

	if !hit2 {
		t.Fatalf("expected cacheHit=true")
	}
	if status2 != http.StatusNotModified {
		t.Fatalf("expected 304, got %d", status2)
	}
	if n2 != 0 {
		t.Fatalf("expected 0 bytesOut for 304, got %d", n2)
	}
	if enc2 != "none" {
		t.Fatalf("expected encoding none for 304, got %q", enc2)
	}
	if rr2.Body.Len() != 0 {
		t.Fatalf("expected empty body for 304, got %d bytes", rr2.Body.Len())
	}
}

func TestSend_IfNoneMatch_ListAndWeakETag(t *testing.T) {
	build := func(ctx context.Context) (any, error) {
		return map[string]any{"ok": true}, nil
	}

	c := cache.NewJSONGzipCache(cache.JSONGzipCacheConfig{
		Name:         "/pokemon/pokemons",
		BuildPayload: build,
		GzipLevel:    6,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	if err := c.EnsureBuilt(ctx); err != nil {
		t.Fatalf("EnsureBuilt: %v", err)
	}

	// First request to get ETag.
	req1 := httptest.NewRequest(http.MethodGet, "/pokemon/pokemons", nil)
	rr1 := httptest.NewRecorder()
	c.Send(rr1, req1)
	etag := rr1.Header().Get("ETag")
	if etag == "" {
		t.Fatalf("expected ETag set")
	}

	// Client sends a list of etags including a weak match.
	req2 := httptest.NewRequest(http.MethodGet, "/pokemon/pokemons", nil)
	req2.Header.Set("If-None-Match", `"nope", W/`+etag+`, "also-nope"`)
	rr2 := httptest.NewRecorder()
	status, _, _, _ := c.Send(rr2, req2)
	if status != http.StatusNotModified {
		t.Fatalf("expected 304, got %d", status)
	}
}

func TestSend_GzipAcceptEncoding_RespectsQ(t *testing.T) {
	build := func(ctx context.Context) (any, error) {
		return map[string]any{"ok": true}, nil
	}

	c := cache.NewJSONGzipCache(cache.JSONGzipCacheConfig{
		Name:         "/pokemon/pokemons",
		BuildPayload: build,
		GzipLevel:    6,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	if err := c.EnsureBuilt(ctx); err != nil {
		t.Fatalf("EnsureBuilt: %v", err)
	}

	// gzip explicitly refused => should NOT gzip.
	req1 := httptest.NewRequest(http.MethodGet, "/pokemon/pokemons", nil)
	req1.Header.Set("Accept-Encoding", "gzip;q=0, br;q=1")
	rr1 := httptest.NewRecorder()
	_, _, enc1, _ := c.Send(rr1, req1)
	if enc1 != "identity" {
		t.Fatalf("expected identity when gzip q=0, got %q", enc1)
	}

	// gzip not listed but "*" allowed => should gzip.
	req2 := httptest.NewRequest(http.MethodGet, "/pokemon/pokemons", nil)
	req2.Header.Set("Accept-Encoding", "br;q=1, *;q=1")
	rr2 := httptest.NewRecorder()
	_, _, enc2, _ := c.Send(rr2, req2)
	if enc2 != "gzip" {
		t.Fatalf("expected gzip when *;q=1, got %q", enc2)
	}
}
