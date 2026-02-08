package main

import "testing"

func TestApplyConfigDefaultsAndEnv_Defaults(t *testing.T) {
	cfg := Config{}
	applyConfigDefaultsAndEnv(&cfg, envFromMap(nil))

	if cfg.Events.Hostname != "kafka" {
		t.Fatalf("expected default hostname kafka, got %q", cfg.Events.Hostname)
	}
	if cfg.Events.Port != "9092" {
		t.Fatalf("expected default port 9092, got %q", cfg.Events.Port)
	}
	if cfg.Events.Topic != "batchedUpdates" {
		t.Fatalf("expected default topic batchedUpdates, got %q", cfg.Events.Topic)
	}
	if cfg.Events.MaxRetries != 5 {
		t.Fatalf("expected default max retries 5, got %d", cfg.Events.MaxRetries)
	}
	if cfg.Events.RetryInterval != 3 {
		t.Fatalf("expected default retry interval 3, got %d", cfg.Events.RetryInterval)
	}
}

func TestApplyConfigDefaultsAndEnv_Overrides(t *testing.T) {
	cfg := Config{
		Events: EventsConfig{
			Hostname:      "from-yaml",
			Port:          "29092",
			Topic:         "from-yaml-topic",
			MaxRetries:    1,
			RetryInterval: 1,
		},
	}
	env := map[string]string{
		"KAFKA_HOSTNAME":       "kafka-internal",
		"KAFKA_PORT":           "9092",
		"KAFKA_TOPIC":          "batchedUpdates",
		"KAFKA_MAX_RETRIES":    "9",
		"KAFKA_RETRY_INTERVAL": "7",
	}

	applyConfigDefaultsAndEnv(&cfg, envFromMap(env))

	if cfg.Events.Hostname != "kafka-internal" {
		t.Fatalf("expected hostname override, got %q", cfg.Events.Hostname)
	}
	if cfg.Events.Port != "9092" {
		t.Fatalf("expected port override, got %q", cfg.Events.Port)
	}
	if cfg.Events.Topic != "batchedUpdates" {
		t.Fatalf("expected topic override, got %q", cfg.Events.Topic)
	}
	if cfg.Events.MaxRetries != 9 {
		t.Fatalf("expected max retries override, got %d", cfg.Events.MaxRetries)
	}
	if cfg.Events.RetryInterval != 7 {
		t.Fatalf("expected retry interval override, got %d", cfg.Events.RetryInterval)
	}
}

func TestApplyConfigDefaultsAndEnv_HostIPFallback(t *testing.T) {
	cfg := Config{}
	env := map[string]string{
		"HOST_IP": "legacy-kafka-host",
	}

	applyConfigDefaultsAndEnv(&cfg, envFromMap(env))

	if cfg.Events.Hostname != "legacy-kafka-host" {
		t.Fatalf("expected HOST_IP fallback to be used, got %q", cfg.Events.Hostname)
	}
}

func envFromMap(values map[string]string) func(string) string {
	return func(key string) string {
		if values == nil {
			return ""
		}
		return values[key]
	}
}
