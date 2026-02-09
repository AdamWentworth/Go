package main

import (
	"strings"
	"testing"
)

func TestJSONValueAndScan_RoundTripAndNil(t *testing.T) {
	in := JSON{"a": 1, "b": "x"}

	v, err := in.Value()
	if err != nil {
		t.Fatalf("Value() returned error: %v", err)
	}

	asString, ok := v.(string)
	if !ok {
		t.Fatalf("expected Value() to return string, got %T", v)
	}
	if !strings.Contains(asString, "\"a\":1") {
		t.Fatalf("expected marshaled JSON to contain key a, got %q", asString)
	}

	var out JSON
	if err := out.Scan(nil); err != nil {
		t.Fatalf("Scan(nil) returned error: %v", err)
	}
	if out == nil {
		t.Fatalf("expected Scan(nil) to initialize map")
	}
	if len(out) != 0 {
		t.Fatalf("expected empty map after Scan(nil), got len=%d", len(out))
	}

	if err := out.Scan([]byte(`{"ok":true}`)); err != nil {
		t.Fatalf("Scan([]byte) returned error: %v", err)
	}
	if got, ok := out["ok"].(bool); !ok || !got {
		t.Fatalf("expected ok=true after Scan([]byte), got %#v", out["ok"])
	}
}

func TestJSONScan_InvalidInput(t *testing.T) {
	var j JSON

	if err := j.Scan("not-json"); err == nil {
		t.Fatalf("expected error when scanning invalid JSON string")
	}

	if err := j.Scan(42); err == nil {
		t.Fatalf("expected error when scanning unsupported type")
	}
}
