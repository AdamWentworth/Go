package pvp

// PvPokePolicy reproduces the deterministic simulation policy used by the
// pinned PvPoke ranking snapshot. Move priority is frozen on first use, just as
// PvPoke's resetMoves does at battle start.
type PvPokePolicy struct {
	cache *movePlanCache

	// NoBait disables PvPoke's standard ranking behavior of baiting shields.
	// The zero value intentionally keeps baiting enabled because that is how
	// PvPoke generates its published league rankings.
	NoBait bool
}

func (policy *PvPokePolicy) ChooseAction(self State, opponent State) Action {
	index := policy.chooseChargedMove(self, opponent)
	if index < 0 {
		return FastAction()
	}
	return ChargedAction(index)
}

func (policy *PvPokePolicy) ShouldShield(
	attacker State,
	defender State,
	move Move,
	unshieldedDamage int,
) bool {
	return simulateModeShield(attacker, defender, move, unshieldedDamage)
}

func decisionDamage(attacker State, defender State, move Move) int {
	attackerModel := Fighter{
		ID:      attacker.ID,
		Types:   attacker.Types,
		Attack:  attacker.Attack,
		Defense: 1,
		HP:      max(attacker.MaxHP, 1),
		Shadow:  attacker.Shadow,
		FastMove: Move{
			ID: "decision-placeholder-fast", Type: "normal", Kind: FastMove, Turns: 1,
		},
		ChargedMoves: []Move{{
			ID: "decision-placeholder-charged", Type: "normal", Kind: ChargedMove, EnergyCost: 1,
		}},
	}
	defenderModel := Fighter{
		ID:      defender.ID,
		Types:   defender.Types,
		Attack:  1,
		Defense: defender.Defense,
		HP:      max(defender.MaxHP, 1),
		Shadow:  defender.Shadow,
		FastMove: Move{
			ID: "decision-placeholder-fast", Type: "normal", Kind: FastMove, Turns: 1,
		},
		ChargedMoves: []Move{{
			ID: "decision-placeholder-charged", Type: "normal", Kind: ChargedMove, EnergyCost: 1,
		}},
	}
	return Damage(
		attackerModel,
		attacker.AttackStage,
		defenderModel,
		defender.DefenseStage,
		move,
	)
}

// FastOnlyPolicy is useful for exact timing and damage parity fixtures.
type FastOnlyPolicy struct {
	Shield bool
}

func (policy FastOnlyPolicy) ChooseAction(State, State) Action {
	return FastAction()
}

func (policy FastOnlyPolicy) ShouldShield(State, State, Move, int) bool {
	return policy.Shield
}

// ScriptedPolicy returns actions in order, then falls back to fast attacks.
// It is intended for deterministic mechanics tests and oracle fixtures.
type ScriptedPolicy struct {
	Actions []Action
	Shield  bool
	index   int
}

func (policy *ScriptedPolicy) ChooseAction(State, State) Action {
	if policy.index >= len(policy.Actions) {
		return FastAction()
	}
	action := policy.Actions[policy.index]
	policy.index++
	return action
}

func (policy *ScriptedPolicy) ShouldShield(State, State, Move, int) bool {
	return policy.Shield
}
