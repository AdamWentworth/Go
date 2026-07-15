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
	var databaseURL string
	flag.StringVar(&databaseURL, "database-url", "", "PostgreSQL catalog database URL")
	flag.Parse()

	if strings.TrimSpace(databaseURL) == "" {
		log.Fatal("--database-url is required")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()
	if err := catalogimport.Migrate(ctx, databaseURL); err != nil {
		log.Fatal(err)
	}
	fmt.Fprintln(os.Stdout, "Pokemon catalog schema migrations are current.")
}
