package pvp

import (
	"math"
	"testing"
)

func TestStandardRankingScenariosMatchPinnedPvPoke(t *testing.T) {
	want := []Scenario{
		{Slug: "leads", Shields: [2]int{1, 1}},
		{Slug: "closers", Shields: [2]int{0, 0}},
		{Slug: "switches", Shields: [2]int{1, 1}, EnergyTurns: [2]int{4, 0}},
		{Slug: "chargers", Shields: [2]int{1, 1}, EnergyTurns: [2]int{6, 0}},
		{Slug: "attackers", Shields: [2]int{0, 1}},
	}
	if len(StandardScenarios) != len(want) {
		t.Fatalf("scenario count = %d, want %d", len(StandardScenarios), len(want))
	}
	for index := range want {
		if StandardScenarios[index] != want[index] {
			t.Fatalf(
				"scenario %d = %#v, want %#v",
				index,
				StandardScenarios[index],
				want[index],
			)
		}
	}
}

func TestScenarioStartingEnergyPreservesPvPokeAsymmetry(t *testing.T) {
	candidate := battleTestFighter(
		"candidate",
		100,
		100,
		testFast(1, 2, 7),
		testCharged("candidate-charge", 1, 35, BuffEffect{}),
	)
	opponent := battleTestFighter(
		"opponent",
		100,
		100,
		testFast(1, 1, 3),
		testCharged("opponent-charge", 1, 35, BuffEffect{}),
	)
	scenario := Scenario{
		Slug:        "custom",
		EnergyTurns: [2]int{6, 8},
	}
	if got := scenarioStartingEnergy(candidate, opponent, scenario); got != [2]int{21, 21} {
		t.Fatalf("starting energy = %v, want pinned PvPoke behavior [21 21]", got)
	}
}

func TestCategoryRatingCurvesMatchPvPoke(t *testing.T) {
	tests := []struct {
		rating float64
		want   float64
	}{
		{rating: 800, want: 710},
		{rating: 700, want: 700},
		{rating: 300, want: 300},
		{rating: 200, want: 115.94918818030379},
	}
	for _, test := range tests {
		if got := categoryRatingCurve(test.rating); math.Abs(got-test.want) > 1e-9 {
			t.Fatalf("categoryRatingCurve(%f) = %.12f, want %.12f", test.rating, got, test.want)
		}
	}
}

func TestCategoryOpponentWeightMatchesPvPoke(t *testing.T) {
	want := math.Pow(0.8, 1.65)
	if got := categoryOpponentWeight(900, 1000, 0); math.Abs(got-want) > 1e-12 {
		t.Fatalf("opponent weight = %.12f, want %.12f", got, want)
	}
	if got := categoryOpponentWeight(100, 1000, 0); got != 0 {
		t.Fatalf("cutoff opponent weight = %f, want 0", got)
	}
}

func TestOverallScoreMatchesPvPokeAggregation(t *testing.T) {
	scores := OverallScores{
		Lead:        95,
		Closer:      90,
		Switch:      80,
		Charger:     75,
		Attacker:    70,
		Consistency: 85,
	}
	if got := OverallScore(scores); got != 88.4 {
		t.Fatalf("overall score = %.1f, want 88.4", got)
	}

	editor := 96.0
	scores.Editor = &editor
	if got := OverallScore(scores); got != 94.1 {
		t.Fatalf("editor-weighted score = %.1f, want 94.1", got)
	}
}

func TestOverallScorePenalizesLowPressureAndConsistency(t *testing.T) {
	unpenalized := OverallScore(OverallScores{
		Lead: 95, Closer: 90, Switch: 80, Charger: 75,
		Attacker: 76, Consistency: 76,
	})
	penalized := OverallScore(OverallScores{
		Lead: 95, Closer: 90, Switch: 80, Charger: 75,
		Attacker: 70, Consistency: 70,
	})
	if penalized >= unpenalized {
		t.Fatalf("low-pressure score %.1f should be below %.1f", penalized, unpenalized)
	}
}

func TestConsistencyScoreHandlesSimpleAndPenaltyMoves(t *testing.T) {
	fighter := battleTestFighter(
		"simple",
		100,
		100,
		testFast(3, 1, 8),
		testCharged("BODY_SLAM", 50, 35, BuffEffect{}),
		testCharged("STOMP", 50, 35, BuffEffect{}),
	)
	if got := ConsistencyScore(fighter); got != 100 {
		t.Fatalf("simple consistency = %.1f, want 100", got)
	}

	fighter.ChargedMoves = []Move{
		testCharged("POWER_UP_PUNCH", 20, 35, BuffEffect{AttackerAttack: 1, Chance: 1}),
	}
	if got := ConsistencyScore(fighter); got != 85 {
		t.Fatalf("Power-Up Punch consistency = %.1f, want 85", got)
	}
}

func TestRankCategoryProducesNormalizedDeterministicOrder(t *testing.T) {
	fast := testFast(4, 1, 8)
	charge := testCharged("BODY_SLAM", 50, 35, BuffEffect{})
	entries := []RankingEntry{
		{Fighter: battleTestFighter("bulky", 95, 180, fast, charge)},
		{Fighter: battleTestFighter("balanced", 110, 140, fast, charge)},
		{Fighter: battleTestFighter("frail", 125, 95, fast, charge)},
	}

	first, err := RankCategory(entries, StandardScenarios[0])
	if err != nil {
		t.Fatal(err)
	}
	second, err := RankCategory(entries, StandardScenarios[0])
	if err != nil {
		t.Fatal(err)
	}
	if len(first) != len(entries) || first[0].Score != 100 {
		t.Fatalf("unexpected normalized ranking: %#v", first)
	}
	for index := range first {
		if first[index].FighterID != second[index].FighterID ||
			first[index].Score != second[index].Score {
			t.Fatalf("ranking is not deterministic: %#v vs %#v", first, second)
		}
	}
}

func TestRankOverallJoinsEveryStandardCategory(t *testing.T) {
	fast := testFast(4, 1, 8)
	charge := testCharged("BODY_SLAM", 50, 35, BuffEffect{})
	editorScore := 95.0
	entries := []OverallRankingEntry{
		{
			RankingEntry: RankingEntry{
				Fighter: battleTestFighter("bulky", 95, 180, fast, charge),
			},
		},
		{
			RankingEntry: RankingEntry{
				Fighter: battleTestFighter("balanced", 110, 140, fast, charge),
			},
			EditorScore: &editorScore,
		},
		{
			RankingEntry: RankingEntry{
				Fighter: battleTestFighter("frail", 125, 95, fast, charge),
			},
		},
	}

	first, err := RankOverall(entries)
	if err != nil {
		t.Fatal(err)
	}
	second, err := RankOverall(entries)
	if err != nil {
		t.Fatal(err)
	}
	if len(first) != len(entries) {
		t.Fatalf("overall result count = %d, want %d", len(first), len(entries))
	}
	for index, result := range first {
		if result.Scores.Lead == 0 ||
			result.Scores.Closer == 0 ||
			result.Scores.Switch == 0 ||
			result.Scores.Charger == 0 ||
			result.Scores.Attacker == 0 ||
			result.Scores.Consistency == 0 {
			t.Fatalf("incomplete category scores for %s: %#v", result.FighterID, result.Scores)
		}
		if result.FighterID != second[index].FighterID ||
			result.Score != second[index].Score {
			t.Fatalf("overall ranking is not deterministic: %#v vs %#v", first, second)
		}
	}

	var balanced *OverallResult
	for index := range first {
		if first[index].FighterID == "balanced" {
			balanced = &first[index]
			break
		}
	}
	if balanced == nil || balanced.Scores.Editor == nil ||
		*balanced.Scores.Editor != editorScore {
		t.Fatalf("editor score was not preserved: %#v", balanced)
	}
	if first[0].FighterID != "balanced" {
		t.Fatalf("editor-weighted fighter should rank first: %#v", first)
	}
}
