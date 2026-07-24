package pvp

import (
	"math"
	"strings"
)

const (
	damageBonus          = 1.2999999523162841796875
	superEffective       = 1.60000002384185791015625
	resisted             = 0.625
	doubleResisted       = 0.390625
	sameTypeAttackBonus  = 1.2000000476837158203125
	shadowAttackBonus    = 1.2
	shadowDefensePenalty = 0.83333331
)

type typeTraits struct {
	weaknesses  map[string]struct{}
	resistances map[string]struct{}
	immunities  map[string]struct{}
}

func set(values ...string) map[string]struct{} {
	result := make(map[string]struct{}, len(values))
	for _, value := range values {
		result[value] = struct{}{}
	}
	return result
}

var defensiveTypeTraits = map[string]typeTraits{
	"normal":   {set("fighting"), set(), set("ghost")},
	"fighting": {set("flying", "psychic", "fairy"), set("rock", "bug", "dark"), set()},
	"flying":   {set("rock", "electric", "ice"), set("fighting", "bug", "grass"), set("ground")},
	"poison":   {set("ground", "psychic"), set("fighting", "poison", "bug", "fairy", "grass"), set()},
	"ground":   {set("water", "grass", "ice"), set("poison", "rock"), set("electric")},
	"rock":     {set("fighting", "ground", "steel", "water", "grass"), set("normal", "flying", "poison", "fire"), set()},
	"bug":      {set("flying", "rock", "fire"), set("fighting", "ground", "grass"), set()},
	"ghost":    {set("ghost", "dark"), set("poison", "bug"), set("normal", "fighting")},
	"steel":    {set("fighting", "ground", "fire"), set("normal", "flying", "rock", "bug", "steel", "grass", "psychic", "ice", "dragon", "fairy"), set("poison")},
	"fire":     {set("ground", "rock", "water"), set("bug", "steel", "fire", "grass", "ice", "fairy"), set()},
	"water":    {set("grass", "electric"), set("steel", "fire", "water", "ice"), set()},
	"grass":    {set("flying", "poison", "bug", "fire", "ice"), set("ground", "water", "grass", "electric"), set()},
	"electric": {set("ground"), set("flying", "steel", "electric"), set()},
	"psychic":  {set("bug", "ghost", "dark"), set("fighting", "psychic"), set()},
	"ice":      {set("fighting", "fire", "steel", "rock"), set("ice"), set()},
	"dragon":   {set("dragon", "ice", "fairy"), set("fire", "water", "grass", "electric"), set()},
	"dark":     {set("fighting", "fairy", "bug"), set("ghost", "dark"), set("psychic")},
	"fairy":    {set("poison", "steel"), set("fighting", "bug", "dark"), set("dragon")},
}

func Effectiveness(moveType string, targetTypes []string) float64 {
	moveType = strings.ToLower(moveType)
	multiplier := 1.0
	for _, targetType := range targetTypes {
		traits, ok := defensiveTypeTraits[strings.ToLower(targetType)]
		if !ok {
			continue
		}
		if _, weak := traits.weaknesses[moveType]; weak {
			multiplier *= superEffective
		} else if _, resist := traits.resistances[moveType]; resist {
			multiplier *= resisted
		} else if _, immune := traits.immunities[moveType]; immune {
			multiplier *= doubleResisted
		}
	}
	return multiplier
}

func StatStageMultiplier(stage int) float64 {
	stage = max(-MaxStatStage, min(MaxStatStage, stage))
	if stage >= 0 {
		return float64(4+stage) / 4
	}
	return 4 / float64(4-stage)
}

func hasType(types []string, moveType string) bool {
	for _, pokemonType := range types {
		if strings.EqualFold(pokemonType, moveType) {
			return true
		}
	}
	return false
}

// Damage reproduces PvPoke's float constants and floor placement.
func Damage(attacker Fighter, attackStage int, defender Fighter, defenseStage int, move Move) int {
	attack := attacker.Attack * StatStageMultiplier(attackStage)
	defense := defender.Defense * StatStageMultiplier(defenseStage)
	if attacker.Shadow {
		attack *= shadowAttackBonus
	}
	if defender.Shadow {
		defense *= shadowDefensePenalty
	}
	stab := 1.0
	if hasType(attacker.Types, move.Type) {
		stab = sameTypeAttackBonus
	}
	value := float64(move.Power) *
		stab *
		(attack / defense) *
		Effectiveness(move.Type, defender.Types) *
		0.5 *
		damageBonus
	return int(math.Floor(value)) + 1
}
