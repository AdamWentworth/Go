/**
 * Filters moves based on whether they are fast or charged.
 * @param {Array} moves - The array of moves available to a Pokémon.
 * @param {boolean} isFast - Flag to determine if filtering for fast moves (true) or charged moves (false).
 * @return {Array} Filtered array of moves.
 */
export const filterMoves = (moves, isFast) => {
    return moves.filter(move => move.is_fast === (isFast ? 1 : 0));
  };
  
  /**
   * Formats a number to ensure it displays as a fixed decimal place string.
   * Useful for weights, heights, etc., ensuring uniformity in display.
   * @param {number} number - The number to format.
   * @param {number} digits - The number of decimal places to fix.
   * @return {string} Formatted number as a string.
   */
  export const formatNumber = (number, digits = 2) => {
    return number.toFixed(digits);
  };
  
  /**
   * Converts a move ID to its name using a mapping.
   * @param {number} moveId - The ID of the move.
   * @param {Object} moveMap - An object mapping move IDs to names.
   * @return {string} The name of the move.
   */
  export const getMoveNameById = (moveId, moveMap) => {
    return moveMap[moveId] || 'Unknown';
  };
  
  