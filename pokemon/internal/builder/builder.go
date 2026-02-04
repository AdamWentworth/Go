package builder

import (
	"context"
	"database/sql"
	"log/slog"
	"time"

	"pokemon_data/internal/orderedjson"
)

type Builder struct {
	db  *sql.DB
	log *slog.Logger
}

func New(db *sql.DB, log *slog.Logger) *Builder {
	if log == nil {
		log = slog.Default()
	}
	return &Builder{db: db, log: log}
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
	if err := b.attachRaidBoss(ctx, orderedIDs, pokemonByID); err != nil {
		return nil, err
	}
	if err := b.attachMax(ctx, orderedIDs, pokemonByID); err != nil {
		return nil, err
	}
	if err := b.attachSizes(ctx, orderedIDs, pokemonByID); err != nil {
		return nil, err
	}

	out := make([]any, 0, len(orderedIDs))
	for _, id := range orderedIDs {
		out = append(out, orderedjson.Map{M: pokemonByID[id], Order: pokemonKeyOrder})
	}

	b.log.Info("built full pokemon payload",
		"count", len(out),
		"buildMs", time.Since(start).Milliseconds(),
	)

	return out, nil
}
