package db

import (
	"os"
	"path/filepath"
	"testing"
)

func TestOpenSQLiteReadOnlyReadsWithoutWriting(t *testing.T) {
	path := filepath.Join(t.TempDir(), "catalog.db")
	writable, err := OpenSQLite(path)
	if err != nil {
		t.Fatalf("open writable SQLite: %v", err)
	}
	if _, err := writable.Exec(`CREATE TABLE catalog_probe (id INTEGER PRIMARY KEY, name TEXT NOT NULL)`); err != nil {
		_ = writable.Close()
		t.Fatalf("create probe table: %v", err)
	}
	if _, err := writable.Exec(`INSERT INTO catalog_probe (name) VALUES ('Bulbasaur')`); err != nil {
		_ = writable.Close()
		t.Fatalf("insert probe row: %v", err)
	}
	if err := writable.Close(); err != nil {
		t.Fatalf("close writable SQLite: %v", err)
	}

	if err := os.Chmod(path, 0o444); err != nil {
		t.Fatalf("make SQLite snapshot read-only: %v", err)
	}
	defer func() { _ = os.Chmod(path, 0o600) }()

	readOnly, err := OpenSQLiteReadOnly(path)
	if err != nil {
		t.Fatalf("open read-only SQLite: %v", err)
	}
	defer readOnly.Close()

	var name string
	if err := readOnly.QueryRow(`SELECT name FROM catalog_probe WHERE id = 1`).Scan(&name); err != nil {
		t.Fatalf("read probe row: %v", err)
	}
	if name != "Bulbasaur" {
		t.Fatalf("probe row name = %q, want Bulbasaur", name)
	}
	if _, err := readOnly.Exec(`INSERT INTO catalog_probe (name) VALUES ('Ivysaur')`); err == nil {
		t.Fatal("read-only SQLite connection unexpectedly accepted a write")
	}
}
