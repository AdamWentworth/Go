package pvp

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

type rankingParityFixture struct {
	SchemaVersion int `json:"schemaVersion"`
	Source        struct {
		Name     string `json:"name"`
		Commit   string `json:"commit"`
		LeagueCP int    `json:"leagueCp"`
	} `json:"source"`
	Fighters     []Fighter                         `json:"fighters"`
	Cases        []rankingParityFixtureCase        `json:"cases"`
	OverallCases []rankingOverallParityFixtureCase `json:"overallCases"`
}

type rankingParityFixtureCase struct {
	Name           string `json:"name"`
	Scenario       string `json:"scenario"`
	CandidateID    string `json:"candidateId"`
	OpponentID     string `json:"opponentId"`
	ExpectedRating int    `json:"expectedRating"`
	Shields        [2]int `json:"shields"`
	EnergyTurns    [2]int `json:"energyTurns"`
}

type rankingOverallParityFixtureCase struct {
	SpeciesID     string     `json:"speciesId"`
	Scores        [6]float64 `json:"scores"`
	EditorScore   *float64   `json:"editorScore"`
	ExpectedScore float64    `json:"expectedScore"`
}

func TestPinnedPvPokePublishedRankingMatchups(t *testing.T) {
	path := filepath.Join("testdata", "pvpoke-ranking-matchups-v1.json")
	raw, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	var fixture rankingParityFixture
	if err := json.Unmarshal(raw, &fixture); err != nil {
		t.Fatalf("decode %s: %v", path, err)
	}
	if fixture.SchemaVersion != 1 {
		t.Fatalf("fixture schema = %d, want 1", fixture.SchemaVersion)
	}
	if fixture.Source.Commit != "f59fc0a2c78ace0b4d3b1bdcd161880e3287e4e0" {
		t.Fatalf("unexpected PvPoke source commit %q", fixture.Source.Commit)
	}
	if len(fixture.Cases) < 400 {
		t.Fatalf("fixture has only %d cases; broad parity corpus required", len(fixture.Cases))
	}

	fighters := make(map[string]Fighter, len(fixture.Fighters))
	for _, fighter := range fixture.Fighters {
		if err := fighter.Validate(); err != nil {
			t.Fatalf("fixture fighter %s: %v", fighter.ID, err)
		}
		fighters[fighter.ID] = fighter
	}

	seenCases := make(map[string]bool, len(fixture.Cases))
	for _, test := range fixture.Cases {
		test := test
		seenCases[test.Name] = true
		t.Run(test.Name, func(t *testing.T) {
			candidate, ok := fighters[test.CandidateID]
			if !ok {
				t.Fatalf("candidate %q is absent from fixture", test.CandidateID)
			}
			opponent, ok := fighters[test.OpponentID]
			if !ok {
				t.Fatalf("opponent %q is absent from fixture", test.OpponentID)
			}
			scenario := Scenario{
				Slug:        test.Scenario,
				Shields:     test.Shields,
				EnergyTurns: test.EnergyTurns,
			}
			config := DefaultBattleConfig()
			config.Shields = test.Shields
			config.StartingEnergy = scenarioStartingEnergy(
				candidate,
				opponent,
				scenario,
			)
			config.RecordTimeline = true
			result, err := Simulate([2]Fighter{candidate, opponent}, config)
			if err != nil {
				t.Fatal(err)
			}
			if got := result.Rating(0); got != test.ExpectedRating {
				t.Fatalf(
					"rating = %d, want %d; winner=%d turns=%d timeline=%+v",
					got,
					test.ExpectedRating,
					result.Winner,
					result.Turns,
					result.Timeline,
				)
			}
		})
	}
	for _, required := range []string{
		"chargers/malamar_shadow/tinkaton",
	} {
		if !seenCases[required] {
			t.Fatalf("required differential regression %q is absent", required)
		}
	}
}

func TestPinnedPvPokePublishedOverallScores(t *testing.T) {
	path := filepath.Join("testdata", "pvpoke-ranking-matchups-v1.json")
	raw, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	var fixture rankingParityFixture
	if err := json.Unmarshal(raw, &fixture); err != nil {
		t.Fatalf("decode %s: %v", path, err)
	}
	if len(fixture.OverallCases) < 100 {
		t.Fatalf(
			"fixture has only %d overall cases; broad parity corpus required",
			len(fixture.OverallCases),
		)
	}

	for _, test := range fixture.OverallCases {
		test := test
		t.Run(test.SpeciesID, func(t *testing.T) {
			got := OverallScore(OverallScores{
				Lead:        test.Scores[0],
				Closer:      test.Scores[1],
				Switch:      test.Scores[2],
				Charger:     test.Scores[3],
				Attacker:    test.Scores[4],
				Consistency: test.Scores[5],
				Editor:      test.EditorScore,
			})
			if got != test.ExpectedScore {
				t.Fatalf(
					"overall score = %.1f, want %.1f for scores %v",
					got,
					test.ExpectedScore,
					test.Scores,
				)
			}
		})
	}
}
