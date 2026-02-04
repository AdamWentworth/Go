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

	// Matches current JSONGzipCacheConfig signature:
	// BuildPayload: func(ctx context.Context) (any, error)
	b := func(ctx context.Context) (any, error) {
		return map[string]any{"ok": true}, nil
	}

	return cache.NewJSONGzipCache(cache.JSONGzipCacheConfig{
		Name:         "/pokemon/pokemons",
		BuildPayload: b,
		GzipLevel:    gzip.BestSpeed,
	})
}

func TestInternalOnlyBlocksMetrics(t *testing.T) {
	cfg := config.Config{
		CacheBuildTimeout:   2 * time.Second,
		AllowedOrigins:      []string{"http://localhost:3000"},
		AllowCloudflareSub:  false,
		InternalOnlyEnabled: true,
		InternalOnlyCIDRs:   []string{"10.0.0.0/8"}, // allow only 10/8 for this test
		RateLimitEnabled:    false,
		CachePrewarm:        false,
		CacheRefreshToken:   "",
	}

	h := NewRouter(RouterDeps{
		Cfg:          cfg,
		Logger:       nil,
		DB:           nil,
		PayloadCache: newTestPayloadCache(t),
	})

	// Not allowed IP
	req := httptest.NewRequest(http.MethodGet, "/metrics", nil)
	req.Header.Set("X-Forwarded-For", "8.8.8.8")
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)
	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403 for non-internal ip, got %d", rr.Code)
	}

	// Allowed IP
	req2 := httptest.NewRequest(http.MethodGet, "/metrics", nil)
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
	}

	h := NewRouter(RouterDeps{
		Cfg:          cfg,
		Logger:       nil,
		DB:           nil,
		PayloadCache: newTestPayloadCache(t),
	})

	// First request should pass.
	req1 := httptest.NewRequest(http.MethodGet, "/pokemon/pokemons", nil)
	req1.Header.Set("X-Forwarded-For", "203.0.113.10")
	rr1 := httptest.NewRecorder()
	h.ServeHTTP(rr1, req1)
	if rr1.Code != http.StatusOK {
		t.Fatalf("expected 200 first request, got %d body=%q", rr1.Code, rr1.Body.String())
	}

	// Second immediate request should be limited.
	req2 := httptest.NewRequest(http.MethodGet, "/pokemon/pokemons", nil)
	req2.Header.Set("X-Forwarded-For", "203.0.113.10")
	rr2 := httptest.NewRecorder()
	h.ServeHTTP(rr2, req2)
	if rr2.Code != http.StatusTooManyRequests {
		t.Fatalf("expected 429 second request, got %d body=%q", rr2.Code, rr2.Body.String())
	}
}

func TestPprofMounted(t *testing.T) {
	cfg := config.Config{
		CacheBuildTimeout:   2 * time.Second,
		AllowedOrigins:      []string{"http://localhost:3000"},
		AllowCloudflareSub:  false,
		InternalOnlyEnabled: false, // allow direct access in this test
		RateLimitEnabled:    false,
		CachePrewarm:        false,
		CacheRefreshToken:   "",
	}

	h := NewRouter(RouterDeps{
		Cfg:          cfg,
		Logger:       nil,
		DB:           nil,
		PayloadCache: newTestPayloadCache(t),
	})

	req := httptest.NewRequest(http.MethodGet, "/debug/pprof/", nil)
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)

	// pprof index returns 200 and HTML
	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200 from /debug/pprof/, got %d body=%q", rr.Code, rr.Body.String())
	}
	if !bytes.Contains(rr.Body.Bytes(), []byte("pprof")) {
		t.Fatalf("expected pprof page content, got %q", rr.Body.String())
	}
}

// Sanity: /pokemon/pokemons returns gzip when client requests it.
func TestPokemonEndpointGzipNegotiation(t *testing.T) {
	cfg := config.Config{
		CacheBuildTimeout:   2 * time.Second,
		AllowedOrigins:      []string{"http://localhost:3000"},
		AllowCloudflareSub:  false,
		InternalOnlyEnabled: false,
		RateLimitEnabled:    false,
		CachePrewarm:        false,
		CacheRefreshToken:   "",
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
		t.Fatalf("expected 200, got %d body=%q", rr.Code, rr.Body.String())
	}
	if rr.Header().Get("Content-Encoding") != "gzip" {
		t.Fatalf("expected gzip Content-Encoding, got %q", rr.Header().Get("Content-Encoding"))
	}

	// Ensure body is valid gzip
	gr, err := gzip.NewReader(bytes.NewReader(rr.Body.Bytes()))
	if err != nil {
		t.Fatalf("gzip reader: %v", err)
	}
	defer gr.Close()
	_, err = io.ReadAll(gr)
	if err != nil {
		t.Fatalf("read gzip: %v", err)
	}
}
