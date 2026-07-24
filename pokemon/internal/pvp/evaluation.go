package pvp

import (
	"fmt"
	"math"
)

// WeightedFighter is one fixed metagame reference used to evaluate a Trainer
// build. Weight represents that opponent's relevance within the reference
// field and must be greater than zero.
type WeightedFighter struct {
	Fighter Fighter
	Weight  float64
}

// RosterEvaluationResult describes one exact Trainer build against a fixed
// metagame field. Category scores follow the published PvPoke order:
// lead, closer, switch, charger, attacker, and consistency.
type RosterEvaluationResult struct {
	FighterID      string
	Score          float64
	CategoryScores [6]float64
}

// EvaluateRoster scores exact Trainer builds against the same fixed reference
// field. Unlike RankOverall, candidates do not become opponents, so adding a
// weak or duplicate owned Pokemon cannot change another copy's score.
func EvaluateRoster(
	candidates []Fighter,
	opponents []WeightedFighter,
) ([]RosterEvaluationResult, error) {
	if len(candidates) == 0 {
		return []RosterEvaluationResult{}, nil
	}
	if len(opponents) == 0 {
		return nil, fmt.Errorf("PvP roster evaluation needs at least one opponent")
	}
	opponentIDs := make(map[string]struct{}, len(opponents))
	for index, opponent := range opponents {
		if err := opponent.Fighter.Validate(); err != nil {
			return nil, fmt.Errorf("evaluation opponent %d: %w", index, err)
		}
		if _, exists := opponentIDs[opponent.Fighter.ID]; exists {
			return nil, fmt.Errorf("evaluation opponent IDs must be unique")
		}
		opponentIDs[opponent.Fighter.ID] = struct{}{}
		if math.IsNaN(opponent.Weight) ||
			math.IsInf(opponent.Weight, 0) ||
			opponent.Weight <= 0 {
			return nil, fmt.Errorf("evaluation opponent %d has invalid weight", index)
		}
	}

	var referenceBest [5]float64
	for scenarioIndex, scenario := range StandardScenarios {
		for _, opponent := range opponents {
			score, err := evaluateScenario(
				opponent.Fighter,
				opponents,
				scenario,
			)
			if err != nil {
				return nil, err
			}
			referenceBest[scenarioIndex] = math.Max(
				referenceBest[scenarioIndex],
				score,
			)
		}
		if referenceBest[scenarioIndex] <= 0 {
			return nil, fmt.Errorf(
				"PvP roster evaluation reference field cannot score %s",
				scenario.Slug,
			)
		}
	}

	results := make([]RosterEvaluationResult, 0, len(candidates))
	for index, candidate := range candidates {
		if err := candidate.Validate(); err != nil {
			return nil, fmt.Errorf("evaluation candidate %d: %w", index, err)
		}

		var categories [6]float64
		for scenarioIndex, scenario := range StandardScenarios {
			score, err := evaluateScenario(candidate, opponents, scenario)
			if err != nil {
				return nil, err
			}
			categories[scenarioIndex] = math.Min(
				100,
				math.Floor((score/referenceBest[scenarioIndex])*1000)/10,
			)
		}
		categories[5] = ConsistencyScore(candidate)

		scores := OverallScores{
			Lead:        categories[0],
			Closer:      categories[1],
			Switch:      categories[2],
			Charger:     categories[3],
			Attacker:    categories[4],
			Consistency: categories[5],
		}
		results = append(results, RosterEvaluationResult{
			FighterID:      candidate.ID,
			Score:          OverallScore(scores),
			CategoryScores: categories,
		})
	}
	return results, nil
}

func evaluateScenario(
	candidate Fighter,
	opponents []WeightedFighter,
	scenario Scenario,
) (float64, error) {
	weightedTotal := 0.0
	weightTotal := 0.0
	for _, opponent := range opponents {
		if candidate.ID == opponent.Fighter.ID {
			continue
		}
		config := DefaultBattleConfig()
		config.Shields = scenario.Shields
		config.StartingEnergy = scenarioStartingEnergy(
			candidate,
			opponent.Fighter,
			scenario,
		)
		battle, err := Simulate(
			[2]Fighter{candidate, opponent.Fighter},
			config,
		)
		if err != nil {
			return 0, fmt.Errorf(
				"evaluate %s vs %s in %s: %w",
				candidate.ID,
				opponent.Fighter.ID,
				scenario.Slug,
				err,
			)
		}
		weightedTotal += categoryRatingCurve(
			float64(battle.AdjustedRating(0)),
		) * opponent.Weight
		weightTotal += opponent.Weight
	}
	if weightTotal == 0 {
		return 0, nil
	}
	return math.Floor((weightedTotal/weightTotal)/10*10) / 10, nil
}
