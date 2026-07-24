package api

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"math"
	"net/http"

	"pokemon_data/internal/pvp"
)

const (
	maxPvPRosterEvaluationRequestBytes = 1 << 20
	maxPvPRosterCandidates             = 200
	maxPvPRosterOpponents              = 16
)

type pvpRosterEvaluationOpponent struct {
	Fighter pvpBattleFighter `json:"fighter"`
	Weight  float64          `json:"weight"`
}

type pvpRosterEvaluationRequest struct {
	Mechanics  pvp.Mechanics                 `json:"mechanics"`
	Candidates []pvpBattleFighter            `json:"candidates"`
	Opponents  []pvpRosterEvaluationOpponent `json:"opponents"`
}

type pvpRosterEvaluationResult struct {
	FighterID      string     `json:"fighterId"`
	Score          float64    `json:"score"`
	CategoryScores [6]float64 `json:"categoryScores"`
}

type pvpRosterEvaluationResponse struct {
	Mechanics pvp.Mechanics               `json:"mechanics"`
	FieldSize int                         `json:"fieldSize"`
	Results   []pvpRosterEvaluationResult `json:"results"`
}

func newPvPRosterEvaluationHandler(log *slog.Logger) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, request *http.Request) {
		request.Body = http.MaxBytesReader(
			w,
			request.Body,
			maxPvPRosterEvaluationRequestBytes,
		)
		decoder := json.NewDecoder(request.Body)
		decoder.DisallowUnknownFields()

		var body pvpRosterEvaluationRequest
		if err := decoder.Decode(&body); err != nil {
			writePvPBattleError(w, http.StatusBadRequest, "invalid roster evaluation request")
			return
		}
		if err := ensureJSONBodyConsumed(decoder); err != nil {
			writePvPBattleError(w, http.StatusBadRequest, "invalid roster evaluation request")
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
		if len(body.Candidates) < 1 ||
			len(body.Candidates) > maxPvPRosterCandidates {
			writePvPBattleError(
				w,
				http.StatusUnprocessableEntity,
				fmt.Sprintf("candidates must contain between 1 and %d fighters", maxPvPRosterCandidates),
			)
			return
		}
		if len(body.Opponents) < 2 ||
			len(body.Opponents) > maxPvPRosterOpponents {
			writePvPBattleError(
				w,
				http.StatusUnprocessableEntity,
				fmt.Sprintf("opponents must contain between 2 and %d fighters", maxPvPRosterOpponents),
			)
			return
		}

		candidates := make([]pvp.Fighter, 0, len(body.Candidates))
		candidateIDs := make(map[string]struct{}, len(body.Candidates))
		for index, source := range body.Candidates {
			fighter, err := source.simulationFighter(
				fmt.Sprintf("candidate %d", index+1),
			)
			if err != nil {
				writePvPBattleError(w, http.StatusUnprocessableEntity, err.Error())
				return
			}
			if _, exists := candidateIDs[fighter.ID]; exists {
				writePvPBattleError(
					w,
					http.StatusUnprocessableEntity,
					"candidate fighter IDs must be unique",
				)
				return
			}
			candidateIDs[fighter.ID] = struct{}{}
			candidates = append(candidates, fighter)
		}

		opponents := make([]pvp.WeightedFighter, 0, len(body.Opponents))
		for index, source := range body.Opponents {
			fighter, err := source.Fighter.simulationFighter(
				fmt.Sprintf("opponent %d", index+1),
			)
			if err != nil {
				writePvPBattleError(w, http.StatusUnprocessableEntity, err.Error())
				return
			}
			if math.IsNaN(source.Weight) ||
				math.IsInf(source.Weight, 0) ||
				source.Weight <= 0 {
				writePvPBattleError(
					w,
					http.StatusUnprocessableEntity,
					fmt.Sprintf("opponent %d has invalid weight", index+1),
				)
				return
			}
			opponents = append(opponents, pvp.WeightedFighter{
				Fighter: fighter,
				Weight:  source.Weight,
			})
		}

		results, err := pvp.EvaluateRoster(candidates, opponents)
		if err != nil {
			if log != nil {
				log.Warn(
					"PvP roster evaluation rejected",
					slog.String("err", err.Error()),
				)
			}
			writePvPBattleError(w, http.StatusUnprocessableEntity, err.Error())
			return
		}

		response := pvpRosterEvaluationResponse{
			Mechanics: body.Mechanics,
			FieldSize: len(opponents),
			Results:   make([]pvpRosterEvaluationResult, 0, len(results)),
		}
		for _, result := range results {
			response.Results = append(response.Results, pvpRosterEvaluationResult{
				FighterID:      result.FighterID,
				Score:          result.Score,
				CategoryScores: result.CategoryScores,
			})
		}
		writePvPBattleJSON(w, response)
	})
}
