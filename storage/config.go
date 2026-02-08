// config.go
package main

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
	"gopkg.in/yaml.v2"
)

type EventsConfig struct {
	Hostname      string `yaml:"hostname"`
	Port          string `yaml:"port"`
	Topic         string `yaml:"topic"`
	MaxRetries    int    `yaml:"max_retries"`
	RetryInterval int    `yaml:"retry_interval"`
}

type Config struct {
	Version string       `yaml:"version"`
	Events  EventsConfig `yaml:"events"`
}

var (
	AppConfig Config
)

func LoadAppConfig(envPath string) error {
	if envPath != "" {
		if err := godotenv.Load(envPath); err != nil {
			fmt.Printf("No .env file found at %s, relying on OS environment\n", envPath)
		}
	}

	configPath := filepath.Join("config", "app_conf.yml")
	if err := loadConfigFile(configPath); err != nil {
		return err
	}

	applyConfigDefaultsAndEnv(&AppConfig, os.Getenv)
	return nil
}

func loadConfigFile(path string) error {
	file, err := os.ReadFile(path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			AppConfig = Config{}
			return nil
		}
		return fmt.Errorf("error reading app config file: %w", err)
	}

	if len(strings.TrimSpace(string(file))) == 0 {
		AppConfig = Config{}
		return nil
	}

	if err := yaml.Unmarshal(file, &AppConfig); err != nil {
		return fmt.Errorf("error parsing app config file: %w", err)
	}
	return nil
}

func applyConfigDefaultsAndEnv(cfg *Config, getenv func(string) string) {
	if cfg.Events.Hostname == "" {
		cfg.Events.Hostname = "kafka"
	}
	if cfg.Events.Port == "" {
		cfg.Events.Port = "9092"
	}
	if cfg.Events.Topic == "" {
		cfg.Events.Topic = "batchedUpdates"
	}
	if cfg.Events.MaxRetries <= 0 {
		cfg.Events.MaxRetries = 5
	}
	if cfg.Events.RetryInterval <= 0 {
		cfg.Events.RetryInterval = 3
	}

	// Prefer explicit Kafka variables.
	if v := strings.TrimSpace(getenv("KAFKA_HOSTNAME")); v != "" {
		cfg.Events.Hostname = v
	} else if v := strings.TrimSpace(getenv("HOST_IP")); v != "" {
		// Backward compatibility with prior setup.
		cfg.Events.Hostname = v
	}
	if v := strings.TrimSpace(getenv("KAFKA_PORT")); v != "" {
		cfg.Events.Port = v
	}
	if v := strings.TrimSpace(getenv("KAFKA_TOPIC")); v != "" {
		cfg.Events.Topic = v
	}
	if v := parsePositiveIntEnv("KAFKA_MAX_RETRIES", getenv); v > 0 {
		cfg.Events.MaxRetries = v
	}
	if v := parsePositiveIntEnv("KAFKA_RETRY_INTERVAL", getenv); v > 0 {
		cfg.Events.RetryInterval = v
	}
}

func parsePositiveIntEnv(key string, getenv func(string) string) int {
	raw := strings.TrimSpace(getenv(key))
	if raw == "" {
		return 0
	}
	n, err := strconv.Atoi(raw)
	if err != nil || n <= 0 {
		return 0
	}
	return n
}
