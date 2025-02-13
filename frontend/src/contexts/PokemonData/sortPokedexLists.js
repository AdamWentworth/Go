// SortPokedexLists.js

/**
 * Sorts Pokémon variants into categorized lists for caching in IndexedDB.
 *
 * The following lists are created:
 * - default: variants with variantType exactly "default"
 * - shiny: variants with variantType exactly "shiny"
 * - costume: variants with "costume" in variantType and NOT "shiny"
 * - shadow: variants with "shadow" in variantType and NOT "shiny"
 * - shiny costume: variants with both "shiny" and "costume" in variantType
 * - shiny shadow: variants with both "shiny" and "shadow" in variantType
 * - shadow costume: variants with both "shadow" and "costume" in variantType and NOT "shiny"
 * - mega: variants with "mega" or "primal" in variantType and NOT "shiny"
 * - shiny mega: variants with ("mega" or "primal") AND "shiny" in variantType
 * - dynamax: variants with "dynamax" in variantType and NOT "shiny"
 * - shiny dynamax: variants with both "dynamax" and "shiny" in variantType
 * - gigantamax: variants with "gigantamax" in variantType and NOT "shiny"
 * - shiny gigantamax: variants with both "gigantamax" and "shiny" in variantType
 *
 * @param {Array} variants - The array of Pokémon variant objects.
 * @returns {Object} An object representing the categorized lists.
 */
export default function sortPokedexLists(variants) {
    // Initialize lists structure with keys matching the desired categories.
    const lists = {
      default: [],
      shiny: [],
      costume: [],
      shadow: [],
      'shiny costume': [],
      'shiny shadow': [],
      'shadow costume': [],
      mega: [],
      'shiny mega': [],
      dynamax: [],
      'shiny dynamax': [],
      gigantamax: [],
      'shiny gigantamax': []
    };
  
    variants.forEach(variant => {
      // Convert variantType to lower case for case-insensitive comparisons.
      const vt = variant.variantType.toLowerCase();
  
      // Check for default and shiny by exact match first.
      if (vt === 'default') {
        lists.default.push(variant);
      } else if (vt === 'shiny') {
        lists.shiny.push(variant);
      }
      // Check for gigantamax and assign based on presence of shiny.
      else if (vt.includes('gigantamax')) {
        if (vt.includes('shiny')) {
          lists['shiny gigantamax'].push(variant);
        } else {
          lists.gigantamax.push(variant);
        }
      }
      // Check for dynamax.
      else if (vt.includes('dynamax')) {
        if (vt.includes('shiny')) {
          lists['shiny dynamax'].push(variant);
        } else {
          lists.dynamax.push(variant);
        }
      }
      // Check for mega or primal.
      else if (vt.includes('mega') || vt.includes('primal')) {
        if (vt.includes('shiny')) {
          lists['shiny mega'].push(variant);
        } else {
          lists.mega.push(variant);
        }
      }
      // Check for combinations that include shiny first.
      else if (vt.includes('shiny') && vt.includes('costume')) {
        lists['shiny costume'].push(variant);
      } else if (vt.includes('shiny') && vt.includes('shadow')) {
        lists['shiny shadow'].push(variant);
      }
      // Next check for non-shiny combination: shadow & costume.
      else if (vt.includes('shadow') && vt.includes('costume') && !vt.includes('shiny')) {
        lists['shadow costume'].push(variant);
      }
      // Then check for singular attributes.
      else if (vt.includes('costume') && !vt.includes('shiny')) {
        lists.costume.push(variant);
      } else if (vt.includes('shadow') && !vt.includes('shiny')) {
        lists.shadow.push(variant);
      }
      // Fallback: assign to default if nothing matches.
      else {
        lists.default.push(variant);
      }
    });
  
    return lists;
  }
  