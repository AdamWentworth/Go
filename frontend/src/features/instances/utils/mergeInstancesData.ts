// src/features/instances/utils/mergeInstancesData.ts
import type { Instances } from '@/types/instances';
import { createScopedLogger, loggerInternals } from '@/utils/logger';

const log = createScopedLogger('mergeInstancesData');

export const mergeInstancesData = (
  oldData: Instances,
  newData: Instances,
  username: string,
): Instances => {
  type InstanceRow = Instances[string];
  type BaselineRow = { id: string; entry: InstanceRow };

  const mergedData: Instances = {};
  const seenByVariant: Record<string, true> = {};

  const isSignificant = (entry: InstanceRow | undefined) =>
    !!(entry?.is_caught || entry?.is_for_trade || entry?.is_wanted);
  const isBaseline = (entry: InstanceRow | undefined) =>
    !entry?.is_caught && !entry?.is_for_trade && !entry?.is_wanted;

  // Filter by username without mutating inputs.
  const oldFiltered: Instances = {};
  const newFiltered: Instances = {};
  for (const [id, entry] of Object.entries(oldData)) {
    if (!entry) continue;
    if (entry.username && entry.username !== username) continue;
    oldFiltered[id] = entry;
  }
  for (const [id, entry] of Object.entries(newData)) {
    if (!entry) continue;
    if (entry.username && entry.username !== username) continue;
    newFiltered[id] = entry;
  }

  log.debug('Starting merge', {
    oldCount: Object.keys(oldFiltered).length,
    newCount: Object.keys(newFiltered).length,
  });

  // 1) Seed with OLD: keep first per variant; extra OLD only if significant.
  for (const id of Object.keys(oldFiltered)) {
    const row = oldFiltered[id];
    const variant = row?.variant_id ?? '__unknown__';

    if (!seenByVariant[variant]) {
      mergedData[id] = row;
      seenByVariant[variant] = true;
    } else if (isSignificant(row)) {
      mergedData[id] = row;
    }
  }

  // 2) Merge NEW over OLD semantics (same instance_id).
  for (const id of Object.keys(newFiltered)) {
    const newRow = newFiltered[id];
    const oldRow = oldFiltered[id];

    if (oldRow) {
      if (isSignificant(newRow)) {
        mergedData[id] = newRow;
      } else {
        const newDate = new Date(newRow?.last_update || 0).getTime();
        const oldDate = new Date(oldRow?.last_update || 0).getTime();
        mergedData[id] = newDate > oldDate ? newRow : oldRow;
      }
    } else {
      mergedData[id] = newRow;
    }
  }

  // 3) Clean up MEGA/PRIMAL placeholders.
  for (const id of Object.keys(mergedData)) {
    const entry = mergedData[id];
    const variantKey = String(entry?.variant_id ?? '').toLowerCase();
    if (!variantKey.includes('mega') && !variantKey.includes('primal')) continue;

    const pokemonID = String(entry?.pokemon_id ?? '');
    if (!pokemonID) continue;

    const isShinyMega = variantKey.includes('shiny_mega');
    const isMegaX = variantKey.includes('mega_x');
    const isMegaY = variantKey.includes('mega_y');
    const isPrimal = variantKey.includes('primal');
    const isShinyPrimal = variantKey.includes('shiny_primal');

    const hasRelevantCaughtInNew = Object.values(newFiltered).some((candidate) => {
      if (!candidate) return false;
      const samePokemon = String(candidate.pokemon_id ?? '') === pokemonID;
      if (!samePokemon) return false;
      if (!candidate.is_caught) return false;
      if (isShinyMega) return candidate.mega && candidate.shiny;
      if (isMegaX || isMegaY) return candidate.mega;
      if (isPrimal) return candidate.mega;
      if (isShinyPrimal) return candidate.mega && candidate.shiny;
      return candidate.mega;
    });

    const isMissingPlaceholder = !entry?.registered && isBaseline(entry);
    if (hasRelevantCaughtInNew && isMissingPlaceholder) {
      delete mergedData[id];
    }
  }

  // 4) Clean up FUSION placeholders.
  for (const id of Object.keys(mergedData)) {
    const entry = mergedData[id];
    const pokemonID = entry?.pokemon_id;
    if (!pokemonID) continue;

    const shiny = !!entry?.shiny;

    const hasCaughtFusionVariant = Object.values(newFiltered).some((candidate) => {
      if (!candidate) return false;
      if (candidate.pokemon_id !== pokemonID) return false;
      if (!!candidate.shiny !== shiny) return false;
      const fusionObj = candidate.fusion || {};
      return candidate.is_caught && Object.values(fusionObj).some(Boolean);
    });

    const isMissingPlaceholder = !entry?.registered && isBaseline(entry);
    if (hasCaughtFusionVariant && isMissingPlaceholder) {
      delete mergedData[id];
    }
  }

  // 5) Final pass: ensure at most one baseline per variant.
  const finalData: Instances = {};
  const caughtOrTradeByVariant = new Set<string>();
  const wantedByVariant = new Set<string>();
  const baselineKeptByVariant = new Set<string>();

  // Keep all caught/trade.
  for (const [id, entry] of Object.entries(mergedData)) {
    if (entry?.is_caught || entry?.is_for_trade) {
      finalData[id] = entry;
      if (entry?.variant_id) caughtOrTradeByVariant.add(entry.variant_id);
    }
  }

  // Keep all wanted.
  for (const [id, entry] of Object.entries(mergedData)) {
    if (entry?.is_wanted) {
      finalData[id] = entry;
      if (entry?.variant_id) wantedByVariant.add(entry.variant_id);
    }
  }

  // Keep one baseline per variant only if no caught/wanted exists.
  const baselinesByVariant: Record<string, BaselineRow[]> = {};
  for (const [id, entry] of Object.entries(mergedData)) {
    if (!isBaseline(entry)) continue;
    const variant = entry?.variant_id ?? '__unknown__';
    (baselinesByVariant[variant] ||= []).push({ id, entry });
  }

  for (const [variant, rows] of Object.entries(baselinesByVariant)) {
    if (caughtOrTradeByVariant.has(variant) || wantedByVariant.has(variant)) continue;
    if (baselineKeptByVariant.has(variant)) continue;

    rows.sort((a, b) => {
      if (!!a.entry.registered !== !!b.entry.registered) {
        return a.entry.registered ? -1 : 1;
      }
      return (b.entry.last_update ?? 0) - (a.entry.last_update ?? 0);
    });

    const keep = rows[0];
    if (keep) {
      finalData[keep.id] = keep.entry;
      baselineKeptByVariant.add(variant);
    }
  }

  // Optional diagnostic for overlapping variants in debug mode.
  if (loggerInternals.shouldEmit('debug')) {
    const indexByVariant = (data: Instances) => {
      const out: Record<string, string[]> = {};
      for (const [id, entry] of Object.entries(data)) {
        const variant = entry?.variant_id ?? '__unknown__';
        (out[variant] ||= []).push(id);
      }
      return out;
    };

    const brief = (id: string, entry: InstanceRow | undefined) => ({
      id,
      variant_id: entry?.variant_id,
      caught: !!entry?.is_caught,
      trade: !!entry?.is_for_trade,
      wanted: !!entry?.is_wanted,
      baseline: isBaseline(entry),
      registered: !!entry?.registered,
      last_update: entry?.last_update ?? null,
    });

    const oldByVariant = indexByVariant(oldFiltered);
    const newByVariant = indexByVariant(newFiltered);
    const mergedByVariant = indexByVariant(mergedData);
    const finalByVariant = indexByVariant(finalData);

    const candidates = Object.keys(oldByVariant).filter((variant) => newByVariant[variant]);
    const pickedVariant =
      candidates.find((variant) => (oldByVariant[variant]?.length ?? 0) + (newByVariant[variant]?.length ?? 0) > 1) ||
      candidates[0];

    if (pickedVariant) {
      const sample = {
        variant_id: pickedVariant,
        old: (oldByVariant[pickedVariant] || []).map((id) => brief(id, oldFiltered[id])),
        server: (newByVariant[pickedVariant] || []).map((id) => brief(id, newFiltered[id])),
        merged_pre_final: (mergedByVariant[pickedVariant] || []).map((id) => brief(id, mergedData[id])),
        final_kept: (finalByVariant[pickedVariant] || []).map((id) => brief(id, finalData[id])),
      };
      log.debug('[SAMPLE variant merge]', sample);
    } else {
      log.debug('[SAMPLE] No overlapping variant_id found this run.');
    }
  }

  log.debug('Completed merge', {
    input: { old: Object.keys(oldFiltered).length, server: Object.keys(newFiltered).length },
    output: Object.keys(finalData).length,
  });

  return finalData;
};
