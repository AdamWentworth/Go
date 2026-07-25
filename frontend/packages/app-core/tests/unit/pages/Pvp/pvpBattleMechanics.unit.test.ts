import { describe, expect, it } from 'vitest';

import {
  pvpBattleMechanicsLabel,
  resolvePvPBattleMechanics,
} from '@/pages/Pvp/utils/pvpBattleMechanics';

describe('PvP battle mechanics selection', () => {
  it('uses the June 2026 engine for Open League and ordinary cups', () => {
    expect(resolvePvPBattleMechanics('great')).toBe('current-2026');
    expect(resolvePvPBattleMechanics('retro-1500', {
      key: 'retro-1500',
      label: 'Retro Cup',
      cup: 'retro',
    })).toBe('current-2026');
  });

  it('keeps Competitors Cup on championship mechanics during its transition', () => {
    expect(resolvePvPBattleMechanics('competitors-1500', {
      key: 'competitors-1500',
      label: 'Competitors Cup',
      cup: 'competitors',
    })).toBe('pvpoke-legacy');
  });

  it('honors an explicit mechanics declaration from a published format', () => {
    expect(resolvePvPBattleMechanics('custom', {
      key: 'custom',
      label: 'Custom Cup',
      cup: 'custom',
      mechanics: 'pvpoke-legacy',
    })).toBe('pvpoke-legacy');
  });

  it('uses player-facing labels instead of implementation identifiers', () => {
    expect(pvpBattleMechanicsLabel('current-2026')).toBe('June 2026 rules');
    expect(pvpBattleMechanicsLabel('pvpoke-legacy'))
      .toBe('2026 championship rules');
  });
});
