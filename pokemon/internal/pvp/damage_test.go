package pvp

import "testing"

func damageTestFighter(id string, pokemonTypes []string, attack float64, defense float64) Fighter {
	return Fighter{
		ID:      id,
		Types:   pokemonTypes,
		Attack:  attack,
		Defense: defense,
		HP:      100,
		FastMove: Move{
			ID: "tap", Type: "normal", Kind: FastMove, Power: 1, Turns: 1,
		},
		ChargedMoves: []Move{{
			ID: "charge", Type: "normal", Kind: ChargedMove, Power: 1, EnergyCost: 35, Turns: 1,
		}},
	}
}

func TestDamageMatchesPvPokeConstants(t *testing.T) {
	tests := []struct {
		name          string
		attackerTypes []string
		defenderTypes []string
		moveType      string
		want          int
	}{
		{name: "neutral", attackerTypes: []string{"water"}, defenderTypes: []string{"normal"}, moveType: "normal", want: 7},
		{name: "stab", attackerTypes: []string{"normal"}, defenderTypes: []string{"normal"}, moveType: "normal", want: 8},
		{name: "super effective", attackerTypes: []string{"water"}, defenderTypes: []string{"normal"}, moveType: "fighting", want: 11},
		{name: "stab and super effective", attackerTypes: []string{"fighting"}, defenderTypes: []string{"normal"}, moveType: "fighting", want: 13},
		{name: "resisted", attackerTypes: []string{"water"}, defenderTypes: []string{"rock"}, moveType: "normal", want: 5},
		{name: "double resisted immunity", attackerTypes: []string{"water"}, defenderTypes: []string{"ghost"}, moveType: "normal", want: 3},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			attacker := damageTestFighter("attacker", test.attackerTypes, 100, 100)
			defender := damageTestFighter("defender", test.defenderTypes, 100, 100)
			move := Move{
				ID: "test", Type: test.moveType, Kind: ChargedMove, Power: 10, EnergyCost: 35, Turns: 1,
			}
			if got := Damage(attacker, 0, defender, 0, move); got != test.want {
				t.Fatalf("Damage() = %d, want %d", got, test.want)
			}
		})
	}
}

func TestStatStageMultiplierMatchesPvPoke(t *testing.T) {
	tests := map[int]float64{
		-4: 0.5,
		-2: 2.0 / 3.0,
		-1: 0.8,
		0:  1,
		1:  1.25,
		2:  1.5,
		4:  2,
	}
	for stage, want := range tests {
		if got := StatStageMultiplier(stage); got != want {
			t.Fatalf("StatStageMultiplier(%d) = %f, want %f", stage, got, want)
		}
	}
}

func TestEffectivenessForDualTypeStacksMultipliers(t *testing.T) {
	if got := Effectiveness("ice", []string{"dragon", "flying"}); got != superEffective*superEffective {
		t.Fatalf("double weakness = %f, want %f", got, superEffective*superEffective)
	}
	if got := Effectiveness("ground", []string{"flying", "steel"}); got != doubleResisted*superEffective {
		t.Fatalf("immunity and weakness = %f, want %f", got, doubleResisted*superEffective)
	}
}
