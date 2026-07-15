package catalogimport

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"embed"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	_ "modernc.org/sqlite"

	"pokemon_data/migrations"
)

const catalogSchema = "pokemon_catalog"

// Options describes one reproducible SQLite-to-PostgreSQL catalog import.
// The importer deliberately excludes the old empty collection/users tables and
// SQLite scratch tables: user-owned state belongs to the user services, not
// the reference catalog.
type Options struct {
	SQLitePath  string
	DatabaseURL string
	ReleaseID   string
	SourceLabel string
	DryRun      bool
}

// Result records the import evidence needed for a later production publisher.
type Result struct {
	ReleaseID    string           `json:"releaseId"`
	SourceSHA256 string           `json:"sourceSha256"`
	TableCounts  map[string]int64 `json:"tableCounts"`
	DryRun       bool             `json:"dryRun"`
}

type tableSpec struct {
	name                string
	columns             []string
	booleanColumns      map[string]struct{}
	legacyScalarColumns map[string]struct{}
	nullIfBlankColumns  map[string]struct{}
	identityColumn      string
}

var catalogTables = []tableSpec{
	{name: "types", columns: []string{"type_id", "name", "icon_url"}},
	{name: "evolution_items", columns: []string{"item_id", "name", "image_url"}},
	{name: "cp_multipliers", columns: []string{"level_id", "multiplier"}},
	{name: "pokemon", columns: []string{"pokemon_id", "name", "pokedex_number", "image_url", "image_url_shiny", "sprite_url", "attack", "defense", "stamina", "type_1_id", "type_2_id", "gender_rate", "rarity", "form", "generation", "available", "shiny_available", "shiny_rarity", "date_available", "date_shiny_available", "female_unique"}, booleanColumns: boolColumns("available", "shiny_available", "female_unique")},
	{name: "backgrounds", columns: []string{"background_id", "name", "location", "image_url", "date"}},
	{name: "moves", columns: []string{"move_id", "name", "type_id", "raid_power", "pvp_power", "raid_energy", "pvp_energy", "raid_cooldown", "pvp_turns", "is_fast", "fusion_id", "shadow", "purified", "apex"}, booleanColumns: boolColumns("is_fast", "shadow", "purified", "apex")},
	{name: "costume_pokemon", columns: []string{"costume_id", "pokemon_id", "costume_name", "shiny_available", "date_available", "date_shiny_available", "image_url_costume", "image_url_shiny_costume", "image_url_costume_female", "image_url_shiny_costume_female"}, booleanColumns: boolColumns("shiny_available"), identityColumn: "costume_id"},
	{name: "female_pokemon", columns: []string{"pokemon_id", "image_url", "shiny_image_url", "shadow_image_url", "shiny_shadow_image_url"}},
	{name: "shadow_pokemon", columns: []string{"id", "pokemon_id", "shiny_available", "apex", "date_available", "date_shiny_available", "image_url_shadow", "image_url_shiny_shadow", "shiny_rarity"}, legacyScalarColumns: columns("shiny_available", "apex")},
	{name: "fusion_pokemon", columns: []string{"fusion_id", "base_pokemon_id1", "base_pokemon_id2", "name", "pokedex_number", "image_url", "image_url_shiny", "sprite_url", "attack", "defense", "stamina", "type_1_id", "type_2_id", "generation", "available", "shiny_available", "shiny_rarity", "date_available", "date_shiny_available"}, booleanColumns: boolColumns("available", "shiny_available")},
	{name: "mega_evolution", columns: []string{"id", "pokemon_id", "mega_energy_cost", "attack", "defense", "stamina", "image_url", "image_url_shiny", "sprite_url", "primal", "form", "type_1_id", "type_2_id", "date_available"}, legacyScalarColumns: columns("primal")},
	{name: "max_pokemon", columns: []string{"pokemon_id", "dynamax", "gigantamax", "dynamax_release_date", "gigantamax_release_date", "gigantamax_image_url", "shiny_gigantamax_image_url"}, booleanColumns: boolColumns("dynamax", "gigantamax")},
	{name: "pokemon_sizes", columns: []string{"pokemon_id", "pokedex_height", "pokedex_weight", "height_standard_deviation", "weight_standard_deviation", "height_xxs_threshold", "height_xs_threshold", "height_xl_threshold", "height_xxl_threshold", "weight_xxs_threshold", "weight_xs_threshold", "weight_xl_threshold", "weight_xxl_threshold"}},
	{name: "pokemon_backgrounds", columns: []string{"pokemon_id", "background_id", "costume_id"}},
	{name: "pokemon_evolutions", columns: []string{"evolution_id", "pokemon_id", "evolves_to", "candies_needed", "trade_discount", "item_id", "other"}, legacyScalarColumns: columns("trade_discount"), nullIfBlankColumns: columns("item_id")},
	{name: "pokemon_moves", columns: []string{"id", "move_id", "pokemon_id", "legacy"}, booleanColumns: boolColumns("legacy")},
	{name: "pokemon_cp_stats", columns: []string{"pokemon_id", "level_id", "cp", "hp"}},
	{name: "shadow_costume_pokemon", columns: []string{"id", "shadow_id", "costume_id", "date_available", "date_shiny_available", "image_url_shadow_costume", "image_url_shiny_shadow_costume", "image_url_female_shadow_costume", "image_url_female_shiny_shadow_costume"}},
	{name: "mega_cp_stats", columns: []string{"mega_id", "level_id", "cp", "hp"}},
	{name: "fusion_cp_stats", columns: []string{"fusion_id", "level_id", "cp", "hp"}},
	{name: "fusion_moveset", columns: []string{"fusion_id", "move_id", "legacy"}, booleanColumns: boolColumns("legacy")},
	{name: "crown_forms", columns: []string{"id", "base_pokemon_id", "crown_pokemon_id", "display_form", "is_active", "created_at", "updated_at"}, booleanColumns: boolColumns("is_active")},
	{name: "fusion_background_combo_rules", columns: []string{"id", "fusion_id", "member1_background_id", "member2_background_id", "combo_background_id", "is_active", "notes", "created_at", "updated_at"}, booleanColumns: boolColumns("is_active"), identityColumn: "id"},
	{name: "raid_bosses", columns: []string{"id", "pokemon_id", "name", "form", "type", "boosted_weather", "max_boosted_cp", "max_unboosted_cp", "min_boosted_cp", "min_unboosted_cp", "possible_shiny", "tier", "costume_id"}, booleanColumns: boolColumns("possible_shiny"), identityColumn: "id"},
}

func boolColumns(columns ...string) map[string]struct{} {
	return columnsSet(columns...)
}

func columns(columns ...string) map[string]struct{} {
	return columnsSet(columns...)
}

func columnsSet(columns ...string) map[string]struct{} {
	out := make(map[string]struct{}, len(columns))
	for _, column := range columns {
		out[column] = struct{}{}
	}
	return out
}

// Import migrates the catalog in one PostgreSQL transaction. If DryRun is set,
// all schema and data work is validated then rolled back before commit.
func Import(ctx context.Context, opts Options) (Result, error) {
	if strings.TrimSpace(opts.SQLitePath) == "" {
		return Result{}, errors.New("sqlite path is required")
	}
	if strings.TrimSpace(opts.DatabaseURL) == "" {
		return Result{}, errors.New("PostgreSQL database URL is required")
	}

	source, sourceHash, err := openSQLiteReadOnly(opts.SQLitePath)
	if err != nil {
		return Result{}, err
	}
	defer func() { _ = source.Close() }()

	poolConfig, err := pgxpool.ParseConfig(opts.DatabaseURL)
	if err != nil {
		return Result{}, fmt.Errorf("parse PostgreSQL URL: %w", err)
	}
	poolConfig.ConnConfig.RuntimeParams["search_path"] = catalogSchema + ",public"
	target, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		return Result{}, fmt.Errorf("connect PostgreSQL: %w", err)
	}
	defer target.Close()
	if err := target.Ping(ctx); err != nil {
		return Result{}, fmt.Errorf("ping PostgreSQL: %w", err)
	}

	releaseID := strings.TrimSpace(opts.ReleaseID)
	if releaseID == "" {
		releaseID = "sqlite-" + sourceHash[:12]
	}
	releaseID, err = ParseReleaseID(releaseID)
	if err != nil {
		return Result{}, err
	}
	sourceLabel := strings.TrimSpace(opts.SourceLabel)
	if sourceLabel == "" {
		sourceLabel = filepath.Base(opts.SQLitePath)
	}

	tx, err := target.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return Result{}, fmt.Errorf("begin PostgreSQL transaction: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if err := applyMigrations(ctx, tx, migrations.Files); err != nil {
		return Result{}, err
	}
	if err := truncateCatalog(ctx, tx); err != nil {
		return Result{}, err
	}

	counts := make(map[string]int64, len(catalogTables))
	for _, table := range catalogTables {
		count, err := copyTable(ctx, source, tx, table)
		if err != nil {
			return Result{}, fmt.Errorf("copy %s: %w", table.name, err)
		}
		counts[table.name] = count
	}

	if err := resetIdentitySequences(ctx, tx); err != nil {
		return Result{}, err
	}
	if err := recordRelease(ctx, tx, releaseID, sourceHash, sourceLabel, counts); err != nil {
		return Result{}, err
	}

	result := Result{ReleaseID: releaseID, SourceSHA256: sourceHash, TableCounts: counts, DryRun: opts.DryRun}
	if opts.DryRun {
		return result, nil
	}
	if err := tx.Commit(ctx); err != nil {
		return Result{}, fmt.Errorf("commit PostgreSQL import: %w", err)
	}
	return result, nil
}

func openSQLiteReadOnly(path string) (*sql.DB, string, error) {
	absPath, err := filepath.Abs(path)
	if err != nil {
		return nil, "", fmt.Errorf("resolve SQLite path: %w", err)
	}
	file, err := os.Open(absPath)
	if err != nil {
		return nil, "", fmt.Errorf("open SQLite source: %w", err)
	}
	hash := sha256.New()
	if _, err := io.Copy(hash, file); err != nil {
		_ = file.Close()
		return nil, "", fmt.Errorf("hash SQLite source: %w", err)
	}
	_ = file.Close()

	dsn := (&url.URL{Scheme: "file", Path: absPath, RawQuery: "mode=ro"}).String()
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, "", fmt.Errorf("open SQLite source connection: %w", err)
	}
	db.SetMaxOpenConns(1)
	db.SetMaxIdleConns(1)
	if err := db.Ping(); err != nil {
		_ = db.Close()
		return nil, "", fmt.Errorf("ping SQLite source: %w", err)
	}
	return db, hex.EncodeToString(hash.Sum(nil)), nil
}

func applyMigrations(ctx context.Context, tx pgx.Tx, files embed.FS) error {
	if _, err := tx.Exec(ctx, `CREATE SCHEMA IF NOT EXISTS pokemon_catalog`); err != nil {
		return fmt.Errorf("create catalog schema: %w", err)
	}
	if _, err := tx.Exec(ctx, `CREATE TABLE IF NOT EXISTS pokemon_catalog.schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP)`); err != nil {
		return fmt.Errorf("create schema migration ledger: %w", err)
	}

	const version = "0001_catalog_schema.sql"
	var applied bool
	if err := tx.QueryRow(ctx, `SELECT EXISTS (SELECT 1 FROM pokemon_catalog.schema_migrations WHERE version = $1)`, version).Scan(&applied); err != nil {
		return fmt.Errorf("read schema migration ledger: %w", err)
	}
	if applied {
		return nil
	}

	sqlText, err := files.ReadFile(version)
	if err != nil {
		return fmt.Errorf("read schema migration %s: %w", version, err)
	}
	if _, err := tx.Exec(ctx, string(sqlText)); err != nil {
		return fmt.Errorf("apply schema migration %s: %w", version, err)
	}
	if _, err := tx.Exec(ctx, `INSERT INTO pokemon_catalog.schema_migrations (version) VALUES ($1)`, version); err != nil {
		return fmt.Errorf("record schema migration %s: %w", version, err)
	}
	return nil
}

func truncateCatalog(ctx context.Context, tx pgx.Tx) error {
	names := make([]string, 0, len(catalogTables))
	for _, table := range catalogTables {
		names = append(names, catalogSchema+"."+table.name)
	}
	_, err := tx.Exec(ctx, `TRUNCATE TABLE `+strings.Join(names, ", ")+` RESTART IDENTITY CASCADE`)
	if err != nil {
		return fmt.Errorf("truncate prior catalog: %w", err)
	}
	return nil
}

func copyTable(ctx context.Context, source *sql.DB, tx pgx.Tx, spec tableSpec) (int64, error) {
	columns := quoteSQLiteIdentifiers(spec.columns)
	query := `SELECT ` + strings.Join(columns, ", ") + ` FROM "` + spec.name + `"`
	rows, err := source.QueryContext(ctx, query)
	if err != nil {
		return 0, err
	}
	defer func() { _ = rows.Close() }()

	var copied int64
	batch := make([][]any, 0, 5000)
	flush := func() error {
		if len(batch) == 0 {
			return nil
		}
		count, err := tx.CopyFrom(ctx, pgx.Identifier{catalogSchema, spec.name}, spec.columns, pgx.CopyFromRows(batch))
		if err != nil {
			return err
		}
		copied += count
		batch = batch[:0]
		return nil
	}

	for rows.Next() {
		values := make([]any, len(spec.columns))
		pointers := make([]any, len(values))
		for index := range values {
			pointers[index] = &values[index]
		}
		if err := rows.Scan(pointers...); err != nil {
			return 0, err
		}
		for index, column := range spec.columns {
			values[index] = normalizeSQLiteValue(values[index])
			if _, isLegacyScalar := spec.legacyScalarColumns[column]; isLegacyScalar {
				values[index] = legacyScalarString(values[index])
			}
			if _, isBoolean := spec.booleanColumns[column]; isBoolean && values[index] != nil {
				value, err := sqliteBool(values[index])
				if err != nil {
					return 0, fmt.Errorf("%s.%s: %w", spec.name, column, err)
				}
				values[index] = value
			}
			if _, nullIfBlank := spec.nullIfBlankColumns[column]; nullIfBlank {
				values[index] = nullIfBlankSQLiteValue(values[index])
			}
		}
		batch = append(batch, values)
		if len(batch) == cap(batch) {
			if err := flush(); err != nil {
				return 0, err
			}
		}
	}
	if err := rows.Err(); err != nil {
		return 0, err
	}
	if err := flush(); err != nil {
		return 0, err
	}
	return copied, nil
}

// normalizeSQLiteValue preserves the JSON-facing representation of SQLite
// timestamp columns. The SQLite driver scans declared timestamp fields as
// time.Time; writing that value straight into a PostgreSQL TEXT column would
// otherwise change RFC3339 strings into Go's diagnostic time format.
func normalizeSQLiteValue(value any) any {
	if timestamp, ok := value.(time.Time); ok {
		return timestamp.UTC().Format(time.RFC3339)
	}
	return value
}

func legacyScalarString(value any) any {
	switch typed := value.(type) {
	case nil:
		return nil
	case int64:
		return strconv.FormatInt(typed, 10)
	case float64:
		return strconv.FormatFloat(typed, 'f', -1, 64)
	case []byte:
		return string(typed)
	default:
		return value
	}
}

func nullIfBlankSQLiteValue(value any) any {
	switch typed := value.(type) {
	case string:
		if strings.TrimSpace(typed) == "" {
			return nil
		}
	case []byte:
		if strings.TrimSpace(string(typed)) == "" {
			return nil
		}
	}
	return value
}

func quoteSQLiteIdentifiers(columns []string) []string {
	out := make([]string, 0, len(columns))
	for _, column := range columns {
		out = append(out, `"`+column+`"`)
	}
	return out
}

func sqliteBool(value any) (bool, error) {
	switch typed := value.(type) {
	case bool:
		return typed, nil
	case int64:
		return typed != 0, nil
	case float64:
		return typed != 0, nil
	case []byte:
		return sqliteBool(string(typed))
	case string:
		switch strings.ToLower(strings.TrimSpace(typed)) {
		case "1", "true", "t", "yes", "y":
			return true, nil
		case "0", "false", "f", "no", "n", "", "none", "null":
			return false, nil
		default:
			return false, fmt.Errorf("unsupported boolean value %q", typed)
		}
	default:
		return false, fmt.Errorf("unsupported boolean type %T", value)
	}
}

func resetIdentitySequences(ctx context.Context, tx pgx.Tx) error {
	for _, spec := range catalogTables {
		if spec.identityColumn == "" {
			continue
		}
		query := fmt.Sprintf(`
			SELECT setval(
				pg_get_serial_sequence('%s.%s', '%s'),
				COALESCE((SELECT MAX(%s) FROM %s.%s), 1),
				(EXISTS (SELECT 1 FROM %s.%s))
			)
		`, catalogSchema, spec.name, spec.identityColumn, spec.identityColumn, catalogSchema, spec.name, catalogSchema, spec.name)
		if _, err := tx.Exec(ctx, query); err != nil {
			return fmt.Errorf("reset %s sequence: %w", spec.name, err)
		}
	}
	return nil
}

func recordRelease(ctx context.Context, tx pgx.Tx, releaseID, sourceHash, sourceLabel string, counts map[string]int64) error {
	countsJSON, err := json.Marshal(counts)
	if err != nil {
		return fmt.Errorf("marshal table counts: %w", err)
	}
	if _, err := tx.Exec(ctx, `UPDATE pokemon_catalog.catalog_releases SET is_active = FALSE WHERE is_active`); err != nil {
		return fmt.Errorf("deactivate prior catalog release: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO pokemon_catalog.catalog_releases (release_id, source_sha256, source_label, table_counts, is_active, activated_at)
		VALUES ($1, $2, $3, $4::jsonb, TRUE, $5)
		ON CONFLICT (release_id) DO UPDATE
		SET source_sha256 = EXCLUDED.source_sha256,
		    source_label = EXCLUDED.source_label,
		    table_counts = EXCLUDED.table_counts,
		    is_active = TRUE,
		    activated_at = EXCLUDED.activated_at
	`, releaseID, sourceHash, sourceLabel, string(countsJSON), time.Now().UTC()); err != nil {
		return fmt.Errorf("record catalog release: %w", err)
	}
	return nil
}

// ParseBool is exported for unit coverage of SQLite boolean normalization.
func ParseBool(value any) (bool, error) {
	return sqliteBool(value)
}

// CatalogTableNames exposes the canonical import set for validation and tests.
func CatalogTableNames() []string {
	names := make([]string, 0, len(catalogTables))
	for _, table := range catalogTables {
		names = append(names, table.name)
	}
	return names
}

// NewReleaseID returns a human-readable default suitable for explicit local
// publishing. It deliberately carries no GitHub release semantics.
func NewReleaseID(now time.Time, sourceHash string) string {
	prefix := sourceHash
	if len(prefix) > 12 {
		prefix = prefix[:12]
	}
	return "catalog-" + now.UTC().Format("20060102T150405Z") + "-" + prefix
}

// ParseReleaseID validates an explicit release ID before it becomes durable
// production metadata.
func ParseReleaseID(value string) (string, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return "", errors.New("release ID is required")
	}
	if len(value) > 160 {
		return "", errors.New("release ID exceeds 160 characters")
	}
	for _, r := range value {
		if r != '-' && r != '_' && r != '.' &&
			(r < 'a' || r > 'z') &&
			(r < 'A' || r > 'Z') &&
			(r < '0' || r > '9') {
			return "", fmt.Errorf("release ID contains unsupported character %q", r)
		}
	}
	return value, nil
}

// ParseBoolString is useful for command-line callers that accept an explicit
// human-readable true/false flag from SQLite-derived data.
func ParseBoolString(value string) (bool, error) {
	return sqliteBool(strings.TrimSpace(value))
}
