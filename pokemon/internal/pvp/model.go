// Package pvp contains deterministic Pokemon GO Trainer Battle simulation and
// ranking primitives. It intentionally has no HTTP or database dependencies so
// the battle model can be compared against pinned PvPoke fixtures in isolation.
package pvp

import (
	"errors"
	"fmt"
	"strings"
)

const (
	EnergyCap      = 100
	MaxStatStage   = 4
	DefaultMaxTurn = 480
)

// Mechanics identifies the turn-resolution rules used by a battle.
type Mechanics string

const (
	// MechanicsPvPokeLegacy reproduces the timing model used by the pinned
	// PvPoke ranking snapshot. It remains necessary for differential parity.
	MechanicsPvPokeLegacy Mechanics = "pvpoke-legacy"

	// MechanicsCurrent is reserved for the Trainer Battle rules rolled out by
	// Pokemon GO on June 23, 2026. It must not silently fall back to legacy.
	MechanicsCurrent Mechanics = "current-2026"
)

type MoveKind string

const (
	FastMove    MoveKind = "fast"
	ChargedMove MoveKind = "charged"
)

// BuffEffect stores every combatMove stage delta exposed by the Game Master.
type BuffEffect struct {
	AttackerAttack  int
	AttackerDefense int
	TargetAttack    int
	TargetDefense   int
	Chance          float64
}

func (effect BuffEffect) Empty() bool {
	return effect.AttackerAttack == 0 &&
		effect.AttackerDefense == 0 &&
		effect.TargetAttack == 0 &&
		effect.TargetDefense == 0
}

// Move is the simulation-facing projection of a catalog move.
type Move struct {
	ID         string
	Name       string
	Type       string
	Kind       MoveKind
	Power      int
	EnergyGain int
	EnergyCost int
	Turns      int
	Buff       BuffEffect
}

func (move Move) Validate() error {
	if strings.TrimSpace(move.ID) == "" {
		return errors.New("move ID is required")
	}
	if strings.TrimSpace(move.Type) == "" {
		return fmt.Errorf("move %s has no type", move.ID)
	}
	if move.Power < 0 {
		return fmt.Errorf("move %s has negative power", move.ID)
	}
	switch move.Kind {
	case FastMove:
		if move.Turns < 1 {
			return fmt.Errorf("fast move %s must take at least one turn", move.ID)
		}
		if move.EnergyGain < 0 || move.EnergyCost != 0 {
			return fmt.Errorf("fast move %s has invalid energy values", move.ID)
		}
	case ChargedMove:
		if move.EnergyCost < 1 || move.EnergyGain != 0 {
			return fmt.Errorf("charged move %s has invalid energy values", move.ID)
		}
	default:
		return fmt.Errorf("move %s has unknown kind %q", move.ID, move.Kind)
	}
	if move.Buff.Chance < 0 || move.Buff.Chance > 1 {
		return fmt.Errorf("move %s has invalid buff chance %.4f", move.ID, move.Buff.Chance)
	}
	for name, stage := range map[string]int{
		"attacker attack":  move.Buff.AttackerAttack,
		"attacker defense": move.Buff.AttackerDefense,
		"target attack":    move.Buff.TargetAttack,
		"target defense":   move.Buff.TargetDefense,
	} {
		if stage < -MaxStatStage || stage > MaxStatStage {
			return fmt.Errorf("move %s has invalid %s stage change %d", move.ID, name, stage)
		}
	}
	return nil
}

// Fighter is a fully initialized combatant. Attack and Defense are effective
// level/IV stats before shadow and in-battle stage multipliers.
type Fighter struct {
	ID           string
	Name         string
	Types        []string
	Attack       float64
	Defense      float64
	HP           int
	FastMove     Move
	ChargedMoves []Move
	Shadow       bool
}

func (fighter Fighter) Validate() error {
	if strings.TrimSpace(fighter.ID) == "" {
		return errors.New("fighter ID is required")
	}
	if len(fighter.Types) < 1 || len(fighter.Types) > 2 {
		return fmt.Errorf("fighter %s must have one or two types", fighter.ID)
	}
	if fighter.Attack <= 0 || fighter.Defense <= 0 || fighter.HP < 1 {
		return fmt.Errorf("fighter %s has invalid battle stats", fighter.ID)
	}
	if err := fighter.FastMove.Validate(); err != nil {
		return fmt.Errorf("fighter %s fast move: %w", fighter.ID, err)
	}
	if fighter.FastMove.Kind != FastMove {
		return fmt.Errorf("fighter %s fast move is not fast", fighter.ID)
	}
	if len(fighter.ChargedMoves) == 0 {
		return fmt.Errorf("fighter %s needs at least one charged move", fighter.ID)
	}
	for _, move := range fighter.ChargedMoves {
		if err := move.Validate(); err != nil {
			return fmt.Errorf("fighter %s charged move: %w", fighter.ID, err)
		}
		if move.Kind != ChargedMove {
			return fmt.Errorf("fighter %s charged pool contains a fast move", fighter.ID)
		}
	}
	return nil
}

type ActionKind string

const (
	ActionFast    ActionKind = "fast"
	ActionCharged ActionKind = "charged"
	ActionWait    ActionKind = "wait"
)

// Action is a policy decision for one available turn.
type Action struct {
	Kind        ActionKind
	ChargedMove int
}

func FastAction() Action {
	return Action{Kind: ActionFast}
}

func ChargedAction(index int) Action {
	return Action{Kind: ActionCharged, ChargedMove: index}
}

func WaitAction() Action {
	return Action{Kind: ActionWait}
}

// State is an immutable policy-facing view of one combatant.
type State struct {
	ID            string
	Types         []string
	Attack        float64
	Defense       float64
	Shadow        bool
	HP            int
	MaxHP         int
	Energy        int
	Shields       int
	AttackStage   int
	DefenseStage  int
	CooldownTurns int
	PendingFast   bool
	FastMove      Move
	ChargedMoves  []Move
}

// Policy chooses attacks and shields. A policy must be deterministic for
// ranking generation.
type Policy interface {
	ChooseAction(self State, opponent State) Action
	ShouldShield(attacker State, defender State, move Move, unshieldedDamage int) bool
}

type BattleConfig struct {
	Mechanics      Mechanics
	Shields        [2]int
	StartingEnergy [2]int
	MaxTurns       int
	Policies       [2]Policy
	RecordTimeline bool
}

func DefaultBattleConfig() BattleConfig {
	return BattleConfig{
		Mechanics: MechanicsPvPokeLegacy,
		Shields:   [2]int{1, 1},
		MaxTurns:  DefaultMaxTurn,
	}
}

type Event struct {
	Turn     int
	Actor    int
	Kind     ActionKind
	MoveID   string
	Damage   int
	Shielded bool
	Buffed   bool
}

type CombatantResult struct {
	HP           int
	MaxHP        int
	Energy       int
	Shields      int
	StartShields int
	AttackStage  int
	DefenseStage int
}

type BattleResult struct {
	Mechanics Mechanics
	Turns     int
	TimeMs    int
	Winner    int
	Fighters  [2]CombatantResult
	Timeline  []Event
}

func (result BattleResult) Rating(index int) int {
	if index < 0 || index > 1 {
		return 0
	}
	opponent := 1 - index
	self := result.Fighters[index]
	other := result.Fighters[opponent]
	healthRating := float64(self.HP) / float64(self.MaxHP)
	damageRating := float64(other.MaxHP-other.HP) / float64(other.MaxHP)
	return int((healthRating + damageRating) * 500)
}

// AdjustedRating reproduces the shield accounting used by PvPoke's category
// ranker. Shield value is only credited to the battle winner.
func (result BattleResult) AdjustedRating(index int) int {
	rating := result.Rating(index)
	opponentRating := result.Rating(1 - index)
	if rating <= opponentRating || rating == 500 {
		return rating
	}
	self := result.Fighters[index]
	opponent := result.Fighters[1-index]
	burned := opponent.StartShields - opponent.Shields
	return rating + (100 * burned) + (100 * self.Shields)
}
