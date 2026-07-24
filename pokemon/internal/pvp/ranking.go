package pvp

import (
	"fmt"
	"math"
	"sort"
	"strings"
)

const (
	categoryRankCutoffIncrease = 0.06
	categoryRankWeightExponent = 1.65
)

// Scenario describes one of PvPoke's published ranking environments. Energy
// values are measured in 500 ms turns of fast-move advantage.
type Scenario struct {
	Slug        string
	Shields     [2]int
	EnergyTurns [2]int
}

var StandardScenarios = []Scenario{
	{Slug: "leads", Shields: [2]int{1, 1}},
	{Slug: "closers", Shields: [2]int{0, 0}},
	{Slug: "switches", Shields: [2]int{1, 1}, EnergyTurns: [2]int{4, 0}},
	{Slug: "chargers", Shields: [2]int{1, 1}, EnergyTurns: [2]int{6, 0}},
	{Slug: "attackers", Shields: [2]int{0, 1}},
}

// RankingEntry is a combat-ready fighter and its optional target weighting.
// A zero TargetWeight means the ordinary PvPoke weight of 1.
type RankingEntry struct {
	Fighter      Fighter
	TargetWeight float64
}

type RankingMatch struct {
	OpponentID       string
	Rating           int
	AdjustedRating   int
	OpponentRating   int
	OpponentAdjusted int
	WeightedScore    float64
	OpponentScore    float64
}

type CategoryResult struct {
	FighterID string
	Rating    int
	Score     float64
	Matches   []RankingMatch
}

// RankCategory reproduces PvPoke's category-level matchup matrix and weighting
// for a fixed moveset per fighter. Moveset generation is deliberately separate.
func RankCategory(entries []RankingEntry, scenario Scenario) ([]CategoryResult, error) {
	if len(entries) < 2 {
		return nil, fmt.Errorf("PvP category ranking needs at least two fighters")
	}
	for index, entry := range entries {
		if err := entry.Fighter.Validate(); err != nil {
			return nil, fmt.Errorf("ranking fighter %d: %w", index, err)
		}
	}

	results := make([]CategoryResult, len(entries))
	scores := make([]float64, len(entries))
	for candidateIndex, candidate := range entries {
		result := CategoryResult{
			FighterID: candidate.Fighter.ID,
			Matches:   make([]RankingMatch, 0, len(entries)),
		}
		adjustedTotal := 0
		for opponentIndex, opponent := range entries {
			config := DefaultBattleConfig()
			config.Shields = scenario.Shields
			config.StartingEnergy = scenarioStartingEnergy(
				candidate.Fighter,
				opponent.Fighter,
				scenario,
			)
			battle, err := Simulate(
				[2]Fighter{candidate.Fighter, opponent.Fighter},
				config,
			)
			if err != nil {
				return nil, fmt.Errorf(
					"rank %s vs %s: %w",
					candidate.Fighter.ID,
					opponent.Fighter.ID,
					err,
				)
			}
			match := RankingMatch{
				OpponentID:       opponent.Fighter.ID,
				Rating:           battle.Rating(0),
				AdjustedRating:   battle.AdjustedRating(0),
				OpponentRating:   battle.Rating(1),
				OpponentAdjusted: battle.AdjustedRating(1),
			}
			result.Matches = append(result.Matches, match)
			adjustedTotal += match.AdjustedRating

			_ = opponentIndex
		}
		result.Rating = adjustedTotal / len(entries)
		scores[candidateIndex] = float64(result.Rating)
		results[candidateIndex] = result
	}

	// Normal cups use one opponent-strength iteration. PvPoke runs seven for
	// custom cups; that mode can be added without changing this contract.
	bestScore := maxFloat(scores)
	nextScores := make([]float64, len(results))
	for candidateIndex := range results {
		weightedTotal := 0.0
		weightTotal := 0.0
		for opponentIndex := range results[candidateIndex].Matches {
			match := &results[candidateIndex].Matches[opponentIndex]
			weight := categoryOpponentWeight(scores[opponentIndex], bestScore, 0)
			if candidateIndex == opponentIndex {
				weight = 0
			}
			targetWeight := entries[opponentIndex].TargetWeight
			if targetWeight == 0 {
				targetWeight = 1
			}
			weight *= targetWeight

			adjusted := categoryRatingCurve(float64(match.AdjustedRating))
			if scenario.Slug == "switches" && adjusted < 500 {
				ratingGap := 500 - adjusted
				weight *= 1 + (ratingGap*ratingGap)/20000
			}
			if bestScore <= 0 ||
				scores[opponentIndex]/bestScore < 0.1 {
				weight = 0
			}

			match.WeightedScore = adjusted * weight
			match.OpponentScore = float64(match.OpponentAdjusted) * math.Pow(4, weight)
			weightedTotal += match.WeightedScore
			weightTotal += weight
		}
		if weightTotal > 0 {
			nextScores[candidateIndex] = math.Floor(weightedTotal / weightTotal)
		}
	}

	for index := range results {
		results[index].Score = nextScores[index]
		if scenario.Slug == "chargers" {
			results[index].Score *= chargerFactor(entries[index].Fighter)
		}
	}
	normalizeCategoryScores(results)
	sort.SliceStable(results, func(i, j int) bool {
		return results[i].Score > results[j].Score
	})
	return results, nil
}

// scenarioStartingEnergy preserves the pinned PvPoke ranker's behavior,
// including its asymmetric opponent-energy calculation.
func scenarioStartingEnergy(candidate Fighter, opponent Fighter, scenario Scenario) [2]int {
	energy := [2]int{
		fastMoveEnergyAfterTurns(candidate.FastMove, scenario.EnergyTurns[0]),
		fastMoveEnergyAfterTurns(opponent.FastMove, scenario.EnergyTurns[1]),
	}
	if scenario.EnergyTurns[1] > 0 {
		energy[1] = fastMoveEnergyAfterTurns(candidate.FastMove, scenario.EnergyTurns[0])
	}
	return energy
}

func fastMoveEnergyAfterTurns(move Move, turns int) int {
	if turns <= 0 {
		return 0
	}
	count := turns / move.Turns
	if count == 0 {
		count = 1
	}
	return min(EnergyCap, move.EnergyGain*count)
}

func categoryOpponentWeight(score float64, bestScore float64, iteration int) float64 {
	if bestScore <= 0 {
		return 0
	}
	cutoff := 0.1 + categoryRankCutoffIncrease*float64(iteration)
	return math.Pow(
		math.Max((score/bestScore)-cutoff, 0),
		categoryRankWeightExponent,
	)
}

func categoryRatingCurve(rating float64) float64 {
	if rating > 700 {
		rating = 700 + math.Sqrt(rating-700)
	}
	if rating < 300 {
		rating = math.Pow(300, (300+rating)/600)
	}
	return rating
}

func chargerFactor(fighter Fighter) float64 {
	minimumEnergy := fighter.ChargedMoves[0].EnergyCost
	for _, move := range fighter.ChargedMoves[1:] {
		minimumEnergy = min(minimumEnergy, move.EnergyCost)
	}
	maximumEnergyRemaining := float64(EnergyCap-minimumEnergy) / EnergyCap
	stab := 1.0
	if hasType(fighter.Types, fighter.FastMove.Type) {
		stab = sameTypeAttackBonus
	}
	shadow := 1.0
	if fighter.Shadow {
		shadow = shadowAttackBonus
	}
	fastMoveDPT := (float64(fighter.FastMove.Power) * stab * shadow) *
		(fighter.Attack / 100) /
		float64(fighter.FastMove.Turns)
	return math.Pow(
		math.Pow(maximumEnergyRemaining, 0.5)*
			math.Pow(fastMoveDPT/5, 1.0/6.0),
		1.0/6.0,
	)
}

func normalizeCategoryScores(results []CategoryResult) {
	highest := 0.0
	for _, result := range results {
		highest = math.Max(highest, result.Score)
	}
	if highest <= 0 {
		return
	}
	for index := range results {
		results[index].Score = math.Floor((results[index].Score/highest)*1000) / 10
	}
}

type OverallScores struct {
	Lead        float64
	Closer      float64
	Switch      float64
	Charger     float64
	Attacker    float64
	Consistency float64
	Editor      *float64
}

type OverallRankingEntry struct {
	RankingEntry
	EditorScore *float64
}

type OverallResult struct {
	FighterID string
	Score     float64
	Scores    OverallScores
}

// RankOverall runs PvPoke's five standard category matrices and combines them
// with moveset consistency and the optional editorial override. The supplied
// moveset remains fixed across categories, matching PvPoke's "force" mode for
// published all-Pokemon rankings.
func RankOverall(entries []OverallRankingEntry) ([]OverallResult, error) {
	categoryScores := make(map[string]map[string]float64, len(StandardScenarios))
	categoryEntries := make([]RankingEntry, len(entries))
	for index, entry := range entries {
		categoryEntries[index] = entry.RankingEntry
	}

	for _, scenario := range StandardScenarios {
		results, err := RankCategory(categoryEntries, scenario)
		if err != nil {
			return nil, fmt.Errorf("rank overall %s: %w", scenario.Slug, err)
		}
		scores := make(map[string]float64, len(results))
		for _, result := range results {
			scores[result.FighterID] = result.Score
		}
		categoryScores[scenario.Slug] = scores
	}

	results := make([]OverallResult, 0, len(entries))
	for _, entry := range entries {
		fighterID := entry.Fighter.ID
		scores := OverallScores{
			Lead:        categoryScores["leads"][fighterID],
			Closer:      categoryScores["closers"][fighterID],
			Switch:      categoryScores["switches"][fighterID],
			Charger:     categoryScores["chargers"][fighterID],
			Attacker:    categoryScores["attackers"][fighterID],
			Consistency: ConsistencyScore(entry.Fighter),
			Editor:      entry.EditorScore,
		}
		results = append(results, OverallResult{
			FighterID: fighterID,
			Score:     OverallScore(scores),
			Scores:    scores,
		})
	}
	sort.SliceStable(results, func(i, j int) bool {
		if results[i].Score == results[j].Score {
			return results[i].FighterID < results[j].FighterID
		}
		return results[i].Score > results[j].Score
	})
	return results, nil
}

// OverallScore reproduces PvPoke's weighted geometric aggregation.
func OverallScore(scores OverallScores) float64 {
	core := []float64{
		scores.Lead,
		scores.Closer,
		math.Max(scores.Switch, scores.Charger),
		scores.Attacker,
	}
	sort.Sort(sort.Reverse(sort.Float64Slice(core)))
	value := math.Pow(
		math.Pow(core[0], 12)*
			math.Pow(core[1], 6)*
			math.Pow(core[2], 4)*
			core[3]*core[3]*
			scores.Consistency*scores.Consistency,
		1.0/26.0,
	)
	if scores.Attacker <= 75 && scores.Consistency <= 75 {
		value = math.Pow(
			math.Pow(value, 14)*
				scores.Attacker*
				scores.Consistency,
			1.0/16.0,
		)
	}
	if scores.Editor != nil {
		value = value*0.25 + *scores.Editor*0.75
	}
	return math.Floor(value*10) / 10
}

// ConsistencyScore reproduces PvPoke's moveset consistency heuristic.
func ConsistencyScore(fighter Fighter) float64 {
	score := 1.0
	if len(fighter.ChargedMoves) == 2 {
		scenarios := [][2]float64{{1, 1}}
		if !strings.EqualFold(
			fighter.ChargedMoves[0].Type,
			fighter.ChargedMoves[1].Type,
		) {
			scenarios = append(scenarios, [2]float64{resisted, 1}, [2]float64{1, resisted})
		}
		for _, effectiveness := range scenarios {
			score *= consistencyScenario(fighter, effectiveness)
		}
		score = math.Pow(score, 1/float64(len(scenarios)))
	}
	for _, move := range append(
		append([]Move(nil), fighter.ChargedMoves...),
		fighter.FastMove,
	) {
		switch move.ID {
		case "POWER_UP_PUNCH", "LUNGE":
			score *= 0.85
		case "FEATHER_DANCE", "BUBBLE_BEAM":
			score *= 0.75
		}
	}
	return math.Round(score*1000) / 10
}

type consistencyMove struct {
	move   Move
	damage float64
	dpe    float64
}

func consistencyScenario(fighter Fighter, effectiveness [2]float64) float64 {
	moves := []consistencyMove{
		{move: fighter.ChargedMoves[0]},
		{move: fighter.ChargedMoves[1]},
	}
	sort.SliceStable(moves, func(i, j int) bool {
		return moves[i].move.Name > moves[j].move.Name
	})
	for index := range moves {
		stab := 1.0
		if hasType(fighter.Types, moves[index].move.Type) {
			stab = sameTypeAttackBonus
		}
		moves[index].damage = float64(moves[index].move.Power) * stab
		moves[index].dpe = moves[index].damage /
			float64(moves[index].move.EnergyCost) *
			effectiveness[index]
	}
	sort.SliceStable(moves, func(i, j int) bool {
		return moves[i].dpe > moves[j].dpe
	})
	if moves[1].move.ID == "POWER_UP_PUNCH" {
		moves[1].dpe *= 2
		sort.SliceStable(moves, func(i, j int) bool {
			return moves[i].dpe > moves[j].dpe
		})
	}

	fastStab := 1.0
	if hasType(fighter.Types, fighter.FastMove.Type) {
		fastStab = sameTypeAttackBonus
	}
	fastDamage := float64(fighter.FastMove.Power) * fastStab
	cycleFastMoves := math.Ceil(
		float64(moves[0].move.EnergyCost) /
			float64(fighter.FastMove.EnergyGain),
	)
	cycleFastDamage := fastDamage * cycleFastMoves
	cycleDamage := cycleFastDamage + moves[0].damage
	if strings.EqualFold(fighter.FastMove.Type, moves[0].move.Type) {
		cycleFastDamage *= effectiveness[0]
	} else if strings.EqualFold(fighter.FastMove.Type, moves[1].move.Type) {
		cycleFastDamage *= effectiveness[1]
	}

	factor := 1.0
	best := moves[0]
	other := moves[1]
	if consistencyBaitDependent(best.move, other.move) {
		factor = (cycleFastDamage / cycleDamage) +
			((best.damage / cycleDamage) * (other.dpe / best.dpe))
		if other.move.EnergyCost < best.move.EnergyCost &&
			best.move.Buff.AttackerAttack <= 0 &&
			best.move.Buff.AttackerDefense <= 0 {
			factor += (1 - factor) *
				(float64(other.move.EnergyCost-30) /
					float64(best.move.EnergyCost-30)) *
				0.5
		} else if other.move.EnergyCost < best.move.EnergyCost &&
			(best.move.Buff.AttackerAttack > 0 || best.move.Buff.AttackerDefense > 0) {
			factor += (1 - factor) *
				(float64(other.move.EnergyCost-20) /
					float64(best.move.EnergyCost-20))
		}
	}

	buffChanceFactor := 0.0
	for _, move := range moves {
		if !move.move.Buff.Empty() &&
			move.move.Buff.Chance < 1 &&
			move.move.Buff.Chance > 0.15 {
			stages := math.Abs(float64(move.move.Buff.AttackerAttack)) +
				math.Abs(float64(move.move.Buff.AttackerDefense))
			buffConsistency := 0.5 + math.Abs(0.5-move.move.Buff.Chance)
			buffsAsDamage := move.damage + stages*25*(1-buffConsistency)
			buffChanceFactor += move.damage / buffsAsDamage
		} else {
			buffChanceFactor++
		}
	}
	return factor * (buffChanceFactor / float64(len(moves)))
}

func consistencyBaitDependent(best Move, other Move) bool {
	bestSelfDebuff := best.Buff.AttackerAttack < 0 || best.Buff.AttackerDefense < 0
	otherSelfDebuff := other.Buff.AttackerAttack < 0 || other.Buff.AttackerDefense < 0
	return best.EnergyCost > other.EnergyCost ||
		(best.EnergyCost == other.EnergyCost && other.ID == "ACID_SPRAY") ||
		(bestSelfDebuff && !otherSelfDebuff && other.EnergyCost-best.EnergyCost <= 10) ||
		(bestSelfDebuff && best.EnergyCost > 50 &&
			!otherSelfDebuff && other.EnergyCost-best.EnergyCost <= 10)
}

func maxFloat(values []float64) float64 {
	result := 0.0
	for _, value := range values {
		result = math.Max(result, value)
	}
	return result
}
