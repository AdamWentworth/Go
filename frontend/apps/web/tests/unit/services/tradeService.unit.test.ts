import { beforeEach, describe, expect, it, vi } from 'vitest';

import { revealPartnerInfo } from '@/services/tradeService';

describe('tradeService.revealPartnerInfo', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns partner info on 2xx response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          trainerCode: '1234 5678 9012',
          pokemonGoName: 'AshKetchum',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );

    const result = await revealPartnerInfo({ trade_id: 't1' });

    expect(result).toEqual({
      trainerCode: '1234 5678 9012',
      pokemonGoName: 'AshKetchum',
    });
  });

  it('throws when backend returns non-2xx', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'denied' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    await expect(revealPartnerInfo({ trade_id: 't1' })).rejects.toThrow(
      'Failed to reveal partner info.',
    );
  });
});
