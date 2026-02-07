package api

import (
	"bytes"
	"compress/gzip"
	"context"
	"database/sql"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"pokemon_data/internal/cache"
	"pokemon_data/internal/config"

	_ "modernc.org/sqlite"
)

// helper: make a cache that can serve /pokemon/pokemons successfully.
func newTestPayloadCache(t *testing.T) *cache.JSONGzipCache {
	t.Helper()

	build := func(ctx context.Context) (any, error) {
		// Minimal payload
		return []any{map[string]any{"pokemon_id": 1}}, nil
	}

	return cache.NewJSONGzipCache(cache.JSONGzipCacheConfig{
		Name:         "/pokemon/pokemons",
		BuildPayload: build,
		GzipLevel:    6,
	})
}

func TestInternalOnlyMetrics(t *testing.T) {
	cfg := config.Config{
		CacheBuildTimeout:   2 * time.Second,
		AllowedOrigins:      []string{"http://localhost:3000"},
		AllowCloudflareSub:  false,
		InternalOnlyEnabled: true,
		InternalOnlyCIDRs:   []string{"10.0.0.0/8"},
	}

	h := NewRouter(RouterDeps{
		Cfg:          cfg,
		Logger:       nil,
		DB:           nil,
		PayloadCache: newTestPayloadCache(t),
	})

	// Not allowed: forwarded headers are ignored for internal-only checks.
	req := httptest.NewRequest(http.MethodGet, "/metrics", nil)
	req.RemoteAddr = "8.8.8.8:12345"
	req.Header.Set("X-Forwarded-For", "10.1.2.3")
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)
	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403 for non-internal ip, got %d", rr.Code)
	}

	// Allowed by immediate peer IP.
	req2 := httptest.NewRequest(http.MethodGet, "/metrics", nil)
	req2.RemoteAddr = "10.1.2.3:12345"
	req2.Header.Set("X-Forwarded-For", "8.8.8.8")
	rr2 := httptest.NewRecorder()
	h.ServeHTTP(rr2, req2)
	if rr2.Code != http.StatusOK {
		t.Fatalf("expected 200 for internal ip, got %d, body=%q", rr2.Code, rr2.Body.String())
	}
	if rr2.Body.Len() == 0 {
		t.Fatalf("expected non-empty metrics body")
	}
}

func TestRateLimitPokemonEndpoint(t *testing.T) {
	cfg := config.Config{
		CacheBuildTimeout:   2 * time.Second,
		AllowedOrigins:      []string{"http://localhost:3000"},
		AllowCloudflareSub:  false,
		InternalOnlyEnabled: false, // irrelevant here
		RateLimitEnabled:    true,
		RateLimitRPS:        0.0001, // essentially "no refill" during test
		RateLimitBurst:      1,
		CachePrewarm:        false,
		CacheRefreshToken:   "",
		TrustedProxyCIDRs:   []string{"127.0.0.0/8"},
	}

	h := NewRouter(RouterDeps{
		Cfg:          cfg,
		Logger:       nil,
		DB:           nil,
		PayloadCache: newTestPayloadCache(t),
	})

	// First request should pass.
	req1 := httptest.NewRequest(http.MethodGet, "/pokemon/pokemons", nil)
	req1.RemoteAddr = "127.0.0.1:12345"
	req1.Header.Set("X-Forwarded-For", "203.0.113.10")
	rr1 := httptest.NewRecorder()
	h.ServeHTTP(rr1, req1)
	if rr1.Code != http.StatusOK {
		t.Fatalf("expected 200 first request, got %d body=%q", rr1.Code, rr1.Body.String())
	}

	// Second immediate request should be limited.
	req2 := httptest.NewRequest(http.MethodGet, "/pokemon/pokemons", nil)
	req2.RemoteAddr = "127.0.0.1:12345"
	req2.Header.Set("X-Forwarded-For", "203.0.113.10")
	rr2 := httptest.NewRecorder()
	h.ServeHTTP(rr2, req2)
	if rr2.Code != http.StatusTooManyRequests {
		t.Fatalf("expected 429 second request, got %d body=%q", rr2.Code, rr2.Body.String())
	}
}

func TestPokemonEndpointReturnsGzipWhenAccepted(t *testing.T) {
	cfg := config.Config{
		CacheBuildTimeout:   2 * time.Second,
		AllowedOrigins:      []string{"http://localhost:3000"},
		AllowCloudflareSub:  false,
		InternalOnlyEnabled: false,
		RateLimitEnabled:    false,
		CachePrewarm:        false,
	}

	h := NewRouter(RouterDeps{
		Cfg:          cfg,
		Logger:       nil,
		DB:           nil,
		PayloadCache: newTestPayloadCache(t),
	})

	req := httptest.NewRequest(http.MethodGet, "/pokemon/pokemons", nil)
	req.Header.Set("Accept-Encoding", "gzip")
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 got %d", rr.Code)
	}
	if rr.Header().Get("Content-Encoding") != "gzip" {
		t.Fatalf("expected gzip encoding, got %q", rr.Header().Get("Content-Encoding"))
	}

	zr, err := gzip.NewReader(bytes.NewReader(rr.Body.Bytes()))
	if err != nil {
		t.Fatalf("gzip reader: %v", err)
	}
	defer zr.Close()
	raw, err := io.ReadAll(zr)
	if err != nil {
		t.Fatalf("read gunzip: %v", err)
	}
	if len(raw) == 0 {
		t.Fatalf("expected non-empty json")
	}
}

func newReadyzTestDB(t *testing.T) *sql.DB {
	t.Helper()
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatalf("open sqlite memory db: %v", err)
	}
	return db
}

func TestReadyzCacheNotReadyWhenPrewarmEnabled(t *testing.T) {
	cfg := config.Config{
		CacheBuildTimeout: 2 * time.Second,
		CachePrewarm:      true,
	}

	db := newReadyzTestDB(t)
	defer db.Close()

	h := NewRouter(RouterDeps{
		Cfg:          cfg,
		Logger:       nil,
		DB:           db,
		PayloadCache: newTestPayloadCache(t),
	})

	req := httptest.NewRequest(http.MethodGet, "/readyz", nil)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)
	if rr.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected 503, got %d body=%q", rr.Code, rr.Body.String())
	}
	if !strings.Contains(rr.Body.String(), "cache not ready") {
		t.Fatalf("expected cache not ready message, got %q", rr.Body.String())
	}
}

func TestReadyzOKWhenDBAndCacheReady(t *testing.T) {
	cfg := config.Config{
		CacheBuildTimeout: 2 * time.Second,
		CachePrewarm:      true,
	}

	db := newReadyzTestDB(t)
	defer db.Close()

	c := newTestPayloadCache(t)
	if err := c.EnsureBuilt(context.Background()); err != nil {
		t.Fatalf("prebuild cache: %v", err)
	}

	h := NewRouter(RouterDeps{
		Cfg:          cfg,
		Logger:       nil,
		DB:           db,
		PayloadCache: c,
	})

	req := httptest.NewRequest(http.MethodGet, "/readyz", nil)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d body=%q", rr.Code, rr.Body.String())
	}
	if !strings.Contains(rr.Body.String(), `"ok":true`) {
		t.Fatalf("expected ok=true in response, got %q", rr.Body.String())
	}
}

func TestInternalCacheRefreshRequiresToken(t *testing.T) {
	cfg := config.Config{
		CacheBuildTimeout:   2 * time.Second,
		InternalOnlyEnabled: true,
		InternalOnlyCIDRs:   []string{"127.0.0.0/8"},
		CacheRefreshToken:   "secret-token",
	}

	h := NewRouter(RouterDeps{
		Cfg:          cfg,
		Logger:       nil,
		DB:           nil,
		PayloadCache: newTestPayloadCache(t),
	})

	// Missing token => forbidden.
	req1 := httptest.NewRequest(http.MethodPost, "/internal/cache/refresh", nil)
	req1.RemoteAddr = "127.0.0.1:12345"
	rr1 := httptest.NewRecorder()
	h.ServeHTTP(rr1, req1)
	if rr1.Code != http.StatusForbidden {
		t.Fatalf("expected 403 without token, got %d", rr1.Code)
	}

	// Correct token => no content.
	req2 := httptest.NewRequest(http.MethodPost, "/internal/cache/refresh", nil)
	req2.RemoteAddr = "127.0.0.1:12345"
	req2.Header.Set("X-Cache-Refresh-Token", "secret-token")
	rr2 := httptest.NewRecorder()
	h.ServeHTTP(rr2, req2)
	if rr2.Code != http.StatusNoContent {
		t.Fatalf("expected 204 with token, got %d", rr2.Code)
	}
}
