package api

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strings"

	"pokemon_data/internal/pvp"
)

const maxPvPBattleRequestBytes = 64 << 10

type pvpBattleMoveBuff struct {
	AttackerAttack  int     `json:"attackerAttack"`
	AttackerDefense int     `json:"attackerDefense"`
	TargetAttack    int     `json:"targetAttack"`
	TargetDefense   int     `json:"targetDefense"`
	Chance          float64 `json:"chance"`
}

type pvpBattleMove struct {
	ID         string            `json:"id"`
	Name       string            `json:"name"`
	Type       string            `json:"type"`
	Kind       string            `json:"kind"`
	Power      int               `json:"power"`
	EnergyGain int               `json:"energyGain"`
	EnergyCost int               `json:"energyCost"`
	Turns      int               `json:"turns"`
	Buff       pvpBattleMoveBuff `json:"buff"`
}

type pvpBattleFighter struct {
	ID           string          `json:"id"`
	Name         string          `json:"name"`
	Types        []string        `json:"types"`
	Attack       float64         `json:"attack"`
	Defense      float64         `json:"defense"`
	HP           int             `json:"hp"`
	Shadow       bool            `json:"shadow"`
	FastMove     pvpBattleMove   `json:"fastMove"`
	ChargedMoves []pvpBattleMove `json:"chargedMoves"`
}

type pvpBattleRequest struct {
	Mechanics      pvp.Mechanics       `json:"mechanics"`
	Fighters       [2]pvpBattleFighter `json:"fighters"`
	Shields        [2]int              `json:"shields"`
	StartingEnergy [2]int              `json:"startingEnergy"`
	RecordTimeline bool                `json:"recordTimeline"`
}

type pvpBattleCombatantResponse struct {
	HP           int `json:"hp"`
	MaxHP        int `json:"maxHp"`
	Energy       int `json:"energy"`
	Shields      int `json:"shields"`
	StartShields int `json:"startShields"`
	AttackStage  int `json:"attackStage"`
	DefenseStage int `json:"defenseStage"`
}

type pvpBattleEventResponse struct {
	Turn     int            `json:"turn"`
	Actor    int            `json:"actor"`
	Kind     pvp.ActionKind `json:"kind"`
	MoveID   string         `json:"moveId"`
	Damage   int            `json:"damage"`
	Shielded bool           `json:"shielded"`
	Buffed   bool           `json:"buffed"`
}

type pvpBattleResponse struct {
	Mechanics       pvp.Mechanics                 `json:"mechanics"`
	Winner          int                           `json:"winner"`
	Turns           int                           `json:"turns"`
	TimeMs          int                           `json:"timeMs"`
	Ratings         [2]int                        `json:"ratings"`
	AdjustedRatings [2]int                        `json:"adjustedRatings"`
	Fighters        [2]pvpBattleCombatantResponse `json:"fighters"`
	Timeline        []pvpBattleEventResponse      `json:"timeline"`
}

func newPvPBattleHandler(log *slog.Logger) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, request *http.Request) {
		request.Body = http.MaxBytesReader(w, request.Body, maxPvPBattleRequestBytes)
		decoder := json.NewDecoder(request.Body)
		decoder.DisallowUnknownFields()

		var body pvpBattleRequest
		if err := decoder.Decode(&body); err != nil {
			writePvPBattleError(w, http.StatusBadRequest, "invalid battle request")
			return
		}
		if err := ensureJSONBodyConsumed(decoder); err != nil {
			writePvPBattleError(w, http.StatusBadRequest, "invalid battle request")
			return
		}

		if body.Mechanics == "" {
			body.Mechanics = pvp.MechanicsPvPokeLegacy
		}
		if body.Mechanics != pvp.MechanicsPvPokeLegacy {
			writePvPBattleError(
				w,
				http.StatusUnprocessableEntity,
				"only the pinned pvpoke-legacy mechanics are currently supported",
			)
			return
		}
		fighters, err := body.simulationFighters()
		if err != nil {
			writePvPBattleError(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		for index := range body.Shields {
			if body.Shields[index] < 0 || body.Shields[index] > 2 {
				writePvPBattleError(w, http.StatusUnprocessableEntity, "shields must be between 0 and 2")
				return
			}
			if body.StartingEnergy[index] < 0 || body.StartingEnergy[index] > pvp.EnergyCap {
				writePvPBattleError(w, http.StatusUnprocessableEntity, "starting energy must be between 0 and 100")
				return
			}
		}

		result, err := pvp.Simulate(fighters, pvp.BattleConfig{
			Mechanics:      body.Mechanics,
			Shields:        body.Shields,
			StartingEnergy: body.StartingEnergy,
			RecordTimeline: body.RecordTimeline,
		})
		if err != nil {
			if log != nil {
				log.Warn("PvP battle simulation rejected", slog.String("err", err.Error()))
			}
			writePvPBattleError(w, http.StatusUnprocessableEntity, err.Error())
			return
		}

		writePvPBattleJSON(w, battleResponse(result))
	})
}

func ensureJSONBodyConsumed(decoder *json.Decoder) error {
	var extra any
	err := decoder.Decode(&extra)
	if errors.Is(err, io.EOF) {
		return nil
	}
	if err == nil {
		return errors.New("multiple JSON values")
	}
	return err
}

func (request pvpBattleRequest) simulationFighters() ([2]pvp.Fighter, error) {
	var fighters [2]pvp.Fighter
	for index, source := range request.Fighters {
		fighter, err := source.simulationFighter(fmt.Sprintf("fighter %d", index+1))
		if err != nil {
			return fighters, err
		}
		fighters[index] = fighter
	}
	return fighters, nil
}

func (source pvpBattleFighter) simulationFighter(label string) (pvp.Fighter, error) {
	if source.Attack > 1000 || source.Defense > 1000 || source.HP > 1000 {
		return pvp.Fighter{}, fmt.Errorf("%s stats exceed supported Trainer Battle limits", label)
	}
	fighter := pvp.Fighter{
		ID:       strings.TrimSpace(source.ID),
		Name:     strings.TrimSpace(source.Name),
		Types:    append([]string(nil), source.Types...),
		Attack:   source.Attack,
		Defense:  source.Defense,
		HP:       source.HP,
		Shadow:   source.Shadow,
		FastMove: source.FastMove.simulationMove(),
	}
	for _, move := range source.ChargedMoves {
		fighter.ChargedMoves = append(fighter.ChargedMoves, move.simulationMove())
	}
	if len(fighter.ChargedMoves) > 2 {
		return pvp.Fighter{}, fmt.Errorf("%s has more than two charged moves", label)
	}
	return fighter, nil
}

func (move pvpBattleMove) simulationMove() pvp.Move {
	kind := pvp.MoveKind(move.Kind)
	return pvp.Move{
		ID:         strings.TrimSpace(move.ID),
		Name:       strings.TrimSpace(move.Name),
		Type:       strings.ToLower(strings.TrimSpace(move.Type)),
		Kind:       kind,
		Power:      move.Power,
		EnergyGain: move.EnergyGain,
		EnergyCost: move.EnergyCost,
		Turns:      move.Turns,
		Buff: pvp.BuffEffect{
			AttackerAttack:  move.Buff.AttackerAttack,
			AttackerDefense: move.Buff.AttackerDefense,
			TargetAttack:    move.Buff.TargetAttack,
			TargetDefense:   move.Buff.TargetDefense,
			Chance:          move.Buff.Chance,
		},
	}
}

func battleResponse(result pvp.BattleResult) pvpBattleResponse {
	response := pvpBattleResponse{
		Mechanics:       result.Mechanics,
		Winner:          result.Winner,
		Turns:           result.Turns,
		TimeMs:          result.TimeMs,
		Ratings:         [2]int{result.Rating(0), result.Rating(1)},
		AdjustedRatings: [2]int{result.AdjustedRating(0), result.AdjustedRating(1)},
		Timeline:        make([]pvpBattleEventResponse, 0, len(result.Timeline)),
	}
	for index, fighter := range result.Fighters {
		response.Fighters[index] = pvpBattleCombatantResponse{
			HP:           fighter.HP,
			MaxHP:        fighter.MaxHP,
			Energy:       fighter.Energy,
			Shields:      fighter.Shields,
			StartShields: fighter.StartShields,
			AttackStage:  fighter.AttackStage,
			DefenseStage: fighter.DefenseStage,
		}
	}
	for _, event := range result.Timeline {
		response.Timeline = append(response.Timeline, pvpBattleEventResponse{
			Turn:     event.Turn,
			Actor:    event.Actor,
			Kind:     event.Kind,
			MoveID:   event.MoveID,
			Damage:   event.Damage,
			Shielded: event.Shielded,
			Buffed:   event.Buffed,
		})
	}
	return response
}

func writePvPBattleError(w http.ResponseWriter, status int, message string) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": message})
}

func writePvPBattleJSON(w http.ResponseWriter, value any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(value)
}
