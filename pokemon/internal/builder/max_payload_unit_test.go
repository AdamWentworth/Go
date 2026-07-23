package builder

import "testing"

func TestIsMaxBattlePokemon(t *testing.T) {
	tests := []struct {
		name      string
		pokemonID int
		maxForms  []any
		want      bool
	}{
		{name: "ordinary Pokemon without Max data", pokemonID: 10, maxForms: []any{}, want: false},
		{name: "Pokemon with Max data", pokemonID: 1, maxForms: []any{map[string]any{"dynamax": true}}, want: true},
		{name: "Zacian special mechanic", pokemonID: 888, maxForms: []any{}, want: true},
		{name: "Zamazenta special mechanic", pokemonID: 889, maxForms: []any{}, want: true},
		{name: "Eternatus special mechanic", pokemonID: 890, maxForms: []any{}, want: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			pokemon := map[string]any{"max": tt.maxForms}
			if got := isMaxBattlePokemon(tt.pokemonID, pokemon); got != tt.want {
				t.Fatalf("isMaxBattlePokemon(%d) = %v, want %v", tt.pokemonID, got, tt.want)
			}
		})
	}
}
