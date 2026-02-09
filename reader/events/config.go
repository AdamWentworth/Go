// config.go

package main

import (
	"errors"
	"log"
	"os"
	"strconv"
	"strings"

	"gopkg.in/yaml.v2"
)

type Config struct {
	Events EventsConfig `yaml:"events"`
}

type EventsConfig struct {
	Hostname      string `yaml:"hostname"`
	Port          string `yaml:"port"`
	Topic         string `yaml:"topic"`
	MaxRetries    int    `yaml:"max_retries"`
	RetryInterval int    `yaml:"retry_interval"` // seconds
}

var config Config

func loadConfig() {
	data, err := os.ReadFile("config/app_conf.yml")
	if err != nil {
		if !errors.Is(err, os.ErrNotExist) {
			log.Fatalf("Error reading config file: %v", err)
		}
		config = Config{}
		applyConfigDefaultsAndEnv()
		log.Printf("Configuration loaded from defaults/env: %+v\n", config)
		return
	}

	if err := yaml.Unmarshal(data, &config); err != nil {
		log.Fatalf("Error parsing config file: %v", err)
	}

	applyConfigDefaultsAndEnv()
	log.Printf("Configuration loaded: %+v\n", config)
}

func applyConfigDefaultsAndEnv() {
	if config.Events.Hostname == "" {
		config.Events.Hostname = "kafka"
	}
	if config.Events.Port == "" {
		config.Events.Port = "9092"
	}
	if config.Events.Topic == "" {
		config.Events.Topic = "batchedUpdates"
	}
	if config.Events.MaxRetries <= 0 {
		config.Events.MaxRetries = 5
	}
	if config.Events.RetryInterval <= 0 {
		config.Events.RetryInterval = 3
	}

	if v := strings.TrimSpace(os.Getenv("KAFKA_HOSTNAME")); v != "" {
		config.Events.Hostname = v
	} else if v := strings.TrimSpace(os.Getenv("HOST_IP")); v != "" {
		// Backward compatibility with older env naming.
		config.Events.Hostname = v
	}
	if v := strings.TrimSpace(os.Getenv("KAFKA_PORT")); v != "" {
		config.Events.Port = v
	}
	if v := strings.TrimSpace(os.Getenv("KAFKA_TOPIC")); v != "" {
		config.Events.Topic = v
	}
	if v := strings.TrimSpace(os.Getenv("KAFKA_MAX_RETRIES")); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			config.Events.MaxRetries = n
		}
	}
	if v := strings.TrimSpace(os.Getenv("KAFKA_RETRY_INTERVAL")); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			config.Events.RetryInterval = n
		}
	}
}
