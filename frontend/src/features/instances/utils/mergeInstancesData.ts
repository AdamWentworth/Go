// src/features/instances/utils/mergeInstancesData.ts
import type { Instances } from '@/types/instances';

export const mergeInstancesData = (
  oldData: Instances,
  newData: Instances,
  username: string
): Instances => {
  const mergedData: Instances = {};
  const seenByVariant: Record<string, true> = {};

  const isSignificant = (e: any) =>
    !!(e?.is_caught || e?.is_for_trade || e?.is_wanted);

  const isBaseline = (e: any) =>
    !e?.is_caught && !e?.is_for_trade && !e?.is_wanted;

  // ---- Filter by username without mutating inputs
  const oldFiltered: Instances = {};
  const newFiltered: Instances = {};
  for (const [id, e] of Object.entries(oldData)) {
    if (!e) continue;
    if (e.username && e.username !== username) continue;
    oldFiltered[id] = e;
  }
  for (const [id, e] of Object.entries(newData)) {
    if (!e) continue;
    if (e.username && e.username !== username) continue;
    newFiltered[id] = e;
  }

  console.log('[mergeInstancesData] Starting merge…', {
    oldCount: Object.keys(oldFiltered).length,
    newCount: Object.keys(newFiltered).length,
  });

  // ---- 1) Seed with OLD: keep first per variant; extra OLD only if significant
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

  // ---- 2) Merge NEW over OLD semantics (same instance_id)
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

  // ---- 3) Clean up MEGA/PRIMAL placeholders
  for (const id of Object.keys(mergedData)) {
    const entry = mergedData[id];
    const vkey = String(entry?.variant_id ?? '').toLowerCase();
    if (!vkey.includes('mega') && !vkey.includes('primal')) continue;

    const pid = String(entry?.pokemon_id ?? '');
    if (!pid) continue;

    const isShinyMega   = vkey.includes('shiny_mega');
    const isMegaX       = vkey.includes('mega_x');
    const isMegaY       = vkey.includes('mega_y');
    const isPrimal      = vkey.includes('primal');
    const isShinyPrimal = vkey.includes('shiny_primal');

    const hasRelevantCaughtInNew = Object.values(newFiltered).some((e) => {
      if (!e) return false;
      const samePid = String(e.pokemon_id ?? '') === pid;
      if (!samePid) return false;
      if (!e.is_caught) return false;
      if (isShinyMega)   return e.mega && e.shiny;
      if (isMegaX || isMegaY) return e.mega;
      if (isPrimal)      return e.mega;
      if (isShinyPrimal) return e.mega && e.shiny;
      return e.mega;
    });

    const isMissingPlaceholder = !entry?.registered && isBaseline(entry);

    if (hasRelevantCaughtInNew && isMissingPlaceholder) {
      delete mergedData[id];
    }
  }

  // ---- 4) Clean up FUSION placeholders
  for (const id of Object.keys(mergedData)) {
    const entry = mergedData[id];
    const pid = entry?.pokemon_id;
    if (!pid) continue;

    const shiny = !!entry?.shiny;

    const hasCaughtFusionVariant = Object.values(newFiltered).some((e) => {
      if (!e) return false;
      if (e.pokemon_id !== pid) return false;
      if (!!e.shiny !== shiny) return false;
      const fusionObj = e.fusion || {};
      return e.is_caught && Object.values(fusionObj).some(Boolean);
    });

    const isMissingPlaceholder = !entry?.registered && isBaseline(entry);

    if (hasCaughtFusionVariant && isMissingPlaceholder) {
      delete mergedData[id];
    }
  }

  // ---- 5) Final pass: ensure at most one baseline per variant
  const finalData: Instances = {};
  const caughtOrTradeByVariant = new Set<string>();
  const wantedByVariant = new Set<string>();
  const baselineKeptByVariant = new Set<string>();

  // Keep ALL caught/trade
  for (const [id, e] of Object.entries(mergedData)) {
    if (e?.is_caught || e?.is_for_trade) {
      finalData[id] = e;
      if (e?.variant_id) caughtOrTradeByVariant.add(e.variant_id);
    }
  }

  // Keep ALL wanted
  for (const [id, e] of Object.entries(mergedData)) {
    if (e?.is_wanted) {
      finalData[id] = e;
      if (e?.variant_id) wantedByVariant.add(e.variant_id);
    }
  }

  // Keep ONE baseline per variant only if no caught/wanted exists
  const baselinesByVariant: Record<string, Array<{ id: string; e: any }>> = {};
  for (const [id, e] of Object.entries(mergedData)) {
    if (!isBaseline(e)) continue;
    const v = e?.variant_id ?? '__unknown__';
    (baselinesByVariant[v] ||= []).push({ id, e });
  }

  for (const [variant, rows] of Object.entries(baselinesByVariant)) {
    if (caughtOrTradeByVariant.has(variant) || wantedByVariant.has(variant)) continue;
    if (baselineKeptByVariant.has(variant)) continue;

    rows.sort((a, b) => {
      if (!!a.e.registered !== !!b.e.registered) {
        return a.e.registered ? -1 : 1; // prefer registered baseline
      }
      return (b.e.last_update ?? 0) - (a.e.last_update ?? 0); // newest
    });

    const keep = rows[0];
    if (keep) {
      finalData[keep.id] = keep.e;
      baselineKeptByVariant.add(variant);
    }
  }

  // ---------- DEV DIAGNOSTIC: show one variant present in old+new ----------
  if (process.env.NODE_ENV === 'development') {
    const indexByVariant = (data: Instances) => {
      const out: Record<string, string[]> = {};
      for (const [id, e] of Object.entries(data)) {
        const v = e?.variant_id ?? '__unknown__';
        (out[v] ||= []).push(id);
      }
      return out;
    };
    const brief = (id: string, e: any) => ({
      id,
      variant_id: e?.variant_id,
      caught: !!e?.is_caught,
      trade: !!e?.is_for_trade,
      wanted: !!e?.is_wanted,
      baseline: isBaseline(e),
      registered: !!e?.registered,
      last_update: e?.last_update ?? null,
    });

    const oldByV    = indexByVariant(oldFiltered);
    const newByV    = indexByVariant(newFiltered);
    const mergedByV = indexByVariant(mergedData);
    const finalByV  = indexByVariant(finalData);

    const candidates = Object.keys(oldByV).filter(v => newByV[v]);
    const pick =
      candidates.find(v =>
        (oldByV[v]?.length ?? 0) + (newByV[v]?.length ?? 0) > 1
      ) || candidates[0];

    if (pick) {
      const sample = {
        variant_id: pick,
        old: (oldByV[pick] || []).map(id => brief(id, oldFiltered[id])),
        server: (newByV[pick] || []).map(id => brief(id, newFiltered[id])),
        merged_pre_final: (mergedByV[pick] || []).map(id => brief(id, mergedData[id])),
        final_kept: (finalByV[pick] || []).map(id => brief(id, finalData[id])),
      };
      console.log('[mergeInstancesData][SAMPLE variant merge]', sample);
    } else {
      console.log('[mergeInstancesData][SAMPLE] No overlapping variant_id found this run.');
    }
  }
  // ------------------------------------------------------------------------

  console.log('[mergeInstancesData] Completed.', {
    input: { old: Object.keys(oldFiltered).length, server: Object.keys(newFiltered).length },
    output: Object.keys(finalData).length,
  });

  return finalData;
};
