// src/utils/fusionParsing.ts

/**
 * Extracts the base number (e.g. "0800") from a key like "0800-fusion_1".
 */
export function parseBaseNumber(key: string): string | null {
    const match = key.match(/^(\d+)/);
    return match ? match[1] : null;
  }
  
  /**
   * Extracts the fusion ID (e.g. "1") from a key like "0800-fusion_1".
   */
  export function parseFusionId(key: string): string | null {
    const match = key.match(/fusion_(\d+)/);
    return match ? match[1] : null;
  }
  
  /**
   * Determines if the Pokémon is shiny based on the key.
   */
  export function parseShinyStatus(key: string): boolean {
    return key.includes('shiny');
  }
  