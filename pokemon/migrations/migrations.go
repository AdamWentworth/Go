package migrations

import "embed"

// Files contains the canonical PostgreSQL catalog schema migrations.
//
//go:embed *.sql
var Files embed.FS
