//go:build integration
// +build integration

package builder_test

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"testing"
)

type contractGolden struct {
	ExpectedOrderedKeys     []string          `json:"expected_ordered_keys"`
	RequiredArrayKeys       []string          `json:"required_array_keys"`
	RequiredObjectKeys      []string          `json:"required_object_keys"`
	RequiredNullableObjKeys []string          `json:"required_nullable_object_keys"`
	RequiredScalarTypes     map[string]string `json:"required_scalar_types"`
}

func TestPokemonPayload_GoldenContract(t *testing.T) {
	raw, arr := buildIntegrationPayload(t)
	first := arr[0]

	golden := loadContractGolden(t)
	gotOrder := firstObjectKeyOrder(t, raw)

	if err := assertOrderedKeySequence(gotOrder, golden.ExpectedOrderedKeys); err != nil {
		t.Fatalf("key order mismatch: %v\nactual order: %v", err, gotOrder)
	}

	for _, k := range golden.RequiredArrayKeys {
		v, ok := first[k]
		if !ok {
			t.Fatalf("first pokemon missing required array key %q", k)
		}
		if _, ok := v.([]any); !ok {
			t.Fatalf("first pokemon key %q expected array, got %T", k, v)
		}
	}

	for _, k := range golden.RequiredObjectKeys {
		v, ok := first[k]
		if !ok {
			t.Fatalf("first pokemon missing required object key %q", k)
		}
		if _, ok := v.(map[string]any); !ok {
			t.Fatalf("first pokemon key %q expected object, got %T", k, v)
		}
	}

	for _, k := range golden.RequiredNullableObjKeys {
		v, ok := first[k]
		if !ok {
			t.Fatalf("first pokemon missing required nullable object key %q", k)
		}
		if v == nil {
			continue
		}
		if _, ok := v.(map[string]any); !ok {
			t.Fatalf("first pokemon key %q expected nil/object, got %T", k, v)
		}
	}

	for k, typ := range golden.RequiredScalarTypes {
		v, ok := first[k]
		if !ok {
			t.Fatalf("first pokemon missing required scalar key %q", k)
		}
		if err := assertScalarType(k, typ, v); err != nil {
			t.Fatal(err)
		}
	}
}

func loadContractGolden(t *testing.T) contractGolden {
	t.Helper()

	path := filepath.Join("testdata", "pokemon_contract_golden.json")
	raw, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read golden file %s: %v", path, err)
	}

	var g contractGolden
	if err := json.Unmarshal(raw, &g); err != nil {
		t.Fatalf("parse golden file %s: %v", path, err)
	}
	if len(g.ExpectedOrderedKeys) == 0 {
		t.Fatalf("golden file %s has no expected_ordered_keys", path)
	}
	return g
}

func firstObjectKeyOrder(t *testing.T, raw []byte) []string {
	t.Helper()

	dec := json.NewDecoder(bytes.NewReader(raw))

	tok, err := dec.Token()
	if err != nil {
		t.Fatalf("read json start token: %v", err)
	}
	if d, ok := tok.(json.Delim); !ok || d != '[' {
		t.Fatalf("expected top-level array, got %v", tok)
	}
	if !dec.More() {
		t.Fatalf("payload array is empty")
	}

	tok, err = dec.Token()
	if err != nil {
		t.Fatalf("read first object token: %v", err)
	}
	if d, ok := tok.(json.Delim); !ok || d != '{' {
		t.Fatalf("expected first array element to be object, got %v", tok)
	}

	keys := make([]string, 0, 48)
	for dec.More() {
		k, err := dec.Token()
		if err != nil {
			t.Fatalf("read object key token: %v", err)
		}
		ks, ok := k.(string)
		if !ok {
			t.Fatalf("expected string key token, got %T", k)
		}
		keys = append(keys, ks)

		var sink json.RawMessage
		if err := dec.Decode(&sink); err != nil {
			t.Fatalf("decode value for key %q: %v", ks, err)
		}
	}

	if _, err := dec.Token(); err != nil {
		t.Fatalf("read first object closing token: %v", err)
	}
	return keys
}

func assertOrderedKeySequence(got, expected []string) error {
	start := 0
	for _, want := range expected {
		found := -1
		for i := start; i < len(got); i++ {
			if got[i] == want {
				found = i
				break
			}
		}
		if found == -1 {
			return fmt.Errorf("missing expected key %q", want)
		}
		start = found + 1
	}
	return nil
}

func assertScalarType(key, want string, v any) error {
	switch want {
	case "string":
		if _, ok := v.(string); !ok {
			return fmt.Errorf("key %q expected string, got %T", key, v)
		}
	case "number":
		if _, ok := v.(float64); !ok {
			return fmt.Errorf("key %q expected number, got %T", key, v)
		}
	case "bool":
		if _, ok := v.(bool); !ok {
			return fmt.Errorf("key %q expected bool, got %T", key, v)
		}
	default:
		return fmt.Errorf("key %q has unknown scalar type %q in golden", key, want)
	}
	return nil
}
