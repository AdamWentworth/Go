package pvp

import "testing"

func battleTestFighter(
	id string,
	attack float64,
	hp int,
	fast Move,
	charged ...Move,
) Fighter {
	return Fighter{
		ID:           id,
		Name:         id,
		Types:        []string{"normal"},
		Attack:       attack,
		Defense:      100,
		HP:           hp,
		FastMove:     fast,
		ChargedMoves: charged,
	}
}

func testFast(power int, turns int, energy int) Move {
	return Move{
		ID: "fast", Name: "Fast", Type: "normal", Kind: FastMove,
		Power: power, Turns: turns, EnergyGain: energy,
	}
}

func testCharged(id string, power int, cost int, buff BuffEffect) Move {
	return Move{
		ID: id, Name: id, Type: "normal", Kind: ChargedMove,
		Power: power, EnergyCost: cost, Turns: 1, Buff: buff,
	}
}

func TestLegacyOneTurnFastMovesCanDoubleKO(t *testing.T) {
	fighters := [2]Fighter{
		battleTestFighter("a", 100, 7, testFast(10, 1, 5), testCharged("charged-a", 10, 35, BuffEffect{})),
		battleTestFighter("b", 100, 7, testFast(10, 1, 5), testCharged("charged-b", 10, 35, BuffEffect{})),
	}
	config := DefaultBattleConfig()
	config.Shields = [2]int{0, 0}
	config.Policies = [2]Policy{FastOnlyPolicy{}, FastOnlyPolicy{}}

	result, err := Simulate(fighters, config)
	if err != nil {
		t.Fatal(err)
	}
	if result.Winner != -1 || result.Fighters[0].HP != 0 || result.Fighters[1].HP != 0 {
		t.Fatalf("expected double KO, got winner=%d hp=%d/%d", result.Winner, result.Fighters[0].HP, result.Fighters[1].HP)
	}
	if result.Rating(0) != 500 || result.Rating(1) != 500 {
		t.Fatalf("double KO ratings = %d/%d, want 500/500", result.Rating(0), result.Rating(1))
	}
}

func TestLegacyChargedMovePriorityUsesUnmodifiedAttack(t *testing.T) {
	knockout := testCharged("knockout", 500, 35, BuffEffect{})
	fighters := [2]Fighter{
		battleTestFighter("higher", 110, 100, testFast(1, 1, 1), knockout),
		battleTestFighter("lower", 100, 100, testFast(1, 1, 1), knockout),
	}
	policy0 := &ScriptedPolicy{Actions: []Action{ChargedAction(0)}}
	policy1 := &ScriptedPolicy{Actions: []Action{ChargedAction(0)}}
	config := DefaultBattleConfig()
	config.Shields = [2]int{0, 0}
	config.StartingEnergy = [2]int{35, 35}
	config.Policies = [2]Policy{policy0, policy1}
	config.RecordTimeline = true

	result, err := Simulate(fighters, config)
	if err != nil {
		t.Fatal(err)
	}
	if result.Winner != 0 {
		t.Fatalf("winner = %d, want higher-Attack fighter 0", result.Winner)
	}
	if len(result.Timeline) != 1 || result.Timeline[0].Actor != 0 || result.Timeline[0].Kind != ActionCharged {
		t.Fatalf("unexpected CMP timeline: %#v", result.Timeline)
	}
}

func TestShieldReducesChargedDamageToOne(t *testing.T) {
	charge := testCharged("charge", 100, 35, BuffEffect{})
	fighters := [2]Fighter{
		battleTestFighter("attacker", 100, 200, testFast(1, 1, 1), charge),
		battleTestFighter("defender", 100, 200, testFast(1, 1, 1), charge),
	}
	attackerPolicy := &ScriptedPolicy{Actions: []Action{ChargedAction(0)}}
	defenderPolicy := &ScriptedPolicy{Actions: []Action{WaitAction()}, Shield: true}
	config := DefaultBattleConfig()
	config.Shields = [2]int{0, 1}
	config.StartingEnergy[0] = 35
	config.Policies = [2]Policy{attackerPolicy, defenderPolicy}
	config.RecordTimeline = true
	config.MaxTurns = 1

	result, err := Simulate(fighters, config)
	if err != nil {
		t.Fatal(err)
	}
	if got := result.Fighters[1].HP; got != 199 {
		t.Fatalf("defender HP = %d, want 199", got)
	}
	if result.Fighters[1].Shields != 0 {
		t.Fatalf("defender shields = %d, want 0", result.Fighters[1].Shields)
	}
	if len(result.Timeline) == 0 || !result.Timeline[0].Shielded {
		t.Fatalf("charged move was not recorded as shielded: %#v", result.Timeline)
	}
}

func TestChanceBuffsUsePvPokeDeterministicMeter(t *testing.T) {
	buffMove := testCharged("chance-buff", 1, 35, BuffEffect{
		AttackerAttack: 1,
		Chance:         0.5,
	})
	fighters := [2]Fighter{
		battleTestFighter("attacker", 100, 500, testFast(1, 1, 35), buffMove),
		battleTestFighter("defender", 100, 500, testFast(1, 1, 1), buffMove),
	}
	attackerPolicy := &ScriptedPolicy{Actions: []Action{ChargedAction(0), ChargedAction(0)}}
	defenderPolicy := &ScriptedPolicy{Actions: []Action{WaitAction(), WaitAction()}}
	config := DefaultBattleConfig()
	config.Shields = [2]int{0, 0}
	config.StartingEnergy[0] = 100
	config.Policies = [2]Policy{attackerPolicy, defenderPolicy}
	config.RecordTimeline = true

	result, err := Simulate(fighters, config)
	if err != nil {
		t.Fatal(err)
	}
	if result.Fighters[0].AttackStage != 1 {
		t.Fatalf("attack stage = %d, want deterministic second-use proc to +1", result.Fighters[0].AttackStage)
	}
	var chargeEvents []Event
	for _, event := range result.Timeline {
		if event.MoveID == "chance-buff" {
			chargeEvents = append(chargeEvents, event)
		}
	}
	if len(chargeEvents) < 2 || chargeEvents[0].Buffed || !chargeEvents[1].Buffed {
		t.Fatalf("unexpected deterministic buff sequence: %#v", chargeEvents)
	}
}

func TestFastMoveEnergyIsCappedAtOneHundred(t *testing.T) {
	fighters := [2]Fighter{
		battleTestFighter("a", 100, 300, testFast(1, 1, 60), testCharged("charged-a", 1, 100, BuffEffect{})),
		battleTestFighter("b", 100, 1, testFast(1, 5, 1), testCharged("charged-b", 1, 100, BuffEffect{})),
	}
	config := DefaultBattleConfig()
	config.Shields = [2]int{0, 0}
	config.StartingEnergy[0] = 90
	config.Policies = [2]Policy{FastOnlyPolicy{}, FastOnlyPolicy{}}

	result, err := Simulate(fighters, config)
	if err != nil {
		t.Fatal(err)
	}
	if result.Fighters[0].Energy != 100 {
		t.Fatalf("energy = %d, want cap 100", result.Fighters[0].Energy)
	}
}

func TestCurrentMechanicsCannotSilentlyUseLegacyEngine(t *testing.T) {
	fighters := [2]Fighter{
		battleTestFighter("a", 100, 100, testFast(1, 1, 1), testCharged("charged-a", 1, 35, BuffEffect{})),
		battleTestFighter("b", 100, 100, testFast(1, 1, 1), testCharged("charged-b", 1, 35, BuffEffect{})),
	}
	config := DefaultBattleConfig()
	config.Mechanics = MechanicsCurrent

	if _, err := Simulate(fighters, config); err == nil {
		t.Fatal("expected current mechanics to fail closed until implemented")
	}
}

func TestAdjustedRatingCreditsWinnerShieldValue(t *testing.T) {
	result := BattleResult{
		Fighters: [2]CombatantResult{
			{HP: 50, MaxHP: 100, Shields: 1, StartShields: 1},
			{HP: 0, MaxHP: 100, Shields: 0, StartShields: 1},
		},
	}
	if got := result.Rating(0); got != 750 {
		t.Fatalf("base rating = %d, want 750", got)
	}
	if got := result.AdjustedRating(0); got != 950 {
		t.Fatalf("adjusted rating = %d, want 950", got)
	}
	if got := result.AdjustedRating(1); got != 250 {
		t.Fatalf("loser adjusted rating = %d, want 250", got)
	}
}
