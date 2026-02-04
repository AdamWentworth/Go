package api_test

import (
	"bytes"
	"compress/gzip"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"pokemon_data/internal/api"
	"pokemon_data/internal/cache"
	"pokemon_data/internal/config"
)

// buildSmallPayload returns a tiny payload so tests don't depend on a local sqlite DB.
func buildSmallPayload(ctx context.Context) (any, error) {
	return []any{
		map[string]any{"pokemon_id": 1, "name": "Bulbasaur", "costumes": []any{}, "moves": []any{}, "fusion": []any{}, "backgrounds": []any{}, "megaEvolutions": []any{}, "raid_boss": []any{}, "max": []any{}, "female_data": nil, "sizes": nil, "evolutionData": map[string]any{}},
	}, nil
}

func newTestRouter(t *testing.T) http.Handler {
	t.Helper()

	cfg := config.Config{
		Port:               3001,
		Env:                "test",
		SQLitePath:         "",
		CachePrewarm:       false,
		CacheRefreshToken:  "",
		CacheBuildTimeout:  5 * time.Second,
		AllowedOrigins:     []string{"http://localhost:3000"},
		AllowCloudflareSub: false,
		// LogLevel omitted: router doesn't require it
	}

	c := cache.NewJSONGzipCache(cache.JSONGzipCacheConfig{
		Name:         "/pokemon/pokemons",
		BuildPayload: buildSmallPayload,
		GzipLevel:    6,
	})

	return api.NewRouter(api.RouterDeps{
		Cfg:          cfg,
		Logger:       nil,
		PayloadCache: c,
	})
}

func TestPokemonPokemons_OK_JSON(t *testing.T) {
	r := newTestRouter(t)

	req := httptest.NewRequest(http.MethodGet, "/pokemon/pokemons", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	rr := httptest.NewRecorder()

	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("status=%d body=%s", rr.Code, rr.Body.String())
	}
	ct := rr.Header().Get("Content-Type")
	if ct == "" || ct[:16] != "application/json" {
		t.Fatalf("expected application/json content-type, got %q", ct)
	}
	if rr.Header().Get("ETag") == "" {
		t.Fatalf("expected ETag to be set")
	}
}

func TestPokemonPokemons_GzipWhenAccepted(t *testing.T) {
	r := newTestRouter(t)

	req := httptest.NewRequest(http.MethodGet, "/pokemon/pokemons", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	req.Header.Set("Accept-Encoding", "gzip")
	rr := httptest.NewRecorder()

	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("status=%d body=%s", rr.Code, rr.Body.String())
	}
	if rr.Header().Get("Content-Encoding") != "gzip" {
		t.Fatalf("expected gzip content-encoding, got %q", rr.Header().Get("Content-Encoding"))
	}

	// Decompress and ensure it's valid JSON.
	gr, err := gzip.NewReader(bytes.NewReader(rr.Body.Bytes()))
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
}

func TestPokemonPokemons_IfNoneMatch_Returns304(t *testing.T) {
	r := newTestRouter(t)

	// First request to obtain ETag.
	req1 := httptest.NewRequest(http.MethodGet, "/pokemon/pokemons", nil)
	req1.Header.Set("Origin", "http://localhost:3000")
	rr1 := httptest.NewRecorder()
	r.ServeHTTP(rr1, req1)
	if rr1.Code != http.StatusOK {
		t.Fatalf("status=%d body=%s", rr1.Code, rr1.Body.String())
	}
	etag := rr1.Header().Get("ETag")
	if etag == "" {
		t.Fatalf("expected ETag on first response")
	}

	// Second request with If-None-Match should be 304.
	req2 := httptest.NewRequest(http.MethodGet, "/pokemon/pokemons", nil)
	req2.Header.Set("Origin", "http://localhost:3000")
	req2.Header.Set("If-None-Match", etag)
	rr2 := httptest.NewRecorder()
	r.ServeHTTP(rr2, req2)

	if rr2.Code != http.StatusNotModified {
		t.Fatalf("expected 304, got %d body=%s", rr2.Code, rr2.Body.String())
	}
	if rr2.Body.Len() != 0 {
		t.Fatalf("expected empty body for 304, got %d bytes", rr2.Body.Len())
	}
}

func TestCORS_DisallowedOrigin_Forbidden(t *testing.T) {
	r := newTestRouter(t)

	req := httptest.NewRequest(http.MethodGet, "/pokemon/pokemons", nil)
	req.Header.Set("Origin", "http://evil.example")
	rr := httptest.NewRecorder()

	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d body=%s", rr.Code, rr.Body.String())
	}
}
