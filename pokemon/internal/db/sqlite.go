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

	return db, nil
}
