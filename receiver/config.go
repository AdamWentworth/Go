// config.go
package main

import (
	"fmt"
	"os"
	"time"

	"github.com/joho/godotenv"
	"gopkg.in/yaml.v2"
)

type KafkaConfig struct {
	Hostname      string `yaml:"hostname"`
	Port          string `yaml:"port"`
	Topic         string `yaml:"topic"`
	MaxRetries    int    `yaml:"max_retries"`
	RetryInterval int    `yaml:"retry_interval"` // in seconds
}

type AppConfig struct {
	Events KafkaConfig `yaml:"events"`
}

var kafkaConfig KafkaConfig
var jwtSecret string

// Load environment variables (JWT_SECRET, HOST_IP)
func loadEnv() error {
	err := godotenv.Load(".env")
	if err != nil {
		logger.Warnf("Error loading .env: %v", err)
	}

	// Load JWT Secret from .env
	jwtSecret = os.Getenv("JWT_SECRET")
	return nil
}

// Load Kafka configuration from app_conf.yml
func loadConfigFile(filePath string) error {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("failed to read configuration file: %v", err)
	}

	// Unmarshal YAML into AppConfig struct
	var appConfig AppConfig
	err = yaml.Unmarshal(data, &appConfig)
	if err != nil {
		return fmt.Errorf("failed to unmarshal configuration file: %v", err)
	}

	kafkaConfig = appConfig.Events
	hostIP := os.Getenv("HOST_IP")
	if hostIP != "" {
		kafkaConfig.Hostname = hostIP
	}

	kafkaConfig.RetryInterval = kafkaConfig.RetryInterval * int(time.Second)
	return nil
}
