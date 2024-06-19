import { parsePokemonKey } from "../utils/PokemonIDUtils";

export function updateTradeList(pokemonKey, ownershipData, variants, newStatus) {
    // console.log("Starting trade list update for:", pokemonKey);

    const instance = ownershipData[pokemonKey];
    // Initialize both lists for the current instance
    instance.trade_list = {};
    instance.wanted_list = {};
    // console.log("Trade list and wanted list cleared.");

    const relatedInstances = Object.entries(ownershipData).filter(([key, _]) => key !== pokemonKey);
    // console.log("Related instances found:", relatedInstances.length);

    relatedInstances.forEach(([key, otherInstance]) => {
        const { baseKey: baseKeyOfOther } = parsePokemonKey(key);
        const otherVariantDetails = variants.find(variant => variant.pokemonKey === baseKeyOfOther);
        const currentVariantDetails = variants.find(variant => variant.pokemonKey === parsePokemonKey(pokemonKey).baseKey);

        if (otherVariantDetails && currentVariantDetails) {
            const simplifiedInstanceDetail = {
                currentImage: otherVariantDetails.currentImage
            };

            if (newStatus === 'Trade' && otherInstance.is_wanted) {
                // console.log(`Adding to wanted list for trade: ${key}`);
                instance.wanted_list[key] = simplifiedInstanceDetail;

                if (!otherInstance.trade_list) {
                    otherInstance.trade_list = {};
                    // console.log(`Initializing trade list for reciprocal instance: ${key}`);
                }
                otherInstance.trade_list[pokemonKey] = {
                    currentImage: currentVariantDetails.currentImage
                };
                // console.log(`Reciprocal update done for: ${key}`);
            }
            else if (newStatus === 'Wanted' && otherInstance.is_for_trade) {
                // console.log(`Adding to trade list for wanted: ${key}`);
                instance.trade_list[key] = simplifiedInstanceDetail;

                if (!otherInstance.wanted_list) {
                    otherInstance.wanted_list = {};
                    // console.log(`Initializing wanted list for reciprocal instance: ${key}`);
                }
                otherInstance.wanted_list[pokemonKey] = {
                    currentImage: currentVariantDetails.currentImage
                };
                // console.log(`Reciprocal update done for: ${key}`);
            }
        } else {
            // console.log("No variant details available for:", baseKeyOfOther);
        }
    });
    // console.log("Trade list and wanted list update completed for:", pokemonKey);
}