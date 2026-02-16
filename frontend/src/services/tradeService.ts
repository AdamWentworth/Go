// services/tradeService.js

import axios from 'axios';

interface Trade {
  trade_id?: string;
  usernames?: string[];
  [key: string]: unknown;
}

export interface PartnerInfo {
  trainerCode?: string | null;
  pokemonGoName?: string | null;
  location?: string | null;
}

/**
 * Reveal the partner's info for a given trade.
 * @param trade - The entire trade object (including trade_id, usernames, etc.)
 * @returns {Promise<PartnerInfo>} - Partner info on success
 */
export async function revealPartnerInfo(trade: Trade): Promise<PartnerInfo> {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_AUTH_API_URL}/reveal-partner-info`,
      { trade },
      {
        withCredentials: true,
        validateStatus: () => true,
      }
    );

    if (response.status >= 200 && response.status < 300) {
      return response.data as PartnerInfo;
    } else {
      throw new Error('Failed to reveal partner info.');
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('[revealPartnerInfo] error:', error.message);
      throw error;
    } else {
      console.error('[revealPartnerInfo] unknown error:', error);
      throw new Error('An unexpected error occurred.');
    }
  }
}
