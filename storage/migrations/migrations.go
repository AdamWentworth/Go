package migrations

import "embed"

// Files contains the canonical storage MySQL schema migrations.
//
//go:embed *.sql
var Files embed.FS
