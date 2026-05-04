package main

import (
	"encoding/json"
	"testing"
)

func TestRawJSON_RoundTripArrayAndObject(t *testing.T) {
	values := []RawJSON{
		RawJSON(`["favorite"]`),
		RawJSON(`{"blocked":true}`),
	}

	for _, value := range values {
		driverValue, err := value.Value()
		if err != nil {
			t.Fatalf("Value() returned error: %v", err)
		}

		var scanned RawJSON
		if err := scanned.Scan(driverValue); err != nil {
			t.Fatalf("Scan() returned error: %v", err)
		}

		payload, err := json.Marshal(scanned)
		if err != nil {
			t.Fatalf("MarshalJSON returned error: %v", err)
		}
		if string(payload) != string(value) {
			t.Fatalf("expected %s, got %s", value, payload)
		}
	}
}

func TestRawJSON_NilAndEmptyValues(t *testing.T) {
	var value RawJSON

	if driverValue, err := value.Value(); err != nil {
		t.Fatalf("Value() returned error: %v", err)
	} else if driverValue != nil {
		t.Fatalf("expected nil driver value, got %#v", driverValue)
	}

	if err := value.Scan(nil); err != nil {
		t.Fatalf("Scan(nil) returned error: %v", err)
	}
	if value != nil {
		t.Fatalf("expected nil RawJSON after Scan(nil), got %q", value)
	}

	payload, err := json.Marshal(value)
	if err != nil {
		t.Fatalf("MarshalJSON returned error: %v", err)
	}
	if string(payload) != "null" {
		t.Fatalf("expected null JSON, got %s", payload)
	}
}

func TestRawJSON_InvalidInput(t *testing.T) {
	var value RawJSON

	if err := value.Scan("not-json"); err == nil {
		t.Fatalf("expected error when scanning invalid JSON")
	}

	if err := value.Scan(42); err == nil {
		t.Fatalf("expected error when scanning unsupported input")
	}

	if _, err := RawJSON("not-json").Value(); err == nil {
		t.Fatalf("expected error when storing invalid JSON")
	}

	if _, err := json.Marshal(RawJSON("not-json")); err == nil {
		t.Fatalf("expected error when marshaling invalid JSON")
	}
}
