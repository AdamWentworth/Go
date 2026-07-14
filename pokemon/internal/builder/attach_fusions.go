package builder

import (
	"context"
	"sort"

	"pokemon_data/internal/orderedjson"
)

func (b *Builder) attachFusions(ctx context.Context, orderedIDs []int, pokemonByID map[int]map[string]any) error {
	_ = orderedIDs

	fusionMoveRows, err := b.queryRows(ctx, `
	SELECT
	  fm.fusion_id,
	  fm.legacy,
	  m.*,
	  t.name AS type_name
	FROM fusion_moveset AS fm
	JOIN moves AS m ON fm.move_id = m.move_id
	JOIN types AS t ON m.type_id = t.type_id
	ORDER BY fm.fusion_id, m.is_fast DESC, m.name
	`)
	if err != nil {
		return err
	}

	fusionMovesByID := make(map[int][]any)
	for _, r := range fusionMoveRows {
		fid := asInt(r["fusion_id"])
		if fid == 0 {
			continue
		}

		entry := cloneMap(r)
		delete(entry, "type_name")
		entry["type"] = lower(asString(r["type_name"]))
		entry["legacy"] = (asInt(r["legacy"]) == 1)
		entry["fusion_id"] = fid

		fusionMovesByID[fid] = append(
			fusionMovesByID[fid],
			orderedjson.Map{M: entry, Order: []string{"move_id", "move_name"}},
		)
	}

	// Build per-species background lookup to derive fusion background options.
	backgroundRows, err := b.queryRows(ctx, `
	SELECT
	  pb.pokemon_id,
	  pb.background_id,
	  pb.costume_id,
	  b.name,
	  b.location,
	  b.image_url,
	  b.date
	FROM pokemon_backgrounds pb
	INNER JOIN backgrounds b ON b.background_id = pb.background_id
	ORDER BY pb.pokemon_id, pb.background_id, COALESCE(pb.costume_id, 0)
	`)
	if err != nil {
		return err
	}

	type backgroundEntry struct {
		backgroundID int
		name         any
		location     any
		imageURL     any
		date         any
		costumeID    int
	}

	memberBackgrounds := make(map[int][]backgroundEntry)
	memberBackgroundIDs := make(map[int]map[int]struct{})
	for _, row := range backgroundRows {
		pid := asInt(row["pokemon_id"])
		bid := asInt(row["background_id"])
		if pid == 0 || bid == 0 {
			continue
		}

		costumeID := asInt(row["costume_id"])
		memberBackgrounds[pid] = append(memberBackgrounds[pid], backgroundEntry{
			backgroundID: bid,
			name:         row["name"],
			location:     row["location"],
			imageURL:     row["image_url"],
			date:         row["date"],
			costumeID:    costumeID,
		})

		if memberBackgroundIDs[pid] == nil {
			memberBackgroundIDs[pid] = make(map[int]struct{})
		}
		memberBackgroundIDs[pid][bid] = struct{}{}
	}

	// Optional table: if absent, combo backgrounds are simply not added.
	fusionBackgroundRulesTableExists, err := b.tableExists(ctx, "fusion_background_combo_rules")
	if err != nil {
		return err
	}

	type fusionComboRule struct {
		member1BackgroundID int
		member2BackgroundID int
		comboBackgroundID   int
		name                any
		location            any
		imageURL            any
		date                any
	}
	comboRulesByFusionID := make(map[int][]fusionComboRule)
	if fusionBackgroundRulesTableExists {
		ruleRows, err := b.queryRows(ctx, `
		SELECT
		  r.fusion_id,
		  r.member1_background_id,
		  r.member2_background_id,
		  r.combo_background_id,
		  b.name,
		  b.location,
		  b.image_url,
		  b.date
		FROM fusion_background_combo_rules r
		INNER JOIN backgrounds b ON b.background_id = r.combo_background_id
		WHERE COALESCE(r.is_active, FALSE) IS TRUE
		ORDER BY r.fusion_id, r.combo_background_id
		`)
		if err != nil {
			return err
		}

		for _, row := range ruleRows {
			fid := asInt(row["fusion_id"])
			if fid == 0 {
				continue
			}
			comboRulesByFusionID[fid] = append(comboRulesByFusionID[fid], fusionComboRule{
				member1BackgroundID: asInt(row["member1_background_id"]),
				member2BackgroundID: asInt(row["member2_background_id"]),
				comboBackgroundID:   asInt(row["combo_background_id"]),
				name:                row["name"],
				location:            row["location"],
				imageURL:            row["image_url"],
				date:                row["date"],
			})
		}
	}

	// 5) fusions
	fusionRows, err := b.queryRows(ctx, `
	SELECT 
	  fusion.fusion_id,
	  fusion.base_pokemon_id1,
	  fusion.base_pokemon_id2,
	  fusion.name,
	  fusion.pokedex_number,
	  fusion.image_url,
	  fusion.image_url_shiny,
	  fusion.sprite_url,
	  fusion.attack,
	  fusion.defense,
	  fusion.stamina,
	  fusion.type_1_id,
	  fusion.type_2_id,
	  fusion.generation,
	  fusion.available,
	  fusion.shiny_available,
	  fusion.shiny_rarity,
	  fusion.date_available,
	  fusion.date_shiny_available,
	  t1.name AS type1_name,
	  t2.name AS type2_name
	FROM fusion_pokemon AS fusion
	LEFT JOIN types AS t1 ON fusion.type_1_id = t1.type_id
	LEFT JOIN types AS t2 ON fusion.type_2_id = t2.type_id
	ORDER BY fusion.fusion_id
	`)
	if err != nil {
		return err
	}
	fusionCP, err := b.getCPBulk(ctx, "fusion_cp_stats", "fusion_id")
	if err != nil {
		return err
	}
	for _, f := range fusionRows {
		fid := asInt(f["fusion_id"])
		cp := fusionCP[fid]
		moves := fusionMovesByID[fid]
		if moves == nil {
			moves = []any{}
		}
		id1 := asInt(f["base_pokemon_id1"])
		id2 := asInt(f["base_pokemon_id2"])

		combinedBackgrounds := make([]backgroundEntry, 0)
		seenBackgroundKeys := make(map[[2]int]struct{})
		appendBackground := func(entry backgroundEntry) {
			key := [2]int{entry.backgroundID, entry.costumeID}
			if _, exists := seenBackgroundKeys[key]; exists {
				return
			}
			seenBackgroundKeys[key] = struct{}{}
			combinedBackgrounds = append(combinedBackgrounds, entry)
		}
		for _, entry := range memberBackgrounds[id1] {
			appendBackground(entry)
		}
		for _, entry := range memberBackgrounds[id2] {
			appendBackground(entry)
		}

		member1Set := memberBackgroundIDs[id1]
		member2Set := memberBackgroundIDs[id2]
		for _, rule := range comboRulesByFusionID[fid] {
			_, member1HasRequired1 := member1Set[rule.member1BackgroundID]
			_, member2HasRequired2 := member2Set[rule.member2BackgroundID]
			_, member1HasRequired2 := member1Set[rule.member2BackgroundID]
			_, member2HasRequired1 := member2Set[rule.member1BackgroundID]
			if (member1HasRequired1 && member2HasRequired2) || (member1HasRequired2 && member2HasRequired1) {
				appendBackground(backgroundEntry{
					backgroundID: rule.comboBackgroundID,
					name:         rule.name,
					location:     rule.location,
					imageURL:     rule.imageURL,
					date:         rule.date,
					costumeID:    0,
				})
			}
		}

		sort.Slice(combinedBackgrounds, func(i, j int) bool {
			if combinedBackgrounds[i].backgroundID != combinedBackgrounds[j].backgroundID {
				return combinedBackgrounds[i].backgroundID < combinedBackgrounds[j].backgroundID
			}
			return combinedBackgrounds[i].costumeID < combinedBackgrounds[j].costumeID
		})

		fusionBackgrounds := make([]any, 0, len(combinedBackgrounds))
		for _, entry := range combinedBackgrounds {
			fusionBackgrounds = append(fusionBackgrounds, orderedjson.Map{M: map[string]any{
				"background_id": entry.backgroundID,
				"name":          entry.name,
				"location":      entry.location,
				"image_url":     entry.imageURL,
				"date":          entry.date,
				"costume_id":    nullIfZero(entry.costumeID),
			}, Order: backgroundKeyOrder})
		}

		fusionComboRules := make([]any, 0, len(comboRulesByFusionID[fid]))
		for _, rule := range comboRulesByFusionID[fid] {
			fusionComboRules = append(fusionComboRules, orderedjson.Map{M: map[string]any{
				"member1_background_id":      rule.member1BackgroundID,
				"member2_background_id":      rule.member2BackgroundID,
				"combo_background_id":        rule.comboBackgroundID,
				"combo_background_name":      rule.name,
				"combo_background_location":  rule.location,
				"combo_background_image_url": rule.imageURL,
				"combo_background_date":      rule.date,
			}, Order: []string{
				"member1_background_id",
				"member2_background_id",
				"combo_background_id",
				"combo_background_name",
				"combo_background_location",
				"combo_background_image_url",
				"combo_background_date",
			}})
		}

		fusion := orderedjson.Map{M: map[string]any{
			"fusion_id":              f["fusion_id"],
			"base_pokemon_id1":       f["base_pokemon_id1"],
			"base_pokemon_id2":       f["base_pokemon_id2"],
			"name":                   f["name"],
			"pokedex_number":         f["pokedex_number"],
			"image_url":              f["image_url"],
			"image_url_shiny":        f["image_url_shiny"],
			"sprite_url":             f["sprite_url"],
			"attack":                 f["attack"],
			"defense":                f["defense"],
			"stamina":                f["stamina"],
			"type_1_id":              f["type_1_id"],
			"type_2_id":              f["type_2_id"],
			"type1_name":             f["type1_name"],
			"type2_name":             f["type2_name"],
			"generation":             f["generation"],
			"available":              f["available"],
			"shiny_available":        f["shiny_available"],
			"shiny_rarity":           f["shiny_rarity"],
			"date_available":         f["date_available"],
			"date_shiny_available":   f["date_shiny_available"],
			"backgrounds":            fusionBackgrounds,
			"background_combo_rules": fusionComboRules,
			"moves":                  moves,
			"cp40":                   cp.cp40,
			"cp50":                   cp.cp50,
		}, Order: fusionKeyOrder}

		if p, ok := pokemonByID[id1]; ok {
			appendTo(p, "fusion", fusion)
		}
		if p, ok := pokemonByID[id2]; ok {
			appendTo(p, "fusion", fusion)
		}
	}
	return nil
}
