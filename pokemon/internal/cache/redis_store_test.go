package cache

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
)

func newTestRedisStore(t *testing.T) (*RedisPayloadStore, *miniredis.Miniredis) {
	t.Helper()

	server := miniredis.RunT(t)
	store, err := NewRedisPayloadStore(RedisPayloadStoreConfig{
		URL:       "redis://" + server.Addr() + "/0",
		KeyPrefix: "test:pokemon",
	})
	if err != nil {
		t.Fatalf("NewRedisPayloadStore: %v", err)
	}
	t.Cleanup(func() { _ = store.Close() })
	return store, server
}

func testStoredPayload(raw, gzipBytes []byte) StoredPayload {
	sum := sha256.Sum256(raw)
	return StoredPayload{
		JSONBytes: raw,
		GzipBytes: gzipBytes,
		ETag:      `"` + hex.EncodeToString(sum[:]) + `"`,
		BuiltAt:   time.Date(2026, time.July, 15, 12, 0, 0, 123, time.UTC),
	}
}

func TestRedisPayloadStoreSaveLoadAndVersion(t *testing.T) {
	store, _ := newTestRedisStore(t)
	ctx := context.Background()
	payload := testStoredPayload([]byte(`{"pokemon":"Bulbasaur"}`), []byte{0x1f, 0x8b, 0x00, 0xff, 0x01})

	if err := store.Save(ctx, "/pokemon/catalog", payload, time.Hour); err != nil {
		t.Fatalf("Save: %v", err)
	}

	version, found, invalidated, err := store.CurrentVersion(ctx, "/pokemon/catalog")
	if err != nil {
		t.Fatalf("CurrentVersion: %v", err)
	}
	if !found || invalidated {
		t.Fatalf("expected a current payload, found=%v invalidated=%v", found, invalidated)
	}
	if want := payload.ETag[1 : len(payload.ETag)-1]; version != want {
		t.Fatalf("version=%q want=%q", version, want)
	}

	loaded, found, err := store.Load(ctx, "/pokemon/catalog")
	if err != nil {
		t.Fatalf("Load: %v", err)
	}
	if !found {
		t.Fatal("expected stored payload")
	}
	if string(loaded.JSONBytes) != string(payload.JSONBytes) {
		t.Fatalf("JSON bytes changed: got %q want %q", loaded.JSONBytes, payload.JSONBytes)
	}
	if string(loaded.GzipBytes) != string(payload.GzipBytes) {
		t.Fatalf("gzip bytes changed: got %v want %v", loaded.GzipBytes, payload.GzipBytes)
	}
	if loaded.ETag != payload.ETag || !loaded.BuiltAt.Equal(payload.BuiltAt) {
		t.Fatalf("metadata changed: got %#v want %#v", loaded, payload)
	}
}

func TestRedisPayloadStoreInvalidationTombstonesCurrentVersion(t *testing.T) {
	store, _ := newTestRedisStore(t)
	ctx := context.Background()
	payload := testStoredPayload([]byte(`{"version":1}`), []byte("gzip"))

	if err := store.Save(ctx, "/pokemon/pokemons", payload, time.Hour); err != nil {
		t.Fatalf("Save: %v", err)
	}
	if err := store.Invalidate(ctx, "/pokemon/pokemons", time.Hour); err != nil {
		t.Fatalf("Invalidate: %v", err)
	}

	_, found, invalidated, err := store.CurrentVersion(ctx, "/pokemon/pokemons")
	if err != nil {
		t.Fatalf("CurrentVersion: %v", err)
	}
	if !found || !invalidated {
		t.Fatalf("expected invalidation marker, found=%v invalidated=%v", found, invalidated)
	}
	if _, found, err := store.Load(ctx, "/pokemon/pokemons"); err != nil || found {
		t.Fatalf("invalidated payload should not load, found=%v err=%v", found, err)
	}
}

func TestRedisPayloadStoreBuildLockCoordinatesCallers(t *testing.T) {
	store, _ := newTestRedisStore(t)
	ctx := context.Background()

	first, acquired, err := store.AcquireBuildLock(ctx, "/pokemon/moves", time.Minute)
	if err != nil || !acquired {
		t.Fatalf("first lock acquired=%v err=%v", acquired, err)
	}
	if _, acquired, err := store.AcquireBuildLock(ctx, "/pokemon/moves", time.Minute); err != nil || acquired {
		t.Fatalf("contending lock acquired=%v err=%v", acquired, err)
	}
	if err := first.Release(ctx); err != nil {
		t.Fatalf("Release: %v", err)
	}
	second, acquired, err := store.AcquireBuildLock(ctx, "/pokemon/moves", time.Minute)
	if err != nil || !acquired {
		t.Fatalf("lock after release acquired=%v err=%v", acquired, err)
	}
	if err := second.Release(ctx); err != nil {
		t.Fatalf("second Release: %v", err)
	}
}
