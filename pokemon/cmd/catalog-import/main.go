package main

import (
	"context"
	"encoding/json"
	"flag"
	"log"
	"os"
	"time"

	"pokemon_data/internal/catalogimport"
)

func main() {
	var sqlitePath string
	var databaseURL string
	var releaseID string
	var sourceLabel string
	var dryRun bool

	flag.StringVar(&sqlitePath, "sqlite", "", "path to the SQLite catalog database")
	flag.StringVar(&databaseURL, "database-url", os.Getenv("POKEMON_CATALOG_DATABASE_URL"), "PostgreSQL connection URL")
	flag.StringVar(&releaseID, "release-id", "", "catalog revision identifier")
	flag.StringVar(&sourceLabel, "source-label", "", "human-readable source label")
	flag.BoolVar(&dryRun, "dry-run", false, "validate import then roll back")
	flag.Parse()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	result, err := catalogimport.Import(ctx, catalogimport.Options{
		SQLitePath:  sqlitePath,
		DatabaseURL: databaseURL,
		ReleaseID:   releaseID,
		SourceLabel: sourceLabel,
		DryRun:      dryRun,
	})
	if err != nil {
		log.Printf("catalog import failed: %v", err)
		return
	}

	encoder := json.NewEncoder(os.Stdout)
	encoder.SetIndent("", "  ")
	if err := encoder.Encode(result); err != nil {
		log.Printf("write import result: %v", err)
	}
}
