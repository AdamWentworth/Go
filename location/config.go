// config.go

package main

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
	"github.com/sirupsen/logrus"
)

type Config struct {
	DBUser     string
	DBHost     string
	DBName     string
	DBPassword string
	DBPort     string
	ServerPort string
}

func LoadConfig() *Config {
	err := godotenv.Load()
	if err != nil {
		logrus.Warn("No .env file found, using environment variables if set.")
	}

	// Set defaults or load from env
	serverPort := os.Getenv("SERVER_PORT")
	if serverPort == "" {
		serverPort = "3007"
		logrus.Infof("No SERVER_PORT set, defaulting to %s", serverPort)
	} else {
		logrus.Infof("SERVER_PORT set to %s", serverPort)
	}

	config := &Config{
		DBUser:     os.Getenv("DB_USER"),
		DBHost:     os.Getenv("DB_HOST"),
		DBName:     os.Getenv("DB_NAME"),
		DBPassword: os.Getenv("DB_PASSWORD"),
		DBPort:     os.Getenv("DB_PORT"),
		ServerPort: serverPort,
	}

	logrus.Infof("Configuration loaded: DBUser=%s DBHost=%s DBName=%s DBPort=%s ServerPort=%s",
		config.DBUser, config.DBHost, config.DBName, config.DBPort, config.ServerPort)
	return config
}

func (c *Config) GetDSN() string {
	dsn := fmt.Sprintf("postgres://%s:*****@%s:%s/%s",
		c.DBUser, c.DBHost, c.DBPort, c.DBName)
	// Masked password in logs
	logrus.Infof("Constructed DSN (password masked): %s", dsn)
	return fmt.Sprintf("postgres://%s:%s@%s:%s/%s",
		c.DBUser, c.DBPassword, c.DBHost, c.DBPort, c.DBName)
}
