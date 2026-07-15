package migrations

import (
	"context"
	"errors"
	"fmt"
	"io/fs"
	"sort"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const catalogSchema = "pokemon_catalog"

// Apply brings a PostgreSQL catalog database up to the schema embedded in this
// service. Catalog records are authored independently and are never replaced
// by an application deployment.
func Apply(ctx context.Context, databaseURL string) error {
	if strings.TrimSpace(databaseURL) == "" {
		return errors.New("PostgreSQL database URL is required")
	}

	poolConfig, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		return fmt.Errorf("parse PostgreSQL URL: %w", err)
	}
	poolConfig.ConnConfig.RuntimeParams["search_path"] = catalogSchema + ",public"
	target, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		return fmt.Errorf("connect PostgreSQL: %w", err)
	}
	defer target.Close()
	if err := target.Ping(ctx); err != nil {
		return fmt.Errorf("ping PostgreSQL: %w", err)
	}

	tx, err := target.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return fmt.Errorf("begin PostgreSQL migration transaction: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if err := apply(ctx, tx, Files); err != nil {
		return err
	}
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit PostgreSQL migrations: %w", err)
	}
	return nil
}

func apply(ctx context.Context, tx pgx.Tx, files fs.FS) error {
	if _, err := tx.Exec(ctx, `CREATE SCHEMA IF NOT EXISTS pokemon_catalog`); err != nil {
		return fmt.Errorf("create catalog schema: %w", err)
	}
	if _, err := tx.Exec(ctx, `CREATE TABLE IF NOT EXISTS pokemon_catalog.schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)`); err != nil {
		return fmt.Errorf("create schema migration ledger: %w", err)
	}

	versions, err := Names(files)
	if err != nil {
		return err
	}
	for _, version := range versions {
		var applied bool
		if err := tx.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM pokemon_catalog.schema_migrations WHERE version = $1)`, version).Scan(&applied); err != nil {
			return fmt.Errorf("read schema migration ledger for %s: %w", version, err)
		}
		if applied {
			continue
		}

		sqlText, err := fs.ReadFile(files, version)
		if err != nil {
			return fmt.Errorf("read schema migration %s: %w", version, err)
		}
		if _, err := tx.Exec(ctx, string(sqlText)); err != nil {
			return fmt.Errorf("apply schema migration %s: %w", version, err)
		}
		if _, err := tx.Exec(ctx, `INSERT INTO pokemon_catalog.schema_migrations (version) VALUES ($1)`, version); err != nil {
			return fmt.Errorf("record schema migration %s: %w", version, err)
		}
	}
	return nil
}

// Names returns versioned SQL migrations in lexical order.
func Names(files fs.FS) ([]string, error) {
	entries, err := fs.ReadDir(files, ".")
	if err != nil {
		return nil, fmt.Errorf("list catalog migrations: %w", err)
	}

	versions := make([]string, 0, len(entries))
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".sql") {
			versions = append(versions, entry.Name())
		}
	}
	sort.Strings(versions)
	return versions, nil
}
