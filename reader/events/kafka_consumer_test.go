package main

import (
	"bytes"
	"compress/gzip"
	"testing"
)

func gzipBytes(t *testing.T, payload []byte) []byte {
	t.Helper()

	var buf bytes.Buffer
	zw := gzip.NewWriter(&buf)
	if _, err := zw.Write(payload); err != nil {
		t.Fatalf("failed to gzip payload: %v", err)
	}
	if err := zw.Close(); err != nil {
		t.Fatalf("failed to close gzip writer: %v", err)
	}
	return buf.Bytes()
}

func TestDecompressData_Valid(t *testing.T) {
	original := []byte(`{"user_id":"u1"}`)
	compressed := gzipBytes(t, original)

	out, err := decompressData(compressed)
	if err != nil {
		t.Fatalf("decompressData returned error: %v", err)
	}
	if string(out) != string(original) {
		t.Fatalf("unexpected output: got %q, want %q", string(out), string(original))
	}
}

func TestDecompressData_Invalid(t *testing.T) {
	if _, err := decompressData([]byte("not-gzip")); err == nil {
		t.Fatalf("expected error for invalid gzip payload")
	}
}

func TestTransformPokemonUpdates_CurrentReceiverContract(t *testing.T) {
	updates := []interface{}{
		map[string]interface{}{
			"instance_id": "lucario-1",
			"pokemon_id":  float64(448),
			"is_caught":   true,
			"favorite":    true,
		},
	}

	got := transformPokemonUpdates(updates)
	if len(got) != 1 {
		t.Fatalf("expected one transformed update, got %d", len(got))
	}
	lucario, ok := got["lucario-1"].(map[string]interface{})
	if !ok {
		t.Fatalf("expected lucario-1 payload map, got %T", got["lucario-1"])
	}
	if favorite, _ := lucario["favorite"].(bool); !favorite {
		t.Fatalf("expected favorite Lucario update to be preserved")
	}
}

func TestTransformPokemonUpdates_LegacyContracts(t *testing.T) {
	updates := []interface{}{
		map[string]interface{}{
			"key":       "legacy-flat",
			"is_caught": true,
		},
		map[string]interface{}{
			"key": "legacy-nested",
			"pokemonData": map[string]interface{}{
				"pokemon_id": float64(25),
				"favorite":   true,
			},
		},
	}

	got := transformPokemonUpdates(updates)
	if len(got) != 2 {
		t.Fatalf("expected two transformed updates, got %d", len(got))
	}
	nested, ok := got["legacy-nested"].(map[string]interface{})
	if !ok {
		t.Fatalf("expected nested legacy payload map, got %T", got["legacy-nested"])
	}
	if nested["instance_id"] != "legacy-nested" {
		t.Fatalf("expected legacy key to populate instance_id, got %v", nested["instance_id"])
	}
}

func TestTransformPokemonUpdates_IgnoresMalformedRows(t *testing.T) {
	updates := []interface{}{
		nil,
		"not-an-object",
		map[string]interface{}{"instance_id": ""},
		map[string]interface{}{"pokemon_id": float64(448)},
	}

	if got := transformPokemonUpdates(updates); len(got) != 0 {
		t.Fatalf("expected malformed updates to be ignored, got %#v", got)
	}
}
