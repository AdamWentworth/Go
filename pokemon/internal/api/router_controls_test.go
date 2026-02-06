package api

import (
	"bytes"
	"compress/gzip"
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"pokemon_data/internal/cache"
	"pokemon_data/internal/config"
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
		// Trust loopback as the "proxy" in tests so X-Forwarded-For is honored.
		TrustedProxyCIDRs: []string{"127.0.0.0/8"},
	}

	h := NewRouter(RouterDeps{
		Cfg:          cfg,
		Logger:       nil,
		DB:           nil,
		PayloadCache: newTestPayloadCache(t),
	})

	// Not allowed IP (spoofed via XFF, but only honored because RemoteAddr is trusted)
	req := httptest.NewRequest(http.MethodGet, "/metrics", nil)
	req.RemoteAddr = "127.0.0.1:12345"
	req.Header.Set("X-Forwarded-For", "8.8.8.8")
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)
	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403 for non-internal ip, got %d", rr.Code)
	}

	// Allowed IP
	req2 := httptest.NewRequest(http.MethodGet, "/metrics", nil)
	req2.RemoteAddr = "127.0.0.1:12345"
	req2.Header.Set("X-Forwarded-For", "10.1.2.3")
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
