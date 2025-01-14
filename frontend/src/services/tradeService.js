// services/tradeService.js

import axios from 'axios';

/**
 * Reveal the partner's info for a given trade.
 * @param {Object} trade - The entire trade object (including trade_id, usernames, etc.)
 * @returns {Object} - { trainerCode, pokemonGoName } on success
 */

export async function revealPartnerInfo(trade) {
  try {
    // Pass the entire `trade` in the POST body
    const response = await axios.post(
      `${process.env.REACT_APP_AUTH_API_URL}/reveal-partner-info`,
      // The backend can parse this entire trade object
      { trade },
      {
        // This ensures cookies are sent along (assuming your server sets cookies)
        withCredentials: true,
        validateStatus: () => true,  // or some custom check if you prefer
      }
    );

    if (response.status >= 200 && response.status < 300) {
      // We expect { trainerCode, pokemonGoName }
      return response.data;
    } else {
      throw new Error('Failed to reveal partner info.');
    }
  } catch (error) {
    console.error('[revealPartnerInfo] error:', error);
    throw error;
  }
}
