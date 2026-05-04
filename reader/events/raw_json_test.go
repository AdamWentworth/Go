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

func TestRawJSON_InvalidInput(t *testing.T) {
	var value RawJSON

	if err := value.Scan("not-json"); err == nil {
		t.Fatalf("expected error when scanning invalid JSON")
	}

	if _, err := RawJSON("not-json").Value(); err == nil {
		t.Fatalf("expected error when storing invalid JSON")
	}
}
