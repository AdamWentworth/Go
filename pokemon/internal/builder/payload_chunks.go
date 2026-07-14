package builder

import "pokemon_data/internal/orderedjson"

var (
	pokemonMoveChunkKeyOrder = []string{"pokemon_id", "moves", "fusion", "crownForms"}
	pokemonRaidChunkKeyOrder = []string{"pokemon_id", "raid_boss"}
	fusionMoveChunkKeyOrder  = []string{"fusion_id", "moves"}
	crownMoveChunkKeyOrder   = []string{"id", "moves"}
)

func buildCatalogPokemonEntry(pokemon map[string]any) orderedjson.Map {
	catalog := cloneMap(pokemon)
	catalog["moves"] = []any{}
	catalog["raid_boss"] = []any{}
	catalog["fusion"] = stripMovePools(pokemon["fusion"], fusionKeyOrder)
	catalog["crownForms"] = stripMovePools(pokemon["crownForms"], crownKeyOrder)
	return orderedjson.Map{M: catalog, Order: pokemonKeyOrder}
}

func buildPokemonMovesEntry(pokemonID int, pokemon map[string]any) orderedjson.Map {
	entry := map[string]any{
		"pokemon_id": pokemonID,
		"moves":      nonNilSlice(pokemon["moves"]),
		"fusion":     movePoolsForForms(pokemon["fusion"], "fusion_id", fusionMoveChunkKeyOrder),
		"crownForms": movePoolsForForms(pokemon["crownForms"], "id", crownMoveChunkKeyOrder),
	}
	return orderedjson.Map{M: entry, Order: pokemonMoveChunkKeyOrder}
}

func buildPokemonRaidEntry(pokemonID int, pokemon map[string]any) orderedjson.Map {
	entry := map[string]any{
		"pokemon_id": pokemonID,
		"raid_boss":  nonNilSlice(pokemon["raid_boss"]),
	}
	return orderedjson.Map{M: entry, Order: pokemonRaidChunkKeyOrder}
}

func nonNilSlice(value any) []any {
	if items, ok := value.([]any); ok {
		return items
	}
	return []any{}
}

func stripMovePools(value any, order []string) []any {
	items, ok := value.([]any)
	if !ok {
		return []any{}
	}

	result := make([]any, 0, len(items))
	for _, item := range items {
		itemMap, ok := unwrapOrderedMap(item)
		if !ok {
			continue
		}
		clone := cloneMap(itemMap)
		clone["moves"] = []any{}
		result = append(result, orderedjson.Map{M: clone, Order: order})
	}
	return result
}

func movePoolsForForms(value any, idKey string, order []string) []any {
	items, ok := value.([]any)
	if !ok {
		return []any{}
	}

	result := make([]any, 0, len(items))
	for _, item := range items {
		itemMap, ok := unwrapOrderedMap(item)
		if !ok {
			continue
		}
		formID, hasID := itemMap[idKey]
		if !hasID {
			continue
		}
		result = append(result, orderedjson.Map{M: map[string]any{
			idKey:   formID,
			"moves": nonNilSlice(itemMap["moves"]),
		}, Order: order})
	}
	return result
}

func unwrapOrderedMap(value any) (map[string]any, bool) {
	switch typed := value.(type) {
	case orderedjson.Map:
		return typed.M, typed.M != nil
	case map[string]any:
		return typed, typed != nil
	default:
		return nil, false
	}
}
