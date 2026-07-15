package builder

import (
	"context"
	"database/sql"
	"log/slog"
	"sync"
	"time"

	"golang.org/x/sync/singleflight"
	"pokemon_data/internal/orderedjson"
)

type Builder struct {
	db      *sql.DB
	dialect SQLDialect
	log     *slog.Logger

	payloadMu     sync.RWMutex
	payloadBundle *pokemonPayloadBundle
	payloadBuild  singleflight.Group
}

// SQLDialect is retained at the query boundary so PostgreSQL-specific query
// details stay explicit.
type SQLDialect string

const (
	DialectPostgres SQLDialect = "postgres"
)

// pokemonPayloadBundle keeps the legacy response and the independently cached
// delivery chunks backed by one PostgreSQL read pass. The JSON response caches own
// compression, ETags, and HTTP delivery; this cache only prevents duplicate DB
// work while those responses are warming.
type pokemonPayloadBundle struct {
	full     any
	catalog  any
	moves    any
	raidData any
}

func New(db *sql.DB, log *slog.Logger) *Builder {
	return NewWithDialect(db, DialectPostgres, log)
}

func NewWithDialect(db *sql.DB, dialect SQLDialect, log *slog.Logger) *Builder {
	if log == nil {
		log = slog.Default()
	}
	if dialect == "" {
		dialect = DialectPostgres
	}
	return &Builder{db: db, dialect: dialect, log: log}
}

// Key order presets to match Node's JSON.stringify insertion order as closely as practical.
var (
	pokemonKeyOrder = []string{
		"pokemon_id",
		"name",
		"pokedex_number",
		"image_url",
		"image_url_shiny",
		"sprite_url",
		"attack",
		"defense",
		"stamina",
		"type_1_id",
		"type_2_id",
		"type1_name",
		"type2_name",
		"generation",
		"available",
		"shiny_available",
		"shiny_rarity",
		"date_available",
		"date_shiny_available",

		"female_unique",
		"type_1_icon",
		"type_2_icon",
		"female_data",
		"costumes",
		"moves",
		"fusion",
		"backgrounds",
		"cp40",
		"cp50",
		"evolutionData",
		"megaEvolutions",
		"crownForms",
		"raid_boss",
		"max",
		"sizes",

		"shadow_shiny_available",
		"shadow_apex",
		"date_shadow_available",
		"date_shiny_shadow_available",
		"shiny_shadow_rarity",
		"image_url_shadow",
		"image_url_shiny_shadow",
	}

	evolutionDataKeyOrder = []string{"evolves_to", "evolves_from"}

	costumeKeyOrder = []string{
		"costume_id",
		"name",
		"image_url",
		"image_url_shiny",
		"image_url_female",
		"image_url_shiny_female",
		"shiny_available",
		"date_available",
		"date_shiny_available",
		"shadow_costume",
	}

	shadowCostumeKeyOrder = []string{
		"date_available",
		"date_shiny_available",
		"image_url_shadow_costume",
		"image_url_shiny_shadow_costume",
		"image_url_female_shadow_costume",
		"image_url_female_shiny_shadow_costume",
	}

	fusionKeyOrder = []string{
		"fusion_id",
		"base_pokemon_id1",
		"base_pokemon_id2",
		"name",
		"pokedex_number",
		"image_url",
		"image_url_shiny",
		"sprite_url",
		"attack",
		"defense",
		"stamina",
		"type_1_id",
		"type_2_id",
		"type1_name",
		"type2_name",
		"generation",
		"available",
		"shiny_available",
		"shiny_rarity",
		"date_available",
		"date_shiny_available",
		"backgrounds",
		"background_combo_rules",
		"moves",
		"cp40",
		"cp50",
	}

	backgroundKeyOrder = []string{
		"background_id",
		"name",
		"location",
		"image_url",
		"date",
		"costume_id",
	}

	// Node's megaService selects explicit columns and does NOT include pokemon_id.
	megaKeyOrder = []string{
		"id",
		"mega_energy_cost",
		"attack",
		"defense",
		"stamina",
		"image_url",
		"image_url_shiny",
		"sprite_url",
		"primal",
		"form",
		"type_1_id",
		"type_2_id",
		"date_available",
		"type1_name",
		"type2_name",
		"cp40",
		"cp50",
	}

	crownKeyOrder = []string{
		"id",
		"base_pokemon_id",
		"crown_pokemon_id",
		"display_form",
		"name",
		"form",
		"image_url",
		"image_url_shiny",
		"sprite_url",
		"attack",
		"defense",
		"stamina",
		"type_1_id",
		"type_2_id",
		"type1_name",
		"type2_name",
		"date_available",
		"date_shiny_available",
		"cp40",
		"cp50",
		"moves",
	}

	sizesKeyOrder = []string{
		"pokedex_height",
		"pokedex_weight",
		"height_standard_deviation",
		"weight_standard_deviation",
		"height_xxs_threshold",
		"height_xs_threshold",
		"height_xl_threshold",
		"height_xxl_threshold",
		"weight_xxs_threshold",
		"weight_xs_threshold",
		"weight_xl_threshold",
		"weight_xxl_threshold",
	}
)

func (b *Builder) BuildFullPokemonPayload(ctx context.Context) (any, error) {
	bundle, err := b.getPokemonPayloadBundle(ctx)
	if err != nil {
		return nil, err
	}
	return bundle.full, nil
}

// BuildCatalogPayload returns the fast bootstrap payload. It preserves every
// field required to construct the Pokedex and Pokemon catalog, but defers move
// pools and historical raid entries to their own chunks.
func (b *Builder) BuildCatalogPayload(ctx context.Context) (any, error) {
	bundle, err := b.getPokemonPayloadBundle(ctx)
	if err != nil {
		return nil, err
	}
	return bundle.catalog, nil
}

// BuildMovesPayload returns move pools keyed by base Pokemon. Fusion and crown
// move pools stay attached to the parent record that already owns those forms.
func (b *Builder) BuildMovesPayload(ctx context.Context) (any, error) {
	bundle, err := b.getPokemonPayloadBundle(ctx)
	if err != nil {
		return nil, err
	}
	return bundle.moves, nil
}

// BuildRaidDataPayload returns raid history keyed by base Pokemon. It is only
// needed by the raid planner, so normal catalog browsing does not parse it.
func (b *Builder) BuildRaidDataPayload(ctx context.Context) (any, error) {
	bundle, err := b.getPokemonPayloadBundle(ctx)
	if err != nil {
		return nil, err
	}
	return bundle.raidData, nil
}

// InvalidatePokemonPayloadBundle must be paired with response-cache
// invalidation after the underlying catalog data changes.
func (b *Builder) InvalidatePokemonPayloadBundle() {
	b.payloadMu.Lock()
	b.payloadBundle = nil
	b.payloadMu.Unlock()
}

func (b *Builder) getPokemonPayloadBundle(ctx context.Context) (*pokemonPayloadBundle, error) {
	b.payloadMu.RLock()
	cached := b.payloadBundle
	b.payloadMu.RUnlock()
	if cached != nil {
		return cached, nil
	}

	value, err, _ := b.payloadBuild.Do("pokemon-payload-bundle", func() (any, error) {
		b.payloadMu.RLock()
		cached := b.payloadBundle
		b.payloadMu.RUnlock()
		if cached != nil {
			return cached, nil
		}

		bundle, err := b.buildPokemonPayloadBundle(ctx)
		if err != nil {
			return nil, err
		}

		b.payloadMu.Lock()
		b.payloadBundle = bundle
		b.payloadMu.Unlock()
		return bundle, nil
	})
	if err != nil {
		return nil, err
	}
	return value.(*pokemonPayloadBundle), nil
}

func (b *Builder) buildPokemonPayloadBundle(ctx context.Context) (*pokemonPayloadBundle, error) {
	start := time.Now()

	orderedIDs, pokemonByID, err := b.loadBasePokemon(ctx)
	if err != nil {
		return nil, err
	}

	if err := b.attachFemaleData(ctx, orderedIDs, pokemonByID); err != nil {
		return nil, err
	}
	if err := b.attachCostumes(ctx, orderedIDs, pokemonByID); err != nil {
		return nil, err
	}
	if err := b.attachMoves(ctx, orderedIDs, pokemonByID); err != nil {
		return nil, err
	}
	if err := b.attachFusions(ctx, orderedIDs, pokemonByID); err != nil {
		return nil, err
	}
	if err := b.attachBackgrounds(ctx, orderedIDs, pokemonByID); err != nil {
		return nil, err
	}
	if err := b.attachPokemonCP(ctx, orderedIDs, pokemonByID); err != nil {
		return nil, err
	}
	if err := b.attachEvolutions(ctx, orderedIDs, pokemonByID); err != nil {
		return nil, err
	}
	if err := b.attachMegaEvolutions(ctx, orderedIDs, pokemonByID); err != nil {
		return nil, err
	}
	if err := b.attachCrownForms(ctx, orderedIDs, pokemonByID); err != nil {
		return nil, err
	}
	if err := b.attachRaidBoss(ctx, orderedIDs, pokemonByID); err != nil {
		return nil, err
	}
	if err := b.attachMax(ctx, orderedIDs, pokemonByID); err != nil {
		return nil, err
	}
	if err := b.attachSizes(ctx, orderedIDs, pokemonByID); err != nil {
		return nil, err
	}

	full := make([]any, 0, len(orderedIDs))
	catalog := make([]any, 0, len(orderedIDs))
	moves := make([]any, 0, len(orderedIDs))
	raidData := make([]any, 0, len(orderedIDs))
	for _, id := range orderedIDs {
		pokemon := pokemonByID[id]
		full = append(full, orderedjson.Map{M: pokemon, Order: pokemonKeyOrder})
		catalog = append(catalog, buildCatalogPokemonEntry(pokemon))
		moves = append(moves, buildPokemonMovesEntry(id, pokemon))
		raidData = append(raidData, buildPokemonRaidEntry(id, pokemon))
	}

	b.log.Info("built full pokemon payload",
		"count", len(full),
		"buildMs", time.Since(start).Milliseconds(),
	)

	return &pokemonPayloadBundle{
		full:     full,
		catalog:  catalog,
		moves:    moves,
		raidData: raidData,
	}, nil
}
