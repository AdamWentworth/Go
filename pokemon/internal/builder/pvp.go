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
	ID         string             `json:"id"`
	Name       string             `json:"name"`
	Type       string             `json:"type"`
	Kind       string             `json:"kind"`
	Power      int                `json:"power"`
	EnergyGain int                `json:"energyGain"`
	EnergyCost int                `json:"energyCost"`
	Turns      int                `json:"turns"`
	Buff       pvpRankingMoveBuff `json:"buff"`
}

type pvpRankingMoveBuff struct {
	AttackerAttack  int     `json:"attackerAttack"`
	AttackerDefense int     `json:"attackerDefense"`
	TargetAttack    int     `json:"targetAttack"`
	TargetDefense   int     `json:"targetDefense"`
	Chance          float64 `json:"chance"`
}

type pvpRankingMatchup struct {
	SpeciesID string  `json:"speciesId"`
	Rating    float64 `json:"rating"`
}

type pvpRankingMoveUsage struct {
	pvpRankingMove
	Uses int `json:"uses"`
}

type pvpRankingEntry struct {
	Rank             int                   `json:"rank"`
	SourceRank       int                   `json:"sourceRank"`
	SpeciesID        string                `json:"speciesId"`
	Name             string                `json:"name"`
	PokemonID        *int                  `json:"pokemonId,omitempty"`
	FusionID         *int                  `json:"fusionId,omitempty"`
	VariantKind      string                `json:"variantKind"`
	ImageURL         string                `json:"imageUrl"`
	Types            []string              `json:"types"`
	Moveset          []pvpRankingMove      `json:"moveset"`
	Score            float64               `json:"score"`
	Rating           float64               `json:"rating"`
	CategoryScores   []float64             `json:"categoryScores"`
	Matchups         []pvpRankingMatchup   `json:"matchups"`
	Counters         []pvpRankingMatchup   `json:"counters"`
	MoveUsage        []pvpRankingMoveUsage `json:"moveUsage"`
	RecommendedLevel float64               `json:"recommendedLevel"`
	AttackIV         int                   `json:"attackIv"`
	DefenseIV        int                   `json:"defenseIv"`
	StaminaIV        int                   `json:"staminaIv"`
	StatProduct      *float64              `json:"statProduct,omitempty"`
	BattleAttack     *float64              `json:"battleAttack,omitempty"`
	BattleDefense    *float64              `json:"battleDefense,omitempty"`
	BattleHP         *int                  `json:"battleHp,omitempty"`
}

type pvpLeaguePayload struct {
	Key     string            `json:"key"`
	Label   string            `json:"label"`
	CPLimit *int              `json:"cpLimit"`
	Entries []pvpRankingEntry `json:"entries"`
}

type pvpFormatPayload struct {
	Key     string            `json:"key"`
	Label   string            `json:"label"`
	League  string            `json:"league"`
	Cup     string            `json:"cup"`
	CPLimit *int              `json:"cpLimit"`
	Rules   []string          `json:"rules"`
	Entries []pvpRankingEntry `json:"entries"`
}

type pvpRankingsPayload struct {
	Source  *pvpRankingSource           `json:"source"`
	Leagues map[string]pvpLeaguePayload `json:"leagues"`
	Formats []pvpFormatPayload          `json:"formats"`
}

func emptyPvPRankingsPayload() pvpRankingsPayload {
	greatLimit := 1500
	ultraLimit := 2500
	return pvpRankingsPayload{
		Formats: []pvpFormatPayload{},
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

	formatRows, err := b.db.QueryContext(
		ctx,
		`
		SELECT format_key, league, title, cup, cp_limit, rules
		FROM pokemon_catalog.pvp_ranking_formats
		WHERE snapshot_id = $1
		  AND is_cup IS TRUE
		ORDER BY sort_order, title, format_key
		`,
		snapshotID,
	)
	if err != nil {
		return nil, fmt.Errorf("load PvP ranking formats: %w", err)
	}
	formatIndexes := make(map[string]int)
	for formatRows.Next() {
		var (
			format  pvpFormatPayload
			cpLimit sql.NullInt64
			rules   []byte
		)
		if err := formatRows.Scan(
			&format.Key,
			&format.League,
			&format.Label,
			&format.Cup,
			&cpLimit,
			&rules,
		); err != nil {
			_ = formatRows.Close()
			return nil, fmt.Errorf("scan PvP ranking format: %w", err)
		}
		if cpLimit.Valid {
			value := int(cpLimit.Int64)
			format.CPLimit = &value
		}
		if err := json.Unmarshal(rules, &format.Rules); err != nil {
			_ = formatRows.Close()
			return nil, fmt.Errorf("decode PvP ranking rules for %s: %w", format.Key, err)
		}
		if format.Rules == nil {
			format.Rules = []string{}
		}
		format.Entries = []pvpRankingEntry{}
		formatIndexes[format.Key] = len(payload.Formats)
		payload.Formats = append(payload.Formats, format)
	}
	if err := formatRows.Err(); err != nil {
		_ = formatRows.Close()
		return nil, fmt.Errorf("iterate PvP ranking formats: %w", err)
	}
	if err := formatRows.Close(); err != nil {
		return nil, fmt.Errorf("close PvP ranking formats: %w", err)
	}

	rows, err := b.db.QueryContext(
		ctx,
		`
		SELECT
		  ranking.format_key,
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
		  matchups,
		  counters,
		  move_usage,
		  recommended_level,
		  attack_iv,
		  defense_iv,
		  stamina_iv,
		  stat_product,
		  battle_attack,
		  battle_defense,
		  battle_hp
		FROM pokemon_catalog.pvp_rankings AS ranking
		JOIN pokemon_catalog.pvp_ranking_formats AS format
		  ON format.snapshot_id = ranking.snapshot_id
		 AND format.format_key = ranking.format_key
		WHERE ranking.snapshot_id = $1
		ORDER BY
		  format.sort_order,
		  ranking.rank
		`,
		snapshotID,
	)
	if err != nil {
		return nil, fmt.Errorf("load PvP rankings: %w", err)
	}
	defer func() { _ = rows.Close() }()

	for rows.Next() {
		var (
			formatKey     string
			entry         pvpRankingEntry
			typesJSON     []byte
			movesetJSON   []byte
			scoresJSON    []byte
			matchupsJSON  []byte
			countersJSON  []byte
			moveUsageJSON []byte
			pokemonID     sql.NullInt64
			fusionID      sql.NullInt64
			statProduct   sql.NullFloat64
			battleAttack  sql.NullFloat64
			battleDefense sql.NullFloat64
			battleHP      sql.NullInt64
		)
		if err := rows.Scan(
			&formatKey,
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
			&matchupsJSON,
			&countersJSON,
			&moveUsageJSON,
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
		if err := json.Unmarshal(matchupsJSON, &entry.Matchups); err != nil {
			return nil, fmt.Errorf("decode PvP ranking matchups for %s: %w", entry.SpeciesID, err)
		}
		if err := json.Unmarshal(countersJSON, &entry.Counters); err != nil {
			return nil, fmt.Errorf("decode PvP ranking counters for %s: %w", entry.SpeciesID, err)
		}
		if err := json.Unmarshal(moveUsageJSON, &entry.MoveUsage); err != nil {
			return nil, fmt.Errorf("decode PvP ranking move usage for %s: %w", entry.SpeciesID, err)
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

		if leaguePayload, ok := payload.Leagues[formatKey]; ok {
			leaguePayload.Entries = append(leaguePayload.Entries, entry)
			payload.Leagues[formatKey] = leaguePayload
			continue
		}
		formatIndex, ok := formatIndexes[formatKey]
		if !ok {
			continue
		}
		payload.Formats[formatIndex].Entries = append(
			payload.Formats[formatIndex].Entries,
			entry,
		)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate PvP rankings: %w", err)
	}

	return payload, nil
}
