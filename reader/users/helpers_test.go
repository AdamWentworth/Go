package main

import (
	"testing"
	"time"
)

func TestLastUpdateToTime_ZeroOrNegative(t *testing.T) {
	if got := lastUpdateToTime(0); !got.IsZero() {
		t.Fatalf("expected zero time for 0, got %v", got)
	}
	if got := lastUpdateToTime(-1); !got.IsZero() {
		t.Fatalf("expected zero time for -1, got %v", got)
	}
}

func TestLastUpdateToTime_Seconds(t *testing.T) {
	input := int64(1_700_000_000)
	got := lastUpdateToTime(input)
	want := time.Unix(input, 0)
	if !got.Equal(want) {
		t.Fatalf("seconds conversion mismatch: got %v, want %v", got, want)
	}
}

func TestLastUpdateToTime_Milliseconds(t *testing.T) {
	input := int64(1_700_000_000_123)
	got := lastUpdateToTime(input)
	want := time.UnixMilli(input)
	if !got.Equal(want) {
		t.Fatalf("milliseconds conversion mismatch: got %v, want %v", got, want)
	}
}

func TestLastUpdateToTime_ThresholdValueUsesMilliseconds(t *testing.T) {
	input := int64(1_000_000_000_000)
	got := lastUpdateToTime(input)
	want := time.UnixMilli(input)
	if !got.Equal(want) {
		t.Fatalf("threshold conversion mismatch: got %v, want %v", got, want)
	}
}
