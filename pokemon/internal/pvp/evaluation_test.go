package pvp

import (
	"fmt"
	"testing"
)

func TestEvaluateRosterUsesExactCandidateStats(t *testing.T) {
	fast := testFast(4, 1, 8)
	charge := testCharged("BODY_SLAM", 50, 35, BuffEffect{})
	opponents := []WeightedFighter{
		{
			Fighter: battleTestFighter("meta-one", 110, 140, fast, charge),
			Weight:  1,
		},
		{
			Fighter: battleTestFighter("meta-two", 120, 125, fast, charge),
			Weight:  0.8,
		},
	}
	candidates := []Fighter{
		battleTestFighter("powered-copy", 125, 165, fast, charge),
		battleTestFighter("underleveled-copy", 80, 90, fast, charge),
	}

	results, err := EvaluateRoster(candidates, opponents)
	if err != nil {
		t.Fatal(err)
	}
	if len(results) != 2 {
		t.Fatalf("result count = %d, want 2", len(results))
	}
	if results[0].FighterID != "powered-copy" ||
		results[1].FighterID != "underleveled-copy" {
		t.Fatalf("results no longer preserve candidate order: %#v", results)
	}
	if results[0].Score <= results[1].Score {
		t.Fatalf(
			"powered exact copy score %.1f should exceed underleveled copy %.1f",
			results[0].Score,
			results[1].Score,
		)
	}
	for _, result := range results {
		for index, score := range result.CategoryScores {
			if score <= 0 || score > 100 {
				t.Fatalf(
					"candidate %s category %d score %.1f outside 0-100",
					result.FighterID,
					index,
					score,
				)
			}
		}
	}
}

func TestEvaluateRosterRejectsInvalidReferenceWeight(t *testing.T) {
	fast := testFast(4, 1, 8)
	charge := testCharged("BODY_SLAM", 50, 35, BuffEffect{})
	_, err := EvaluateRoster(
		[]Fighter{battleTestFighter("candidate", 100, 100, fast, charge)},
		[]WeightedFighter{{
			Fighter: battleTestFighter("opponent", 100, 100, fast, charge),
			Weight:  0,
		}},
	)
	if err == nil {
		t.Fatal("expected invalid opponent weight to be rejected")
	}
}

func BenchmarkEvaluateRoster200By12(b *testing.B) {
	fast := testFast(4, 1, 8)
	charge := testCharged("BODY_SLAM", 50, 35, BuffEffect{})
	candidates := make([]Fighter, 200)
	for index := range candidates {
		candidates[index] = battleTestFighter(
			fmt.Sprintf("candidate-%d", index),
			100+float64(index%20),
			130+index%25,
			fast,
			charge,
		)
	}
	opponents := make([]WeightedFighter, 12)
	for index := range opponents {
		opponents[index] = WeightedFighter{
			Fighter: battleTestFighter(
				fmt.Sprintf("opponent-%d", index),
				105+float64(index),
				135+index,
				fast,
				charge,
			),
			Weight: 1,
		}
	}

	b.ResetTimer()
	for range b.N {
		if _, err := EvaluateRoster(candidates, opponents); err != nil {
			b.Fatal(err)
		}
	}
}
