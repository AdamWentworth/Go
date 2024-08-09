package config

import (
	"io/ioutil"

	"gopkg.in/yaml.v2"
)

type KafkaConfig struct {
	Port          string `yaml:"port"`
	Topic         string `yaml:"topic"`
	MaxRetries    int    `yaml:"max_retries"`
	RetryInterval int    `yaml:"retry_interval"`
}

type AppConfig struct {
	Version string      `yaml:"version"`
	Events  KafkaConfig `yaml:"events"`
}

func LoadConfig() (*AppConfig, error) {
	data, err := ioutil.ReadFile("config/app_conf.yml")
	if err != nil {
		return nil, err
	}

	var config AppConfig
	err = yaml.Unmarshal(data, &config)
	if err != nil {
		return nil, err
	}

	return &config, nil
}
