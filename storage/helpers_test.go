package main

import "testing"

func TestFirstNonEmptyStringPrefersExplicitField(t *testing.T) {
	value := firstNonEmptyString(
		map[string]interface{}{
			"instance_id": "inst-1",
			"key":         "legacy-inst",
		},
		"instance_id",
		"key",
	)

	if value != "inst-1" {
		t.Fatalf("expected explicit instance_id, got %q", value)
	}
}

func TestFirstNonEmptyStringFallsBackToLegacyKey(t *testing.T) {
	value := firstNonEmptyString(
		map[string]interface{}{
			"instance_id": "",
			"key":         "legacy-inst",
		},
		"instance_id",
		"key",
	)

	if value != "legacy-inst" {
		t.Fatalf("expected legacy key fallback, got %q", value)
	}
}

func TestFirstNonEmptyStringReturnsEmptyForMissingOrNilFields(t *testing.T) {
	value := firstNonEmptyString(
		map[string]interface{}{
			"instance_id": nil,
		},
		"instance_id",
		"key",
	)

	if value != "" {
		t.Fatalf("expected empty string, got %q", value)
	}
}
