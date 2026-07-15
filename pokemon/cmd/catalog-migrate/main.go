package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"pokemon_data/internal/catalogimport"
)

func main() {
	if err := run(); err != nil {
		log.Print(err)
		os.Exit(1)
	}
}

func run() error {
	var databaseURL string
	flag.StringVar(&databaseURL, "database-url", "", "PostgreSQL catalog database URL")
	flag.Parse()

	if strings.TrimSpace(databaseURL) == "" {
		return fmt.Errorf("--database-url is required")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()
	if err := catalogimport.Migrate(ctx, databaseURL); err != nil {
		return err
	}
	if _, err := fmt.Fprintln(os.Stdout, "Pokemon catalog schema migrations are current."); err != nil {
		return fmt.Errorf("write migration result: %w", err)
	}
	return nil
}
