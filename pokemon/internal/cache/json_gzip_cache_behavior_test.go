package cache

import (
	"bytes"
	"compress/gzip"
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestEnsureBuiltNilCache(t *testing.T) {
	var c *JSONGzipCache
	if err := c.EnsureBuilt(context.Background()); err == nil {
		t.Fatalf("expected error for nil cache")
	}
}

func TestSendNilCacheReturns503(t *testing.T) {
	var c *JSONGzipCache

	req := httptest.NewRequest(http.MethodGet, "/x", nil)
	rr := httptest.NewRecorder()
	status, _, _, _, _ := c.Send(rr, req)
	if status != http.StatusServiceUnavailable {
		t.Fatalf("expected 503, got %d", status)
	}
}

func TestEnsureBuiltBuildFailureUpdatesStats(t *testing.T) {
	c := NewJSONGzipCache(JSONGzipCacheConfig{
		Name: "/x",
		BuildPayload: func(context.Context) (any, error) {
			return nil, errors.New("boom")
		},
	})

	err := c.EnsureBuilt(context.Background())
	if err == nil {
		t.Fatalf("expected build error")
	}

	st := c.Stats()
	if st.HasCache {
		t.Fatalf("expected HasCache=false after build failure")
	}
	if st.BuildCount != 1 {
		t.Fatalf("expected BuildCount=1 got %d", st.BuildCount)
	}
	if st.BuildErrorCount != 1 {
		t.Fatalf("expected BuildErrorCount=1 got %d", st.BuildErrorCount)
	}
	if st.LastBuildError == "" {
		t.Fatalf("expected LastBuildError to be set")
	}
}

func TestInvalidateClearsBuiltCache(t *testing.T) {
	c := NewJSONGzipCache(JSONGzipCacheConfig{
		Name: "/x",
		BuildPayload: func(context.Context) (any, error) {
			return map[string]any{"ok": true}, nil
		},
	})

	if err := c.EnsureBuilt(context.Background()); err != nil {
		t.Fatalf("EnsureBuilt err: %v", err)
	}
	if !c.Stats().HasCache {
		t.Fatalf("expected HasCache=true after successful build")
	}

	c.Invalidate()
	st := c.Stats()
	if st.HasCache {
		t.Fatalf("expected HasCache=false after invalidate")
	}
	if st.BytesJSON != 0 || st.BytesGzip != 0 {
		t.Fatalf("expected byte sizes reset after invalidate, got json=%d gzip=%d", st.BytesJSON, st.BytesGzip)
	}
	if st.ETag != "" {
		t.Fatalf("expected ETag cleared after invalidate")
	}
}

func TestSendJSONGzipAndNotModified(t *testing.T) {
	c := NewJSONGzipCache(JSONGzipCacheConfig{
		Name: "/x",
		BuildPayload: func(context.Context) (any, error) {
			return map[string]any{"pokemon_id": 1, "name": "Bulbasaur"}, nil
		},
		GzipLevel: 6,
	})
	if err := c.EnsureBuilt(context.Background()); err != nil {
		t.Fatalf("EnsureBuilt err: %v", err)
	}

	// Plain JSON response.
	req1 := httptest.NewRequest(http.MethodGet, "/x", nil)
	rr1 := httptest.NewRecorder()
	status1, etag, gz1, n1, err1 := c.Send(rr1, req1)
	if err1 != nil {
		t.Fatalf("Send plain err: %v", err1)
	}
	if status1 != http.StatusOK {
		t.Fatalf("expected 200 for plain response got %d", status1)
	}
	if gz1 {
		t.Fatalf("expected plain response, got gzip=true")
	}
	if n1 <= 0 {
		t.Fatalf("expected positive body bytes, got %d", n1)
	}
	if rr1.Header().Get("ETag") == "" || etag == "" {
		t.Fatalf("expected ETag on plain response")
	}

	// Gzip response.
	req2 := httptest.NewRequest(http.MethodGet, "/x", nil)
	req2.Header.Set("Accept-Encoding", "gzip")
	rr2 := httptest.NewRecorder()
	status2, _, gz2, _, err2 := c.Send(rr2, req2)
	if err2 != nil {
		t.Fatalf("Send gzip err: %v", err2)
	}
	if status2 != http.StatusOK {
		t.Fatalf("expected 200 for gzip response got %d", status2)
	}
	if !gz2 {
		t.Fatalf("expected gzip response")
	}
	if rr2.Header().Get("Content-Encoding") != "gzip" {
		t.Fatalf("expected Content-Encoding=gzip got %q", rr2.Header().Get("Content-Encoding"))
	}
	gr, err := gzip.NewReader(bytes.NewReader(rr2.Body.Bytes()))
	if err != nil {
		t.Fatalf("gzip reader err: %v", err)
	}
	defer gr.Close()
	raw, err := io.ReadAll(gr)
	if err != nil {
		t.Fatalf("gzip read err: %v", err)
	}
	var decoded map[string]any
	if err := json.Unmarshal(raw, &decoded); err != nil {
		t.Fatalf("invalid json after gunzip: %v", err)
	}
	if _, ok := decoded["pokemon_id"]; !ok {
		t.Fatalf("decoded payload missing pokemon_id")
	}

	// Not modified with matching ETag.
	req3 := httptest.NewRequest(http.MethodGet, "/x", nil)
	req3.Header.Set("If-None-Match", etag)
	rr3 := httptest.NewRecorder()
	status3, _, _, n3, err3 := c.Send(rr3, req3)
	if err3 != nil {
		t.Fatalf("Send 304 err: %v", err3)
	}
	if status3 != http.StatusNotModified {
		t.Fatalf("expected 304, got %d", status3)
	}
	if n3 != 0 {
		t.Fatalf("expected 0 bytes for 304, got %d", n3)
	}
}
