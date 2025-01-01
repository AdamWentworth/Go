// config.go

package main

import (
    "fmt"
    "os"
    "path/filepath"

    "github.com/joho/godotenv"
    "gopkg.in/yaml.v2"
)

// Existing config structures
type EventsConfig struct {
    Port          string `yaml:"port"`
    Topic         string `yaml:"topic"`
    MaxRetries    int    `yaml:"max_retries"`
    RetryInterval int    `yaml:"retry_interval"`
}

type Config struct {
    Version string       `yaml:"version"`
    Events  EventsConfig `yaml:"events"`
}

// Global (application) config
var (
    AppConfig Config
)

// LoadAppConfig loads environment variables (optional .env) and then reads app_conf.yml
func LoadAppConfig(envPath string) error {
    // 1) Attempt to load .env (not mandatory)
    if err := godotenv.Load(envPath); err != nil {
        fmt.Printf("No .env file found at %s, relying on OS environment\n", envPath)
    }

    // 2) Load app_conf.yml from config/
    configPath := filepath.Join("config", "app_conf.yml")
    file, err := os.ReadFile(configPath)
    if err != nil {
        return fmt.Errorf("error reading app config file: %v", err)
    }

    // 3) Parse YAML into AppConfig
    if err := yaml.Unmarshal(file, &AppConfig); err != nil {
        return fmt.Errorf("error parsing app config file: %v", err)
    }

    return nil
}
