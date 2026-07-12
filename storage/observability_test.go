package main

import (
	"testing"

	"github.com/prometheus/client_golang/prometheus/testutil"
)

func TestSyncConsumerReadyGaugeReflectsAtomicState(t *testing.T) {
	original := consumerReady.Load()
	t.Cleanup(func() {
		setConsumerReady(original)
	})

	consumerReady.Store(true)
	syncConsumerReadyGauge()
	if got := testutil.ToFloat64(kafkaConsumerReady); got != 1 {
		t.Fatalf("expected ready gauge to be 1, got %v", got)
	}

	consumerReady.Store(false)
	syncConsumerReadyGauge()
	if got := testutil.ToFloat64(kafkaConsumerReady); got != 0 {
		t.Fatalf("expected ready gauge to be 0, got %v", got)
	}
}
