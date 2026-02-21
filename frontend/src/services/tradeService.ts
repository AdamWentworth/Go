// services/tradeService.js

import { createScopedLogger } from '@/utils/logger';
import { buildUrl, parseJsonSafe, requestWithPolicy } from './httpClient';
import { tradesContract } from '@shared-contracts/trades';
import type {
  PartnerInfo,
  RevealPartnerInfoRequest,
  TradeReference,
} from '@shared-contracts/trades';

export type { PartnerInfo } from '@shared-contracts/trades';

const log = createScopedLogger('tradeService');

/**
 * Reveal the partner's info for a given trade.
 * @param trade - The entire trade object (including trade_id, usernames, etc.)
 * @returns {Promise<PartnerInfo>} - Partner info on success
 */
export async function revealPartnerInfo(trade: TradeReference): Promise<PartnerInfo> {
  try {
    const payload: RevealPartnerInfoRequest = { trade };
    const response = await requestWithPolicy(
      buildUrl(import.meta.env.VITE_AUTH_API_URL, tradesContract.endpoints.revealPartnerInfo),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      },
    );
    const data = await parseJsonSafe<PartnerInfo>(response);

    if (response.status >= 200 && response.status < 300) {
      return data ?? {};
    } else {
      throw new Error('Failed to reveal partner info.');
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      log.error('[revealPartnerInfo] error:', error.message);
      throw error;
    } else {
      log.error('[revealPartnerInfo] unknown error:', error);
      throw new Error('An unexpected error occurred.');
    }
  }
}
