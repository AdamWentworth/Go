package main

import "testing"

func clearKafkaEnv(t *testing.T) {
	t.Helper()
	t.Setenv("KAFKA_HOSTNAME", "")
	t.Setenv("KAFKA_PORT", "")
	t.Setenv("KAFKA_TOPIC", "")
	t.Setenv("KAFKA_MAX_RETRIES", "")
	t.Setenv("KAFKA_RETRY_INTERVAL", "")
	t.Setenv("HOST_IP", "")
}

func TestApplyConfigDefaultsAndEnv_Defaults(t *testing.T) {
	clearKafkaEnv(t)
	config = Config{}

	applyConfigDefaultsAndEnv()

	if config.Events.Hostname != "kafka" {
		t.Fatalf("expected hostname kafka, got %q", config.Events.Hostname)
	}
	if config.Events.Port != "9092" {
		t.Fatalf("expected port 9092, got %q", config.Events.Port)
	}
	if config.Events.Topic != "batchedUpdates" {
		t.Fatalf("expected topic batchedUpdates, got %q", config.Events.Topic)
	}
	if config.Events.MaxRetries != 5 {
		t.Fatalf("expected max retries 5, got %d", config.Events.MaxRetries)
	}
	if config.Events.RetryInterval != 3 {
		t.Fatalf("expected retry interval 3, got %d", config.Events.RetryInterval)
	}
}

func TestApplyConfigDefaultsAndEnv_Overrides(t *testing.T) {
	clearKafkaEnv(t)
	t.Setenv("KAFKA_HOSTNAME", "kafka-prod")
	t.Setenv("KAFKA_PORT", "19092")
	t.Setenv("KAFKA_TOPIC", "updates")
	t.Setenv("KAFKA_MAX_RETRIES", "9")
	t.Setenv("KAFKA_RETRY_INTERVAL", "7")

	config = Config{}
	applyConfigDefaultsAndEnv()

	if config.Events.Hostname != "kafka-prod" {
		t.Fatalf("expected hostname kafka-prod, got %q", config.Events.Hostname)
	}
	if config.Events.Port != "19092" {
		t.Fatalf("expected port 19092, got %q", config.Events.Port)
	}
	if config.Events.Topic != "updates" {
		t.Fatalf("expected topic updates, got %q", config.Events.Topic)
	}
	if config.Events.MaxRetries != 9 {
		t.Fatalf("expected max retries 9, got %d", config.Events.MaxRetries)
	}
	if config.Events.RetryInterval != 7 {
		t.Fatalf("expected retry interval 7, got %d", config.Events.RetryInterval)
	}
}

func TestApplyConfigDefaultsAndEnv_HostIPFallback(t *testing.T) {
	clearKafkaEnv(t)
	t.Setenv("HOST_IP", "10.1.2.3")

	config = Config{}
	applyConfigDefaultsAndEnv()

	if config.Events.Hostname != "10.1.2.3" {
		t.Fatalf("expected hostname from HOST_IP fallback, got %q", config.Events.Hostname)
	}
}
