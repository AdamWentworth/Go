package main

import (
	"fmt"
	"log"
	"os"
	"strings"

	"storage/migrations"
)

func main() {
	if err := run(); err != nil {
		log.Print(err)
		os.Exit(1)
	}
}

func run() error {
	required := []string{"DB_USER", "DB_PASSWORD", "DB_HOSTNAME", "DB_NAME"}
	for _, key := range required {
		if strings.TrimSpace(os.Getenv(key)) == "" {
			return fmt.Errorf("%s is required", key)
		}
	}

	port := strings.TrimSpace(os.Getenv("DB_PORT"))
	if port == "" {
		port = "3306"
	}
	dsn := fmt.Sprintf(
		"%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=true&loc=Local",
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_HOSTNAME"),
		port,
		os.Getenv("DB_NAME"),
	)
	if err := migrations.Apply(dsn); err != nil {
		return err
	}
	_, err := fmt.Fprintln(os.Stdout, "Storage MySQL schema migrations are current.")
	return err
}
