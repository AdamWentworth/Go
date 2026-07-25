package migrations

import (
	"database/sql"
	"errors"
	"fmt"
	"io/fs"
	"sort"
	"strings"

	_ "github.com/go-sql-driver/mysql"
)

const migrationTable = "storage_schema_migrations"

// Apply brings the storage MySQL database up to the embedded schema version.
func Apply(dsn string) error {
	if strings.TrimSpace(dsn) == "" {
		return errors.New("MySQL DSN is required")
	}

	db, err := sql.Open("mysql", withMultiStatements(dsn))
	if err != nil {
		return fmt.Errorf("open MySQL migration connection: %w", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		return fmt.Errorf("ping MySQL: %w", err)
	}
	if _, err := db.Exec(`
CREATE TABLE IF NOT EXISTS storage_schema_migrations (
  version VARCHAR(255) PRIMARY KEY,
  applied_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB`); err != nil {
		return fmt.Errorf("create migration ledger: %w", err)
	}

	names, err := Names(Files)
	if err != nil {
		return err
	}
	for _, name := range names {
		var count int
		if err := db.QueryRow(
			"SELECT COUNT(*) FROM "+migrationTable+" WHERE version = ?",
			name,
		).Scan(&count); err != nil {
			return fmt.Errorf("read migration ledger for %s: %w", name, err)
		}
		if count > 0 {
			continue
		}

		sqlText, err := fs.ReadFile(Files, name)
		if err != nil {
			return fmt.Errorf("read migration %s: %w", name, err)
		}
		if _, err := db.Exec(string(sqlText)); err != nil {
			return fmt.Errorf("apply migration %s: %w", name, err)
		}
		if _, err := db.Exec(
			"INSERT INTO "+migrationTable+" (version) VALUES (?)",
			name,
		); err != nil {
			return fmt.Errorf("record migration %s: %w", name, err)
		}
	}
	return nil
}

// Names returns embedded SQL migrations in lexical order.
func Names(files fs.FS) ([]string, error) {
	entries, err := fs.ReadDir(files, ".")
	if err != nil {
		return nil, fmt.Errorf("list storage migrations: %w", err)
	}

	names := make([]string, 0, len(entries))
	for _, entry := range entries {
		if !entry.IsDir() && strings.HasSuffix(entry.Name(), ".sql") {
			names = append(names, entry.Name())
		}
	}
	sort.Strings(names)
	return names, nil
}

func withMultiStatements(dsn string) string {
	if strings.Contains(dsn, "multiStatements=") {
		return dsn
	}
	separator := "?"
	if strings.Contains(dsn, "?") {
		separator = "&"
	}
	return dsn + separator + "multiStatements=true"
}
