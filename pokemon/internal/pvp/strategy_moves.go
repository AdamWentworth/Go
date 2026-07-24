package pvp

import (
	"math"
	"sort"
)

type movePlanCache struct {
	selfID          string
	opponentID      string
	order           []int
	dpe             []float64
	bestSlot        int
	farmSlot        int
	minCycle        float64
	selfDebuffing   []bool
	selfBuffing     []bool
	debuffDelta     []int
	attackBuffDelta []int
}

type movePlan struct {
	cache         *movePlanCache
	moves         []Move
	damage        []int
	fastDamage    int
	bestCycle     int
	damageByStage [9][]int
	fastByStage   [9]int
}

func (policy *PvPokePolicy) movePlan(self State, opponent State) movePlan {
	if policy.cache == nil ||
		policy.cache.selfID != self.ID ||
		policy.cache.opponentID != opponent.ID {
		policy.cache = buildMovePlanCache(self, opponent)
	}

	cache := policy.cache
	moves := make([]Move, len(cache.order))
	damage := make([]int, len(cache.order))
	for slot, original := range cache.order {
		moves[slot] = self.ChargedMoves[original]
		damage[slot] = decisionDamage(self, opponent, moves[slot])
	}
	fastDamage := decisionDamage(self, opponent, self.FastMove)

	plan := movePlan{
		cache:      cache,
		moves:      moves,
		damage:     damage,
		fastDamage: fastDamage,
	}
	if len(moves) > 0 && self.FastMove.EnergyGain > 0 {
		fastCount := int(math.Ceil(
			float64(moves[cache.bestSlot].EnergyCost) /
				float64(self.FastMove.EnergyGain),
		))
		plan.bestCycle = damage[cache.bestSlot] + fastCount*fastDamage
	}

	hasAttackStageMove := false
	for _, delta := range cache.attackBuffDelta {
		if delta != 0 {
			hasAttackStageMove = true
			break
		}
	}
	for offset := range plan.damageByStage {
		stage := offset - MaxStatStage
		if !hasAttackStageMove || stage == self.AttackStage {
			plan.damageByStage[offset] = damage
			plan.fastByStage[offset] = fastDamage
			continue
		}
		staged := self
		staged.AttackStage = stage
		row := make([]int, len(moves))
		for slot, move := range moves {
			row[slot] = decisionDamage(staged, opponent, move)
		}
		plan.damageByStage[offset] = row
		plan.fastByStage[offset] = decisionDamage(staged, opponent, self.FastMove)
	}
	return plan
}

func buildMovePlanCache(self State, opponent State) *movePlanCache {
	order := make([]int, len(self.ChargedMoves))
	for index := range order {
		order[index] = index
	}
	sort.SliceStable(order, func(i, j int) bool {
		return self.ChargedMoves[order[i]].EnergyCost <
			self.ChargedMoves[order[j]].EnergyCost
	})

	initialDamage := make([]int, len(self.ChargedMoves))
	for index, move := range self.ChargedMoves {
		initial := self
		initial.AttackStage = 0
		target := opponent
		target.DefenseStage = 0
		initialDamage[index] = decisionDamage(initial, target, move)
	}
	if len(order) > 1 {
		priorityShuffle(self.ChargedMoves, order, initialDamage)
	}

	cache := &movePlanCache{
		selfID:          self.ID,
		opponentID:      opponent.ID,
		order:           order,
		dpe:             make([]float64, len(order)),
		selfDebuffing:   make([]bool, len(order)),
		selfBuffing:     make([]bool, len(order)),
		debuffDelta:     make([]int, len(order)),
		attackBuffDelta: make([]int, len(order)),
		minCycle:        2,
	}
	for slot, original := range order {
		move := self.ChargedMoves[original]
		cache.dpe[slot] = float64(initialDamage[original]) / float64(move.EnergyCost)
		cache.selfDebuffing[slot] = moveSelfDebuffing(move)
		cache.selfBuffing[slot] = moveSelfBuffing(move)
		cache.debuffDelta[slot] = moveDebuffCountDelta(move)
		cache.attackBuffDelta[slot] = guaranteedAttackDelta(move)
	}

	cache.bestSlot = selectBestChargedMove(self.ChargedMoves, cache)
	cache.farmSlot = cache.bestSlot
	if len(order) > 1 &&
		cache.selfDebuffing[cache.bestSlot] &&
		self.ChargedMoves[order[cache.bestSlot]].EnergyCost >
			self.ChargedMoves[order[0]].EnergyCost &&
		cache.dpe[0] > 0 &&
		cache.dpe[cache.bestSlot]/cache.dpe[0] < 2 {
		cache.minCycle = 1.1
	}
	if cache.selfDebuffing[cache.farmSlot] {
		for slot := range order {
			if !cache.selfDebuffing[slot] &&
				cache.dpe[slot] > 0 &&
				cache.dpe[cache.farmSlot]/cache.dpe[slot] < 2 {
				cache.farmSlot = slot
			}
		}
	}
	return cache
}

func priorityShuffle(moves []Move, order []int, damage []int) {
	if len(order) < 2 {
		return
	}
	first := func() Move { return moves[order[0]] }
	second := func() Move { return moves[order[1]] }
	swap := func() { order[0], order[1] = order[1], order[0] }

	if second().EnergyCost == first().EnergyCost && !moveSelfDebuffing(second()) {
		if !second().Buff.Empty() || damage[order[1]] > damage[order[0]] {
			swap()
		}
	}
	if second().EnergyCost == first().EnergyCost &&
		!first().Buff.Empty() &&
		!second().Buff.Empty() &&
		!moveSelfDebuffing(second()) &&
		second().Buff.Chance > first().Buff.Chance {
		swap()
	}
	if first().ID == "FOCUS_BLAST" && second().ID == "ZAP_CANNON" {
		if buffAdjustedDPE(second(), damage[order[1]])-
			buffAdjustedDPE(first(), damage[order[0]]) > -0.3 {
			// PvPoke marks Focus Blast as a synthetic self-debuff here.
			moves[order[0]].Buff = BuffEffect{
				AttackerDefense: -1,
				Chance:          1,
			}
		}
	}
	if second().EnergyCost-first().EnergyCost <= 10 &&
		!moveSelfDebuffing(second()) &&
		moveSelfBuffing(second()) &&
		buffAdjustedDPE(first(), damage[order[0]])-
			buffAdjustedDPE(second(), damage[order[1]]) < 0.3 {
		swap()
	}
	if second().EnergyCost-first().EnergyCost <= 10 &&
		moveSelfAttackDebuffing(first()) &&
		!moveSelfDebuffing(second()) {
		swap()
	}
	if second().EnergyCost-first().EnergyCost <= 10 &&
		moveSelfDebuffing(first()) &&
		first().EnergyCost > 50 &&
		!moveSelfDebuffing(second()) {
		swap()
	}
	if second().EnergyCost-first().EnergyCost <= 5 && moveSelfBuffing(second()) {
		swap()
	}
}

func selectBestChargedMove(moves []Move, cache *movePlanCache) int {
	if len(cache.order) == 0 {
		return -1
	}
	best := 0
	for slot, original := range cache.order {
		move := moves[original]
		difference := cache.dpe[slot] - cache.dpe[best]
		if (difference > 0.03 && move.ID != "SUPER_POWER") || difference > 0.3 {
			if !cache.selfBuffing[best] || difference > 0.3 {
				best = slot
			}
		}
		if math.Abs(cache.dpe[slot]-cache.dpe[best]) < 0.03 &&
			!moves[cache.order[best]].Buff.Empty() &&
			!move.Buff.Empty() &&
			move.Buff.Chance > moves[cache.order[best]].Buff.Chance &&
			!cache.selfDebuffing[slot] {
			best = slot
		}
		if move.ID == "OBSTRUCT" {
			best = slot
		}
	}
	first := moves[cache.order[0]]
	if first.ID == "OBSTRUCT" &&
		first.EnergyCost-moves[cache.order[best]].EnergyCost <= 5 &&
		cache.dpe[best] > 0 &&
		cache.dpe[0]/cache.dpe[best] > 0.2 {
		best = 0
	}
	return best
}

func buffAdjustedDPE(move Move, damage int) float64 {
	value := float64(damage) / float64(move.EnergyCost)
	if move.Buff.Chance <= 0 {
		return value
	}
	effect := 0.0
	switch {
	case move.Buff.AttackerAttack > 0:
		effect = float64(move.Buff.AttackerAttack) * (80 / float64(move.EnergyCost))
	case move.Buff.TargetDefense < 0:
		effect = float64(-move.Buff.TargetDefense) * (80 / float64(move.EnergyCost))
	}
	if effect > 0 {
		value *= (4 + effect*move.Buff.Chance) / 4
	}
	return value
}

func moveSelfDebuffing(move Move) bool {
	if move.ID == "DRAGON_ASCENT" || move.Buff.Chance < 0.5 {
		return false
	}
	return move.Buff.AttackerAttack < 0 || move.Buff.AttackerDefense < 0
}

func moveSelfAttackDebuffing(move Move) bool {
	return move.Buff.Chance >= 0.5 && move.Buff.AttackerAttack < 0
}

func moveSelfDefenseDebuffing(move Move) bool {
	return move.Buff.Chance >= 0.5 && move.Buff.AttackerDefense < 0
}

func moveSelfBuffing(move Move) bool {
	if move.Buff.Chance != 1 {
		return false
	}
	return move.Buff.AttackerAttack > 0 ||
		move.Buff.AttackerDefense > 0 ||
		move.Buff.TargetAttack < 0 ||
		move.Buff.TargetDefense < 0
}

func moveDebuffCountDelta(move Move) int {
	delta := 0
	if moveSelfDebuffing(move) {
		delta++
	}
	if move.Buff.Chance == 1 &&
		(move.Buff.AttackerAttack+move.Buff.AttackerDefense) > 0 {
		delta--
	}
	return delta
}

func guaranteedAttackDelta(move Move) int {
	if move.Buff.Chance != 1 {
		return 0
	}
	return clampStage(move.Buff.AttackerAttack - move.Buff.TargetDefense)
}
