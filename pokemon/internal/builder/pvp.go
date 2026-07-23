package builder

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"
)

type pvpRankingSource struct {
	Name       string         `json:"name"`
	Version    string         `json:"version"`
	URL        string         `json:"url"`
	License    string         `json:"license"`
	ImportedAt time.Time      `json:"importedAt"`
	Metadata   map[string]any `json:"metadata"`
}

type pvpRankingMove struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Type string `json:"type"`
	Kind string `json:"kind"`
}

type pvpRankingEntry struct {
	Rank             int              `json:"rank"`
	SourceRank       int              `json:"sourceRank"`
	SpeciesID        string           `json:"speciesId"`
	Name             string           `json:"name"`
	PokemonID        *int             `json:"pokemonId,omitempty"`
	FusionID         *int             `json:"fusionId,omitempty"`
	VariantKind      string           `json:"variantKind"`
	ImageURL         string           `json:"imageUrl"`
	Types            []string         `json:"types"`
	Moveset          []pvpRankingMove `json:"moveset"`
	Score            float64          `json:"score"`
	Rating           float64          `json:"rating"`
	CategoryScores   []float64        `json:"categoryScores"`
	RecommendedLevel float64          `json:"recommendedLevel"`
	AttackIV         int              `json:"attackIv"`
	DefenseIV        int              `json:"defenseIv"`
	StaminaIV        int              `json:"staminaIv"`
	StatProduct      *float64         `json:"statProduct,omitempty"`
	BattleAttack     *float64         `json:"battleAttack,omitempty"`
	BattleDefense    *float64         `json:"battleDefense,omitempty"`
	BattleHP         *int             `json:"battleHp,omitempty"`
}

type pvpLeaguePayload struct {
	Key     string            `json:"key"`
	Label   string            `json:"label"`
	CPLimit *int              `json:"cpLimit"`
	Entries []pvpRankingEntry `json:"entries"`
}

type pvpRankingsPayload struct {
	Source  *pvpRankingSource           `json:"source"`
	Leagues map[string]pvpLeaguePayload `json:"leagues"`
}

func emptyPvPRankingsPayload() pvpRankingsPayload {
	greatLimit := 1500
	ultraLimit := 2500
	return pvpRankingsPayload{
		Leagues: map[string]pvpLeaguePayload{
			"great": {
				Key:     "great",
				Label:   "Great League",
				CPLimit: &greatLimit,
				Entries: []pvpRankingEntry{},
			},
			"ultra": {
				Key:     "ultra",
				Label:   "Ultra League",
				CPLimit: &ultraLimit,
				Entries: []pvpRankingEntry{},
			},
			"master": {
				Key:     "master",
				Label:   "Master League",
				CPLimit: nil,
				Entries: []pvpRankingEntry{},
			},
		},
	}
}

// BuildPvPRankingsPayload returns a compact, source-versioned snapshot of the
// current Great, Ultra, and Master League overall rankings.
func (b *Builder) BuildPvPRankingsPayload(ctx context.Context) (any, error) {
	payload := emptyPvPRankingsPayload()

	var (
		snapshotID string
		source     pvpRankingSource
		metadata   []byte
	)
	err := b.db.QueryRowContext(
		ctx,
		`
		SELECT
		  snapshot_id,
		  source_name,
		  source_version,
		  source_url,
		  source_license,
		  imported_at,
		  metadata
		FROM pokemon_catalog.pvp_ranking_snapshots
		WHERE is_active IS TRUE
		ORDER BY imported_at DESC
		LIMIT 1
		`,
	).Scan(
		&snapshotID,
		&source.Name,
		&source.Version,
		&source.URL,
		&source.License,
		&source.ImportedAt,
		&metadata,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return payload, nil
		}
		return nil, fmt.Errorf("load active PvP ranking snapshot: %w", err)
	}
	if len(metadata) > 0 {
		if err := json.Unmarshal(metadata, &source.Metadata); err != nil {
			return nil, fmt.Errorf("decode PvP ranking metadata: %w", err)
		}
	}
	payload.Source = &source

	rows, err := b.db.QueryContext(
		ctx,
		`
		SELECT
		  league,
		  rank,
		  source_rank,
		  species_id,
		  species_name,
		  pokemon_id,
		  fusion_id,
		  variant_kind,
		  image_url,
		  types,
		  moveset,
		  score,
		  rating,
		  category_scores,
		  recommended_level,
		  attack_iv,
		  defense_iv,
		  stamina_iv,
		  stat_product,
		  battle_attack,
		  battle_defense,
		  battle_hp
		FROM pokemon_catalog.pvp_rankings
		WHERE snapshot_id = $1
		ORDER BY
		  CASE league
		    WHEN 'great' THEN 1
		    WHEN 'ultra' THEN 2
		    ELSE 3
		  END,
		  rank
		`,
		snapshotID,
	)
	if err != nil {
		return nil, fmt.Errorf("load PvP rankings: %w", err)
	}
	defer func() { _ = rows.Close() }()

	for rows.Next() {
		var (
			league        string
			entry         pvpRankingEntry
			typesJSON     []byte
			movesetJSON   []byte
			scoresJSON    []byte
			pokemonID     sql.NullInt64
			fusionID      sql.NullInt64
			statProduct   sql.NullFloat64
			battleAttack  sql.NullFloat64
			battleDefense sql.NullFloat64
			battleHP      sql.NullInt64
		)
		if err := rows.Scan(
			&league,
			&entry.Rank,
			&entry.SourceRank,
			&entry.SpeciesID,
			&entry.Name,
			&pokemonID,
			&fusionID,
			&entry.VariantKind,
			&entry.ImageURL,
			&typesJSON,
			&movesetJSON,
			&entry.Score,
			&entry.Rating,
			&scoresJSON,
			&entry.RecommendedLevel,
			&entry.AttackIV,
			&entry.DefenseIV,
			&entry.StaminaIV,
			&statProduct,
			&battleAttack,
			&battleDefense,
			&battleHP,
		); err != nil {
			return nil, fmt.Errorf("scan PvP ranking: %w", err)
		}
		if err := json.Unmarshal(typesJSON, &entry.Types); err != nil {
			return nil, fmt.Errorf("decode PvP ranking types for %s: %w", entry.SpeciesID, err)
		}
		if err := json.Unmarshal(movesetJSON, &entry.Moveset); err != nil {
			return nil, fmt.Errorf("decode PvP ranking moveset for %s: %w", entry.SpeciesID, err)
		}
		if err := json.Unmarshal(scoresJSON, &entry.CategoryScores); err != nil {
			return nil, fmt.Errorf("decode PvP ranking scores for %s: %w", entry.SpeciesID, err)
		}
		if pokemonID.Valid {
			value := int(pokemonID.Int64)
			entry.PokemonID = &value
		}
		if fusionID.Valid {
			value := int(fusionID.Int64)
			entry.FusionID = &value
		}
		if statProduct.Valid {
			entry.StatProduct = &statProduct.Float64
		}
		if battleAttack.Valid {
			entry.BattleAttack = &battleAttack.Float64
		}
		if battleDefense.Valid {
			entry.BattleDefense = &battleDefense.Float64
		}
		if battleHP.Valid {
			value := int(battleHP.Int64)
			entry.BattleHP = &value
		}

		leaguePayload, ok := payload.Leagues[league]
		if !ok {
			continue
		}
		leaguePayload.Entries = append(leaguePayload.Entries, entry)
		payload.Leagues[league] = leaguePayload
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate PvP rankings: %w", err)
	}

	return payload, nil
}
