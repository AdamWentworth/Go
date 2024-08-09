package config

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
)

func LoadConfig() {
	// Load environment variables from .env.development file
	err := godotenv.Load(".env.development")
	if err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}
}

func GetDSN() string {
	// Fetch database credentials from environment variables
	return fmt.Sprintf(
		"user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=Asia/Shanghai",
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
	)
}
