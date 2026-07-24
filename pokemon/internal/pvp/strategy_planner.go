package pvp

import (
	"math"
	"sort"
)

const noChargedMove = -1

func (policy *PvPokePolicy) chooseChargedMove(self State, opponent State) int {
	plan := policy.movePlan(self, opponent)
	if len(plan.moves) == 0 {
		return noChargedMove
	}

	fastestCost := plan.moves[0].EnergyCost
	for _, move := range plan.moves[1:] {
		fastestCost = min(fastestCost, move.EnergyCost)
	}
	if self.Energy < fastestCost {
		return noChargedMove
	}

	turnsToLive := calculateTurnsToLive(self, opponent)
	opponentFastDamage := decisionDamage(opponent, self, opponent.FastMove)
	if self.HP <= opponentFastDamage*2 && opponent.FastMove.Turns == 1 {
		turnsToLive--
	}
	if self.HP <= opponentFastDamage &&
		opponent.PendingFast &&
		opponent.FastMove.Turns > 1 {
		turnsToLive = float64(opponent.CooldownTurns)
		if opponent.HP > plan.fastDamage {
			turnsToLive--
		}
	}
	if self.HP <= opponentFastDamage &&
		!opponent.PendingFast &&
		opponent.FastMove.Turns <= self.FastMove.Turns+1 &&
		opponent.HP > plan.fastDamage {
		turnsToLive--
	}

	winsCMP := self.Attack >= opponent.Attack
	fireNow := turnsToLive < float64(self.FastMove.Turns) ||
		(turnsToLive == float64(self.FastMove.Turns) && !winsCMP) ||
		(turnsToLive == float64(self.FastMove.Turns) &&
			self.HP <= opponentFastDamage)
	if fireNow {
		bestSlot := -1
		bestDamage := -1
		for slot := len(plan.moves) - 1; slot >= 0; slot-- {
			move := plan.moves[slot]
			if self.Energy < move.EnergyCost {
				continue
			}
			damage := plan.damage[slot]
			if damage > bestDamage {
				bestSlot = slot
				bestDamage = damage
			}
			if self.Energy >= move.EnergyCost*2 &&
				self.Attack > opponent.Attack &&
				damage*2 > bestDamage {
				bestSlot = slot
				bestDamage = damage * 2
			}
		}
		if bestSlot < 0 {
			return noChargedMove
		}
		return plan.cache.order[bestSlot]
	}

	// Before considering move timing, PvPoke immediately throws an eligible
	// non-debuffing lethal attack when shields are down.
	if opponent.Shields == 0 {
		eligibleSlots := min(1, len(plan.moves))
		for slot := 0; slot < eligibleSlots; slot++ {
			move := plan.moves[slot]
			if self.Energy >= move.EnergyCost &&
				plan.damage[slot] >= opponent.HP &&
				!plan.cache.selfDebuffing[slot] &&
				opponent.HP > plan.fastDamage {
				return plan.cache.order[slot]
			}
		}
	}

	if optimizeMoveTiming(self, opponent, plan, turnsToLive) {
		return noChargedMove
	}

	if plan.bestCycle > 0 &&
		float64(opponent.HP) >
			plan.cache.minCycle*float64(plan.bestCycle) {
		selected := plan.cache.farmSlot
		if len(plan.moves) > 1 &&
			opponent.Shields > 0 &&
			!plan.cache.selfDebuffing[0] &&
			wouldShield(self, opponent, plan.moves[1], plan.damage[1]) {
			selected = 0
		}
		move := plan.moves[selected]
		if self.Energy < move.EnergyCost {
			return noChargedMove
		}
		if plan.cache.selfDebuffing[selected] {
			reachable := self.Energy +
				((EnergyCap-self.Energy)/max(1, self.FastMove.EnergyGain))*
					self.FastMove.EnergyGain
			if self.Energy < reachable {
				return noChargedMove
			}
		}
		return plan.cache.order[selected]
	}

	return policy.nearKOPlan(self, opponent, plan)
}

type survivalState struct {
	hp      int
	energy  int
	turn    int
	shields int
}

func calculateTurnsToLive(self State, opponent State) float64 {
	opponentFastDamage := decisionDamage(opponent, self, opponent.FastMove)
	initial := survivalState{
		hp:      self.HP,
		energy:  opponent.Energy,
		shields: self.Shields,
	}
	if opponent.PendingFast {
		initial.hp -= opponentFastDamage
		initial.energy += opponent.FastMove.EnergyGain
		initial.turn = opponent.CooldownTurns
	}

	fastestCost := math.MaxInt
	for _, move := range opponent.ChargedMoves {
		fastestCost = min(fastestCost, move.EnergyCost)
	}
	turnsToLive := math.Inf(1)
	stack := []survivalState{initial}
	for len(stack) > 0 {
		current := stack[len(stack)-1]
		stack = stack[:len(stack)-1]

		if current.hp > opponentFastDamage {
			if self.Attack >= opponent.Attack {
				if current.turn > self.FastMove.Turns {
					continue
				}
			} else if current.turn > self.FastMove.Turns+1 {
				continue
			}
		}

		if current.shields > 0 {
			if fastestCost != math.MaxInt && current.energy >= fastestCost {
				stack = append(stack, survivalState{
					hp:      current.hp - 1,
					energy:  current.energy - fastestCost,
					turn:    current.turn + 1,
					shields: current.shields - 1,
				})
			}
		} else {
			for _, move := range opponent.ChargedMoves {
				if current.energy < move.EnergyCost {
					continue
				}
				damage := decisionDamage(opponent, self, move)
				if damage >= current.hp {
					turnsToLive = math.Min(turnsToLive, float64(current.turn))
					if self.Attack > opponent.Attack &&
						opponent.FastMove.Turns%self.FastMove.Turns == 0 {
						turnsToLive++
					}
					break
				}
				stack = append(stack, survivalState{
					hp:      current.hp - damage,
					energy:  current.energy - move.EnergyCost,
					turn:    current.turn + 1,
					shields: current.shields,
				})
			}
		}

		if current.hp-opponentFastDamage <= 0 {
			turnsToLive = math.Min(
				turnsToLive,
				float64(current.turn+opponent.FastMove.Turns),
			)
			break
		}
		stack = append(stack, survivalState{
			hp:      current.hp - opponentFastDamage,
			energy:  current.energy + opponent.FastMove.EnergyGain,
			turn:    current.turn + opponent.FastMove.Turns,
			shields: current.shields,
		})
	}
	return turnsToLive
}

func optimizeMoveTiming(
	self State,
	opponent State,
	plan movePlan,
	turnsToLive float64,
) bool {
	targetCooldown := 1
	if self.FastMove.Turns >= 4 ||
		(self.FastMove.Turns >= 3 && opponent.FastMove.Turns == 5) ||
		(self.FastMove.Turns == 2 && opponent.FastMove.Turns == 4) {
		targetCooldown = 2
	}
	if self.FastMove.Turns == opponent.FastMove.Turns {
		return false
	}
	if self.FastMove.Turns > opponent.FastMove.Turns &&
		self.FastMove.Turns%opponent.FastMove.Turns == 0 {
		return false
	}
	if opponent.CooldownTurns != 0 &&
		opponent.CooldownTurns <= targetCooldown {
		return false
	}

	opponentFastDamage := decisionDamage(opponent, self, opponent.FastMove)
	if self.HP <= opponentFastDamage {
		return false
	}
	queuedFastMoves := 1
	if self.PendingFast {
		queuedFastMoves++
	}
	if self.Energy+self.FastMove.EnergyGain*queuedFastMoves > EnergyCap {
		return false
	}
	turnsPlanned := self.FastMove.Turns +
		self.Energy/max(1, plan.moves[0].EnergyCost)
	if self.Attack < opponent.Attack {
		turnsPlanned++
	}
	if float64(turnsPlanned) > turnsToLive {
		return false
	}
	if opponent.Shields == 0 {
		for slot, move := range plan.moves {
			if self.Energy >= move.EnergyCost &&
				plan.damage[slot] >= opponent.HP {
				return false
			}
		}
	}

	fastMovesInWindow := self.FastMove.Turns / opponent.FastMove.Turns
	for _, move := range opponent.ChargedMoves {
		fastMovesNeeded := int(math.Ceil(
			float64(max(0, move.EnergyCost-opponent.Energy)) /
				float64(max(1, opponent.FastMove.EnergyGain)),
		))
		turnsFromMove := fastMovesNeeded*opponent.FastMove.Turns + 1
		damage := decisionDamage(opponent, self, move) +
			opponentFastDamage*fastMovesInWindow
		if self.Shields > 0 {
			damage = 1 + opponentFastDamage*fastMovesInWindow
		}
		if turnsFromMove <= self.FastMove.Turns && damage >= self.HP {
			return false
		}
	}
	fastMovesInWindow = (self.FastMove.Turns + 1) / opponent.FastMove.Turns
	return self.HP > opponentFastDamage*fastMovesInWindow
}

type knockoutState struct {
	energy      int
	hp          int
	turn        int
	shields     int
	firstSlot   int
	maxSlot     int
	hasDebuff   bool
	debuffCount int
	attackStage int
}

func (policy *PvPokePolicy) nearKOPlan(
	self State,
	opponent State,
	plan movePlan,
) int {
	queue := []knockoutState{{
		energy: self.Energy, hp: opponent.HP, shields: opponent.Shields,
		firstSlot: -1, maxSlot: -1, attackStage: self.AttackStage,
	}}
	var final *knockoutState
	for iterations := 0; len(queue) > 0 && iterations < 500; iterations++ {
		current := queue[0]
		queue = queue[1:]
		if current.hp <= 0 {
			copy := current
			final = &copy
			break
		}

		stageOffset := clampStage(current.attackStage) + MaxStatStage
		row := plan.damageByStage[stageOffset]
		fastDamage := plan.fastByStage[stageOffset]
		for slot, move := range plan.moves {
			firstSlot := current.firstSlot
			if firstSlot < 0 {
				firstSlot = slot
			}
			maxSlot := current.maxSlot
			if maxSlot < 0 || plan.damage[slot] > plan.damage[maxSlot] {
				maxSlot = slot
			}
			next := knockoutState{
				firstSlot:   firstSlot,
				maxSlot:     maxSlot,
				hasDebuff:   current.hasDebuff || plan.cache.selfDebuffing[slot],
				debuffCount: current.debuffCount + plan.cache.debuffDelta[slot],
				attackStage: clampStage(
					current.attackStage + plan.cache.attackBuffDelta[slot],
				),
			}
			if current.energy >= move.EnergyCost {
				next.energy = current.energy - move.EnergyCost
				next.hp = current.hp - row[slot]
				next.turn = current.turn + 1
				next.shields = current.shields
				if next.shields > 0 {
					next.hp = current.hp - 1
					next.shields--
				}
				insertReadyState(&queue, next)
			} else {
				fastMoves := int(math.Ceil(
					float64(move.EnergyCost-current.energy) /
						float64(max(1, self.FastMove.EnergyGain)),
				))
				next.energy = current.energy +
					fastMoves*self.FastMove.EnergyGain -
					move.EnergyCost
				next.hp = current.hp - fastMoves*fastDamage - row[slot]
				next.turn = current.turn +
					fastMoves*self.FastMove.Turns + 1
				next.shields = current.shields
				if next.shields > 0 {
					next.hp = current.hp - fastMoves*fastDamage - 1
					next.shields--
				}
				insertNotReadyState(&queue, next)
			}

			// PvPoke adds a separate route for attack-debuffing moves that can
			// be fired twice from the energy cap. This lets the planner bank
			// energy before accepting the debuff instead of prematurely
			// switching to a lower-damage non-debuffing move.
			if plan.cache.selfDebuffing[slot] &&
				move.Buff.AttackerAttack < 0 &&
				move.EnergyCost*2 <= EnergyCap {
				stackFastMoves := int(math.Ceil(
					float64(move.EnergyCost*2-current.energy) /
						float64(max(1, self.FastMove.EnergyGain)),
				))
				stackTurns := stackFastMoves * self.FastMove.Turns
				if stackTurns != 0 {
					stacked := knockoutState{
						energy: current.energy +
							stackFastMoves*self.FastMove.EnergyGain -
							move.EnergyCost,
						hp: current.hp -
							stackFastMoves*fastDamage,
						turn:      current.turn + stackTurns + 1,
						shields:   current.shields,
						firstSlot: firstSlot,
						maxSlot:   maxSlot,
						hasDebuff: true,
						debuffCount: current.debuffCount +
							plan.cache.debuffDelta[slot],
						attackStage: clampStage(
							current.attackStage +
								plan.cache.attackBuffDelta[slot],
						),
					}
					if stacked.shields > 0 {
						stacked.hp--
						stacked.shields--
					} else {
						stacked.hp -= row[slot]
					}
					if current.energy >= move.EnergyCost {
						insertFarmState(&queue, stacked)
					} else {
						insertNotReadyState(&queue, stacked)
					}
				}
			}
		}
		if fastDamage > 0 {
			fastMoves := int(math.Ceil(float64(current.hp) / float64(fastDamage)))
			farm := current
			farm.energy += fastMoves * self.FastMove.EnergyGain
			farm.hp = 0
			farm.turn += fastMoves * self.FastMove.Turns
			insertFarmState(&queue, farm)
		}
	}

	if final == nil {
		best := -1
		for slot, move := range plan.moves {
			if self.Energy < move.EnergyCost {
				continue
			}
			if best < 0 || plan.cache.dpe[slot] > plan.cache.dpe[best] {
				best = slot
			}
		}
		if best < 0 {
			return noChargedMove
		}
		return plan.cache.order[best]
	}

	if final.firstSlot < 0 {
		boostSlot := -1
		for original, move := range self.ChargedMoves {
			if !move.Buff.Empty() &&
				move.Buff.Chance >= 0.5 &&
				!moveSelfDebuffing(move) {
				for slot, mapped := range plan.cache.order {
					if mapped == original {
						boostSlot = slot
						break
					}
				}
			}
		}
		if boostSlot < 0 {
			return noChargedMove
		}
		final.firstSlot = boostSlot
		final.maxSlot = boostSlot
	}

	first := final.firstSlot
	if opponent.Shields > 0 && len(plan.moves) > 1 &&
		self.Energy < plan.moves[1].EnergyCost &&
		plan.cache.dpe[1] > plan.cache.dpe[first] {
		bait := true
		if plan.cache.dpe[0] > 0 &&
			plan.cache.dpe[1]/plan.cache.dpe[0] <= 1.5 &&
			plan.cache.selfBuffing[0] {
			bait = false
		}
		if bait {
			return noChargedMove
		}
	}

	if opponent.Shields == 0 && !final.hasDebuff {
		first = final.maxSlot
	}
	if opponent.Shields > 0 && len(plan.moves) > 1 {
		baseDPE := float64(plan.damage[final.firstSlot]) /
			float64(plan.moves[final.firstSlot].EnergyCost)
		candidateDPE := float64(plan.damage[1]) /
			float64(plan.moves[1].EnergyCost)
		if baseDPE > 0 &&
			self.Energy >= plan.moves[1].EnergyCost &&
			candidateDPE/baseDPE > 1.5 &&
			!wouldShield(self, opponent, plan.moves[1], plan.damage[1]) {
			first = 1
		}
	}

	first = applyPostPlanRules(
		self,
		opponent,
		plan,
		final,
		first,
		!policy.NoBait,
	)
	if first < 0 || self.Energy < plan.moves[first].EnergyCost {
		return noChargedMove
	}
	return plan.cache.order[first]
}

func insertFarmState(queue *[]knockoutState, state knockoutState) {
	index := sort.Search(len(*queue), func(index int) bool {
		return (*queue)[index].turn > state.turn
	})
	*queue = append(*queue, knockoutState{})
	copy((*queue)[index+1:], (*queue)[index:])
	(*queue)[index] = state
}

func insertReadyState(queue *[]knockoutState, state knockoutState) {
	for index := 0; index < len(*queue) && (*queue)[index].turn == state.turn; {
		existing := (*queue)[index]
		if existing.hp == state.hp && existing.attackStage == state.attackStage {
			if existing.energy != state.energy {
				return
			}
			if existing.debuffCount > state.debuffCount {
				*queue = append((*queue)[:index], (*queue)[index+1:]...)
				continue
			}
			return
		}
		index++
	}
	insertFarmState(queue, state)
}

func insertNotReadyState(queue *[]knockoutState, state knockoutState) {
	index := sort.Search(len(*queue), func(index int) bool {
		return (*queue)[index].turn >= state.turn
	})
	*queue = append(*queue, knockoutState{})
	copy((*queue)[index+1:], (*queue)[index:])
	(*queue)[index] = state
}

func applyPostPlanRules(
	self State,
	opponent State,
	plan movePlan,
	final *knockoutState,
	first int,
	baitShields bool,
) int {
	if first < 0 {
		return first
	}
	if opponent.Shields > 0 && len(plan.moves) > 1 &&
		plan.moves[0].EnergyCost <= plan.moves[first].EnergyCost &&
		plan.cache.dpe[0] > plan.cache.dpe[first] &&
		!plan.cache.selfDebuffing[0] {
		first = 0
	}
	if len(plan.moves) > 1 &&
		plan.moves[0].EnergyCost == plan.moves[first].EnergyCost &&
		plan.cache.dpe[0] > plan.cache.dpe[first] &&
		!plan.cache.selfDebuffing[0] {
		first = 0
	}
	if len(plan.moves) > 1 &&
		plan.moves[0].EnergyCost-10 <= plan.moves[first].EnergyCost &&
		plan.cache.dpe[0] > plan.cache.dpe[first] &&
		plan.cache.selfDebuffing[first] &&
		!plan.cache.selfDebuffing[0] {
		first = 0
	}
	if len(plan.moves) > 1 &&
		plan.moves[0].EnergyCost-plan.moves[first].EnergyCost <= 5 &&
		plan.cache.dpe[0] > plan.cache.dpe[first] &&
		plan.cache.selfBuffing[0] {
		first = 0
	}
	if opponent.Shields > 0 && len(plan.moves) > 1 &&
		self.Energy >= plan.moves[1].EnergyCost &&
		plan.cache.dpe[1] > plan.cache.dpe[first] &&
		plan.cache.selfDebuffing[first] &&
		!plan.cache.selfDebuffing[1] {
		first = 1
	}
	if opponent.Shields > 0 && len(plan.moves) > 1 &&
		plan.cache.selfDebuffing[0] &&
		!plan.cache.selfBuffing[1] &&
		(baitShields || opponent.HP-plan.damage[0] > 10) &&
		plan.moves[1].EnergyCost-plan.moves[0].EnergyCost <= 10 &&
		plan.cache.dpe[0] > 0 &&
		plan.cache.dpe[1]/plan.cache.dpe[0] > 0.7 {
		first = 1
	}

	if plan.cache.selfDebuffing[first] &&
		self.Shields == 0 &&
		self.Energy < EnergyCap &&
		len(opponent.ChargedMoves) > 0 {
		opponentCache := buildMovePlanCache(opponent, self)
		best := opponentCache.bestSlot
		bestMove := opponent.ChargedMoves[opponentCache.order[best]]
		if opponent.Energy >= bestMove.EnergyCost &&
			!wouldShield(
				opponent,
				self,
				bestMove,
				decisionDamage(opponent, self, bestMove),
			) &&
			!plan.cache.selfBuffing[0] {
			return noChargedMove
		}
	}

	if plan.cache.selfDebuffing[first] {
		targetEnergy := (EnergyCap / plan.moves[first].EnergyCost) *
			plan.moves[first].EnergyCost
		opponentFastDamage := decisionDamage(opponent, self, opponent.FastMove)
		if self.Energy < targetEnergy {
			if (opponent.HP > plan.damage[first] || opponent.Shields > 0) &&
				(self.HP > opponentFastDamage*2 ||
					opponent.FastMove.Turns-self.FastMove.Turns > 1) {
				return noChargedMove
			}
		} else if opponent.Shields > 0 &&
			len(plan.moves) > 1 &&
			plan.moves[0].EnergyCost-plan.moves[first].EnergyCost <= 10 &&
			!plan.cache.selfDebuffing[0] &&
			(plan.cache.selfBuffing[0] ||
				wouldShield(self, opponent, plan.moves[first], plan.damage[first])) {
			first = 0
		}
	}
	_ = final
	return first
}
