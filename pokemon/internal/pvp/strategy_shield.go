package pvp

import "math"

// simulateModeShield mirrors the shield contract in PvPoke's simulated
// battles: shield by default, and use wouldShield only for early guaranteed
// self boosts/opponent defense drops or a defender preparing to self-debuff.
func simulateModeShield(
	attacker State,
	defender State,
	move Move,
	unshieldedDamage int,
) bool {
	if defender.Shields <= 0 {
		return false
	}

	useShield := true
	if moveSelfBuffing(move) &&
		(move.Buff.AttackerAttack > 0 || move.Buff.TargetDefense < 0) {
		useShield = wouldShield(attacker, defender, move, unshieldedDamage)
	}

	defenderCache := buildMovePlanCache(defender, attacker)
	if defenderCache.bestSlot >= 0 {
		best := defender.ChargedMoves[defenderCache.order[defenderCache.bestSlot]]
		if moveSelfDefenseDebuffing(best) {
			if attacker.Shields > 0 {
				useShield = wouldShield(attacker, defender, move, unshieldedDamage)
			} else if len(attacker.ChargedMoves) > 0 {
				attackerCache := buildMovePlanCache(attacker, defender)
				attackerFirst := attacker.ChargedMoves[attackerCache.order[0]]
				fastToNext := int(math.Ceil(
					float64(max(0, best.EnergyCost-defender.Energy)) /
						float64(max(1, defender.FastMove.EnergyGain)),
				))
				turnsToNext := fastToNext * defender.FastMove.Turns
				cycleDamage := fastToNext*
					decisionDamage(defender, attacker, defender.FastMove) +
					decisionDamage(defender, attacker, best)
				attackerTurns := int(math.Ceil(
					float64(max(0, attackerFirst.EnergyCost-attacker.Energy))/
						float64(max(1, attacker.FastMove.EnergyGain)),
				)) * attacker.FastMove.Turns
				if attacker.Attack > defender.Attack {
					attackerTurns--
				}
				if turnsToNext >= attackerTurns && attacker.HP <= cycleDamage {
					useShield = wouldShield(
						attacker,
						defender,
						move,
						unshieldedDamage,
					)
				}
			}
		}
	}
	return useShield
}

func wouldShield(
	attacker State,
	defender State,
	move Move,
	unshieldedDamage int,
) bool {
	postMoveHP := defender.HP - unshieldedDamage
	projectedAttacker := attacker
	projectedDefender := defender
	switch {
	case move.Buff.AttackerAttack > 0:
		projectedAttacker.AttackStage = clampStage(
			projectedAttacker.AttackStage + move.Buff.AttackerAttack,
		)
	case move.Buff.TargetAttack != 0 || move.Buff.TargetDefense != 0:
		projectedDefender.AttackStage = clampStage(
			projectedDefender.AttackStage + move.Buff.TargetAttack,
		)
		projectedDefender.DefenseStage = clampStage(
			projectedDefender.DefenseStage + move.Buff.TargetDefense,
		)
	default:
		// PvPoke applies the move's two-stage tuple to the defender in this
		// branch even for a self-targeted non-Attack effect.
		projectedDefender.AttackStage = clampStage(
			projectedDefender.AttackStage + move.Buff.AttackerAttack,
		)
		projectedDefender.DefenseStage = clampStage(
			projectedDefender.DefenseStage + move.Buff.AttackerDefense,
		)
	}

	fastDamage := decisionDamage(
		projectedAttacker,
		projectedDefender,
		projectedAttacker.FastMove,
	)
	fastAttacks := int(math.Ceil(
		float64(move.EnergyCost-max(attacker.Energy-move.EnergyCost, 0))/
			float64(max(1, attacker.FastMove.EnergyGain)),
	)) + 1
	cycleDamage := (fastAttacks*fastDamage + 1) * defender.Shields
	useShield := postMoveHP <= cycleDamage

	fastDPT := float64(fastDamage) / float64(max(1, attacker.FastMove.Turns))
	for _, charged := range attacker.ChargedMoves {
		damage := decisionDamage(attacker, defender, charged)
		if float64(damage) >= float64(defender.HP)/1.4 && fastDPT > 1.5 {
			useShield = true
		}
		if damage >= defender.HP-cycleDamage {
			useShield = true
		}
	}
	if moveSelfAttackDebuffing(move) &&
		float64(unshieldedDamage)/float64(defender.HP) > 0.55 {
		useShield = true
	}
	return useShield
}
