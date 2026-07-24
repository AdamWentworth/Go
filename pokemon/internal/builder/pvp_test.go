package builder

import (
	"encoding/json"
	"testing"
)

func TestPvPRankingMovePreservesSimulationMechanics(t *testing.T) {
	raw := []byte(`{
		"id": "VINE_WHIP",
		"name": "Vine Whip",
		"type": "grass",
		"kind": "fast",
		"power": 5,
		"energyGain": 8,
		"energyCost": 0,
		"turns": 2,
		"buff": {
			"attackerAttack": 1,
			"attackerDefense": 0,
			"targetAttack": 0,
			"targetDefense": -1,
			"chance": 0.125
		}
	}`)

	var move pvpRankingMove
	if err := json.Unmarshal(raw, &move); err != nil {
		t.Fatalf("unmarshal PvP move: %v", err)
	}
	encoded, err := json.Marshal(move)
	if err != nil {
		t.Fatalf("marshal PvP move: %v", err)
	}

	var fields map[string]any
	if err := json.Unmarshal(encoded, &fields); err != nil {
		t.Fatalf("decode encoded PvP move: %v", err)
	}
	for _, field := range []string{
		"power",
		"energyGain",
		"energyCost",
		"turns",
		"buff",
	} {
		if _, ok := fields[field]; !ok {
			t.Fatalf("serialized PvP move dropped %q: %s", field, encoded)
		}
	}
	if move.Buff.TargetDefense != -1 || move.Buff.Chance != 0.125 {
		t.Fatalf("PvP move buff was not preserved: %#v", move.Buff)
	}
}

func TestPvPRankingMoveUsagePreservesMoveMechanics(t *testing.T) {
	raw := []byte(`{
		"id": "POWER_WHIP",
		"name": "Power Whip",
		"type": "grass",
		"kind": "charged",
		"power": 90,
		"energyGain": 0,
		"energyCost": 50,
		"turns": 1,
		"buff": {
			"attackerAttack": 0,
			"attackerDefense": 0,
			"targetAttack": 0,
			"targetDefense": 0,
			"chance": 0
		},
		"uses": 72
	}`)

	var usage pvpRankingMoveUsage
	if err := json.Unmarshal(raw, &usage); err != nil {
		t.Fatalf("unmarshal PvP move usage: %v", err)
	}
	if usage.Power != 90 || usage.EnergyCost != 50 || usage.Uses != 72 {
		t.Fatalf("PvP move usage was truncated: %#v", usage)
	}
}
