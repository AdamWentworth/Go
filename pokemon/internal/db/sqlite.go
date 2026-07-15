package db

import (
	"database/sql"
	"fmt"
	"time"

	_ "modernc.org/sqlite"
)

func OpenSQLite(path string) (*sql.DB, error) {
	// modernc.org/sqlite uses a DSN string; path works directly.
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}

	// Conservative pool settings for SQLite (single-writer DB file).
	db.SetMaxOpenConns(4)
	db.SetMaxIdleConns(4)
	db.SetConnMaxLifetime(30 * time.Minute)

	if err := db.Ping(); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("ping: %w", err)
	}

	// Production-oriented pragmas.
	// Notes:
	// - WAL generally improves concurrency for read-heavy services.
	// - busy_timeout reduces "database is locked" failures under contention.
	// - foreign_keys enforces relational constraints (off by default in SQLite).
	// - synchronous=NORMAL is a common tradeoff for WAL-mode durability/perf.
	if _, err := db.Exec(`PRAGMA busy_timeout = 5000;`); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("pragma busy_timeout: %w", err)
	}
	if _, err := db.Exec(`PRAGMA foreign_keys = ON;`); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("pragma foreign_keys: %w", err)
	}
	if _, err := db.Exec(`PRAGMA synchronous = NORMAL;`); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("pragma synchronous: %w", err)
	}

	// Try WAL; if unsupported (rare), fall back without failing startup.
	if _, err := db.Exec(`PRAGMA journal_mode = WAL;`); err != nil {
		// Best-effort fallback.
		_, _ = db.Exec(`PRAGMA journal_mode = DELETE;`)
	}

	return db, nil
}
