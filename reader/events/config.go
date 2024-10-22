// config.go

package main

import (
	"io/ioutil"
	"log"

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
	// Read the YAML file
	data, err := ioutil.ReadFile("config/app_conf.yml")
	if err != nil {
		log.Fatalf("Error reading config file: %v", err)
	}

	// Unmarshal the YAML into the Config struct
	err = yaml.Unmarshal(data, &config)
	if err != nil {
		log.Fatalf("Error parsing config file: %v", err)
	}

	log.Printf("Configuration loaded: %+v\n", config)
}
