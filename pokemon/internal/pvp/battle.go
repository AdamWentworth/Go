package pvp

import (
	"errors"
	"fmt"
	"math"
	"sort"
)

type faintSource string

const (
	faintedByFast    faintSource = "fast"
	faintedByCharged faintSource = "charged"
)

type combatant struct {
	model         Fighter
	hp            int
	energy        int
	shields       int
	startShields  int
	attackStage   int
	defenseStage  int
	cooldownTurns int
	fastPending   bool
	faintedBy     faintSource
	buffMeters    map[string]float64
}

func newCombatant(model Fighter, shields int, energy int) *combatant {
	meters := make(map[string]float64, len(model.ChargedMoves))
	for _, move := range model.ChargedMoves {
		if move.Buff.Empty() || move.Buff.Chance <= 0 || move.Buff.Chance >= 1 {
			continue
		}
		meters[move.ID] = move.Buff.Chance
		if move.Buff.Chance == 0.5 {
			meters[move.ID] = 0
		}
	}
	return &combatant{
		model:        model,
		hp:           model.HP,
		energy:       max(0, min(EnergyCap, energy)),
		shields:      max(0, shields),
		startShields: max(0, shields),
		buffMeters:   meters,
	}
}

func (fighter *combatant) state() State {
	return State{
		ID:            fighter.model.ID,
		Types:         append([]string(nil), fighter.model.Types...),
		Attack:        fighter.model.Attack,
		Defense:       fighter.model.Defense,
		Shadow:        fighter.model.Shadow,
		HP:            fighter.hp,
		MaxHP:         fighter.model.HP,
		Energy:        fighter.energy,
		Shields:       fighter.shields,
		AttackStage:   fighter.attackStage,
		DefenseStage:  fighter.defenseStage,
		CooldownTurns: fighter.cooldownTurns,
		PendingFast:   fighter.fastPending,
		FastMove:      fighter.model.FastMove,
		ChargedMoves:  append([]Move(nil), fighter.model.ChargedMoves...),
	}
}

type queuedAction struct {
	kind        ActionKind
	actor       int
	startTurn   int
	chargedMove int
	priority    int
	floating    bool
	order       int
}

type simulator struct {
	fighters  [2]*combatant
	config    BattleConfig
	policies  [2]Policy
	queued    []queuedAction
	nextOrder int
	turn      int
	timeMs    int
	timeline  []Event
}

// Simulate runs one deterministic one-on-one battle.
func Simulate(fighters [2]Fighter, config BattleConfig) (BattleResult, error) {
	if err := fighters[0].Validate(); err != nil {
		return BattleResult{}, fmt.Errorf("fighter 0: %w", err)
	}
	if err := fighters[1].Validate(); err != nil {
		return BattleResult{}, fmt.Errorf("fighter 1: %w", err)
	}
	if config.Mechanics == "" {
		config.Mechanics = MechanicsPvPokeLegacy
	}
	if config.Mechanics == MechanicsCurrent {
		return BattleResult{}, errors.New(
			"current-2026 mechanics are not enabled yet; use pvpoke-legacy for pinned ranking parity",
		)
	}
	if config.Mechanics != MechanicsPvPokeLegacy {
		return BattleResult{}, fmt.Errorf("unsupported PvP mechanics %q", config.Mechanics)
	}
	if config.MaxTurns <= 0 {
		config.MaxTurns = DefaultMaxTurn
	}

	policies := config.Policies
	for index := range policies {
		if policies[index] == nil {
			policies[index] = &PvPokePolicy{}
		}
	}

	sim := simulator{
		fighters: [2]*combatant{
			newCombatant(fighters[0], config.Shields[0], config.StartingEnergy[0]),
			newCombatant(fighters[1], config.Shields[1], config.StartingEnergy[1]),
		},
		config:   config,
		policies: policies,
		turn:     1,
	}

	for sim.turn <= config.MaxTurns &&
		sim.timeMs <= 240_000 &&
		sim.fighters[0].hp > 0 &&
		sim.fighters[1].hp > 0 {
		sim.stepLegacy()
	}
	return sim.result(), nil
}

func (sim *simulator) stepLegacy() {
	for _, fighter := range sim.fighters {
		fighter.cooldownTurns = max(0, fighter.cooldownTurns-1)
	}

	newActions := make([]queuedAction, 0, 2)
	for actor, fighter := range sim.fighters {
		if fighter.cooldownTurns != 0 || fighter.hp <= 0 || sim.fighters[1-actor].hp <= 0 {
			continue
		}
		action := sim.policies[actor].ChooseAction(
			fighter.state(),
			sim.fighters[1-actor].state(),
		)
		if action.Kind == ActionCharged &&
			(action.ChargedMove < 0 ||
				action.ChargedMove >= len(fighter.model.ChargedMoves) ||
				fighter.energy < fighter.model.ChargedMoves[action.ChargedMove].EnergyCost) {
			action = FastAction()
		}
		if action.Kind != ActionFast && action.Kind != ActionCharged && action.Kind != ActionWait {
			action = FastAction()
		}

		queued := queuedAction{
			kind:        action.Kind,
			actor:       actor,
			startTurn:   sim.turn,
			chargedMove: action.ChargedMove,
			order:       sim.nextOrder,
		}
		sim.nextOrder++
		if action.Kind == ActionFast {
			fighter.cooldownTurns += fighter.model.FastMove.Turns
			fighter.fastPending = true
		}
		newActions = append(newActions, queued)
	}
	sim.queued = append(sim.queued, newActions...)

	chargedQueued := false
	for _, action := range sim.queued {
		if action.kind == ActionCharged {
			chargedQueued = true
			break
		}
	}

	ready := make([]queuedAction, 0, len(sim.queued))
	remaining := sim.queued[:0]
	for _, action := range sim.queued {
		switch action.kind {
		case ActionFast:
			moveTurns := sim.fighters[action.actor].model.FastMove.Turns
			switch {
			case sim.turn-action.startTurn >= moveTurns-1:
				action.priority += 20
				ready = append(ready, action)
			case chargedQueued:
				action.priority -= 20
				action.floating = true
				ready = append(ready, action)
			default:
				remaining = append(remaining, action)
			}
		case ActionCharged:
			action.priority += 10
			opponent := 1 - action.actor
			if sim.fighters[action.actor].model.Attack > sim.fighters[opponent].model.Attack {
				action.priority++
			}
			ready = append(ready, action)
		case ActionWait:
			ready = append(ready, action)
		}
	}
	sim.queued = remaining
	sort.SliceStable(ready, func(i, j int) bool {
		if ready[i].priority == ready[j].priority {
			return ready[i].order < ready[j].order
		}
		return ready[i].priority > ready[j].priority
	})

	chargedCount := 0
	opponentCharged := [2]bool{}
	for _, action := range ready {
		if action.kind == ActionCharged {
			opponentCharged[1-action.actor] = true
		}
	}
	for _, action := range ready {
		if !sim.validLegacyAction(action, ready, opponentCharged[action.actor]) {
			continue
		}
		switch action.kind {
		case ActionFast:
			sim.fighters[action.actor].fastPending = false
			sim.useFast(action.actor)
		case ActionCharged:
			if sim.useCharged(action.actor, action.chargedMove) {
				chargedCount++
			}
		}
	}

	if chargedCount > 0 {
		sim.timeMs += chargedCount * 10_000
		for _, fighter := range sim.fighters {
			fighter.cooldownTurns = 0
		}
	} else {
		sim.timeMs += 500
	}
	sim.turn++
}

func (sim *simulator) validLegacyAction(
	action queuedAction,
	turnActions []queuedAction,
	opponentChargedThisTurn bool,
) bool {
	actor := sim.fighters[action.actor]
	opponent := sim.fighters[1-action.actor]
	switch action.kind {
	case ActionFast:
		if opponent.hp < 1 {
			return false
		}
		return actor.hp >= 1 || actor.faintedBy != faintedByCharged
	case ActionCharged:
		if action.chargedMove < 0 || action.chargedMove >= len(actor.model.ChargedMoves) {
			return false
		}
		move := actor.model.ChargedMoves[action.chargedMove]
		if actor.energy < move.EnergyCost {
			return false
		}
		if actor.hp <= 0 && actor.faintedBy == faintedByCharged {
			return false
		}
		lethalFast := actor.hp < 1
		for _, other := range turnActions {
			if other.actor == action.actor || other.kind != ActionFast {
				continue
			}
			fastAttacker := sim.fighters[other.actor]
			damage := Damage(
				fastAttacker.model,
				fastAttacker.attackStage,
				actor.model,
				actor.defenseStage,
				fastAttacker.model.FastMove,
			)
			if fastAttacker.cooldownTurns == 0 && actor.hp <= damage {
				lethalFast = true
			}
		}
		return !lethalFast || opponentChargedThisTurn
	case ActionWait:
		return true
	default:
		return false
	}
}

func (sim *simulator) useFast(actorIndex int) {
	attacker := sim.fighters[actorIndex]
	defender := sim.fighters[1-actorIndex]
	move := attacker.model.FastMove
	damage := Damage(
		attacker.model,
		attacker.attackStage,
		defender.model,
		defender.defenseStage,
		move,
	)
	attacker.energy = min(EnergyCap, attacker.energy+move.EnergyGain)
	defender.hp = max(0, defender.hp-damage)
	if defender.hp == 0 {
		defender.faintedBy = faintedByFast
	}
	sim.record(Event{
		Turn: sim.turn, Actor: actorIndex, Kind: ActionFast, MoveID: move.ID, Damage: damage,
	})
}

func (sim *simulator) useCharged(actorIndex int, moveIndex int) bool {
	attacker := sim.fighters[actorIndex]
	defender := sim.fighters[1-actorIndex]
	if moveIndex < 0 || moveIndex >= len(attacker.model.ChargedMoves) {
		return false
	}
	move := attacker.model.ChargedMoves[moveIndex]
	if attacker.energy < move.EnergyCost {
		return false
	}

	attacker.energy -= move.EnergyCost
	damage := Damage(
		attacker.model,
		attacker.attackStage,
		defender.model,
		defender.defenseStage,
		move,
	)
	shielded := defender.shields > 0 && sim.policies[1-actorIndex].ShouldShield(
		attacker.state(),
		defender.state(),
		move,
		damage,
	)
	if shielded {
		defender.shields--
		damage = 1
	}
	defender.hp = max(0, defender.hp-damage)
	if defender.hp == 0 {
		defender.faintedBy = faintedByCharged
	}

	buffed := attacker.applyBuff(move, defender)
	sim.record(Event{
		Turn: sim.turn, Actor: actorIndex, Kind: ActionCharged, MoveID: move.ID,
		Damage: damage, Shielded: shielded, Buffed: buffed,
	})
	return true
}

func (attacker *combatant) applyBuff(move Move, defender *combatant) bool {
	if move.Buff.Empty() || move.Buff.Chance <= 0 {
		return false
	}
	applies := move.Buff.Chance >= 1
	if !applies {
		meter := attacker.buffMeters[move.ID]
		before := math.Floor(meter)
		meter += move.Buff.Chance
		attacker.buffMeters[move.ID] = meter
		applies = before < math.Floor(meter)
	}
	if !applies {
		return false
	}

	attacker.attackStage = clampStage(attacker.attackStage + move.Buff.AttackerAttack)
	attacker.defenseStage = clampStage(attacker.defenseStage + move.Buff.AttackerDefense)
	defender.attackStage = clampStage(defender.attackStage + move.Buff.TargetAttack)
	defender.defenseStage = clampStage(defender.defenseStage + move.Buff.TargetDefense)
	return true
}

func clampStage(stage int) int {
	return max(-MaxStatStage, min(MaxStatStage, stage))
}

func (sim *simulator) record(event Event) {
	if sim.config.RecordTimeline {
		sim.timeline = append(sim.timeline, event)
	}
}

func (sim *simulator) result() BattleResult {
	result := BattleResult{
		Mechanics: sim.config.Mechanics,
		Turns:     max(0, sim.turn-1),
		TimeMs:    sim.timeMs,
		Winner:    -1,
		Timeline:  append([]Event(nil), sim.timeline...),
	}
	for index, fighter := range sim.fighters {
		result.Fighters[index] = CombatantResult{
			HP:           fighter.hp,
			MaxHP:        fighter.model.HP,
			Energy:       fighter.energy,
			Shields:      fighter.shields,
			StartShields: fighter.startShields,
			AttackStage:  fighter.attackStage,
			DefenseStage: fighter.defenseStage,
		}
	}
	rating0 := result.Rating(0)
	rating1 := result.Rating(1)
	if rating0 > rating1 {
		result.Winner = 0
	} else if rating1 > rating0 {
		result.Winner = 1
	}
	return result
}
