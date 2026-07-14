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
		map[string]any{"pokemon_id": 1, "name": "Bulbasaur", "costumes": []any{}, "moves": []any{}, "fusion": []any{}, "backgrounds": []any{}, "megaEvolutions": []any{}, "crownForms": []any{}, "raid_boss": []any{}, "max": []any{}, "female_data": nil, "sizes": nil, "evolutionData": map[string]any{}},
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

func TestPokemonManifest_OK(t *testing.T) {
	r := newTestRouter(t)

	req := httptest.NewRequest(http.MethodGet, "/pokemon/manifest", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	rr := httptest.NewRecorder()

	r.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("status=%d body=%s", rr.Code, rr.Body.String())
	}
	if rr.Header().Get("ETag") == "" {
		t.Fatalf("expected manifest ETag")
	}
	if rr.Header().Get("Cache-Control") != "no-cache" {
		t.Fatalf("expected no-cache manifest cache-control, got %q", rr.Header().Get("Cache-Control"))
	}

	var manifest struct {
		SchemaVersion  int       `json:"schemaVersion"`
		CatalogVersion string    `json:"catalogVersion"`
		GeneratedAt    time.Time `json:"generatedAt"`
		Chunks         map[string]struct {
			Name        string `json:"name"`
			Endpoint    string `json:"endpoint"`
			ContentType string `json:"contentType"`
			ETag        string `json:"etag"`
			Version     string `json:"version"`
			BytesJSON   int    `json:"bytesJson"`
			BytesGzip   int    `json:"bytesGzip"`
		} `json:"chunks"`
	}
	if err := json.Unmarshal(rr.Body.Bytes(), &manifest); err != nil {
		t.Fatalf("manifest json: %v", err)
	}
	if manifest.SchemaVersion != 1 {
		t.Fatalf("schemaVersion=%d, want 1", manifest.SchemaVersion)
	}
	if manifest.CatalogVersion == "" {
		t.Fatalf("expected catalogVersion")
	}
	if manifest.GeneratedAt.IsZero() {
		t.Fatalf("expected generatedAt")
	}

	chunk, ok := manifest.Chunks["pokemonFull"]
	if !ok {
		t.Fatalf("expected pokemonFull chunk, got %#v", manifest.Chunks)
	}
	if chunk.Name != "pokemonFull" || chunk.Endpoint != "/pokemon/pokemons" || chunk.ContentType != "application/json" {
		t.Fatalf("unexpected chunk metadata: %#v", chunk)
	}
	if chunk.ETag == "" || chunk.Version != manifest.CatalogVersion {
		t.Fatalf("unexpected chunk version metadata: %#v manifest version %q", chunk, manifest.CatalogVersion)
	}
	if chunk.BytesJSON <= 0 || chunk.BytesGzip <= 0 {
		t.Fatalf("expected positive chunk sizes, got json=%d gzip=%d", chunk.BytesJSON, chunk.BytesGzip)
	}
}

func TestPokemonManifest_IfNoneMatch_Returns304(t *testing.T) {
	r := newTestRouter(t)

	req1 := httptest.NewRequest(http.MethodGet, "/pokemon/manifest", nil)
	req1.Header.Set("Origin", "http://localhost:3000")
	rr1 := httptest.NewRecorder()
	r.ServeHTTP(rr1, req1)
	if rr1.Code != http.StatusOK {
		t.Fatalf("status=%d body=%s", rr1.Code, rr1.Body.String())
	}
	etag := rr1.Header().Get("ETag")
	if etag == "" {
		t.Fatalf("expected ETag on first manifest response")
	}

	req2 := httptest.NewRequest(http.MethodGet, "/pokemon/manifest", nil)
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
