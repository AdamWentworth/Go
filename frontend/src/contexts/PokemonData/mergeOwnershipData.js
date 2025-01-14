// mergeOwnershipData.js

export const mergeOwnershipData = (oldData, newData, username) => {
    const mergedData = {};
    const oldDataProcessed = {};

    const extractPrefix = (key) => {
        const keyParts = key.split('_');
        keyParts.pop(); // Remove the UUID part
        return keyParts.join('_'); // Rejoin to form the actual prefix
    };

    console.log("Starting merge process...");

    // Early username filtering for newData
    Object.keys(newData).forEach(key => {
        const entry = newData[key];
        if (entry.username) {
            // console.log(`Entry ${key} has username: ${entry.username}.`);

            if (entry.username === username) {
                console.log(`Keeping entry ${key} because username matches provided username.`);
            } else {
                console.log(`Dropping entry ${key} because username does not match provided username (${username}).`);
                delete newData[key];
                delete oldData[key];
            }
        }
    });
    // Step 1: Merge old data
    Object.keys(oldData).forEach(oldKey => {
        const prefix = extractPrefix(oldKey);
    
        if (!oldDataProcessed[prefix]) {
            // No new data with this prefix, add old data as is
            mergedData[oldKey] = oldData[oldKey];
        } else {
            // Check if this old entry is significant
            const significantOld = oldData[oldKey].is_owned || 
                                   oldData[oldKey].is_for_trade || 
                                   oldData[oldKey].is_wanted;
            
            // If the old entry is significant, always preserve it
            if (significantOld) {
                mergedData[oldKey] = oldData[oldKey];
            }
            // Non-significant old entries are not merged if there's new data for the prefix
        }
    });
    
    // Step 2: Merge new data
    Object.keys(newData).forEach(key => {
        const prefix = extractPrefix(key);
        if (oldData.hasOwnProperty(key)) {
            // Determine if the new entry is significant
            const significantNew = newData[key].is_owned || newData[key].is_for_trade || newData[key].is_wanted;
            
            if (significantNew) {
                // Always prefer new if it is significant
                mergedData[key] = newData[key];
            } else {
                // If not significant, compare based on last_update
                const newDate = new Date(newData[key].last_update);
                const oldDate = new Date(oldData[key].last_update);
                mergedData[key] = (newDate > oldDate) ? newData[key] : oldData[key];
            }
        } else {
            // Key doesn't exist in oldData, so take newData as is
            mergedData[key] = newData[key];
        }
        
        // Track processed prefixes
        oldDataProcessed[prefix] = oldDataProcessed[prefix] || [];
        oldDataProcessed[prefix].push(key);
    });



    // Step 3: Integrate Mega Logic
    // Drop all 'mega', 'shiny_mega', 'mega_x', or 'mega_y' entries that are 'is_unowned' 
    // if newData has matching instances with the required flags
    Object.keys(mergedData).forEach(key => {
        if (key.includes("mega")) {
            // Extract the leading numbers by removing "mega" from the key
            const leadingNumbersMatch = key.match(/^(\d+)/);
            if (leadingNumbersMatch) {
                const leadingNumbers = leadingNumbersMatch[1];
                // Find all related keys in newData that start with the same leading numbers
                const relatedNewKeys = Object.keys(newData).filter(newKey => 
                    newKey.startsWith(leadingNumbers)
                );

                // Determine if it's shiny or X/Y
                const isShinyMega = key.includes("shiny_mega");
                const isMegaX = key.toLowerCase().includes("mega_x");
                const isMegaY = key.toLowerCase().includes("mega_y");

                // --- THE IMPORTANT PART: RELAX THE CHECK FOR mega_x / mega_y ---
                const hasRelevantMegaInNew = relatedNewKeys.some(newKey => {
                const entry = newData[newKey];
                if (!entry) return false;

                // If it's shiny mega, still require both mega && shiny
                if (isShinyMega) {
                    return entry.mega === true && entry.shiny === true;
                }
                // If it's mega_x or mega_y, we no longer check the form — only need mega === true
                else if (isMegaX || isMegaY) {
                    return entry.mega === true;
                }
                // Otherwise (regular mega), only need mega === true
                else {
                    return entry.mega === true;
                }
                });

                // Drop if we found a relevant new entry + old entry is_unowned
                if (hasRelevantMegaInNew && mergedData[key].is_unowned === true) {
                delete mergedData[key];
                }
            }
        }
    });

    // Step 4: Ensure at most one instance per prefix has is_unowned: true
    const finalData = {};
    const ownedTracker = new Set(); // Track prefixes for owned instances
    const processedPrefixes = new Set(); // Track prefixes already processed

    // First pass: Process owned entries
    Object.keys(mergedData).forEach(key => {
        const prefix = extractPrefix(key);

        if (mergedData[key].is_owned === true) {
            // Keep all owned entries and add their prefix to the tracker
            ownedTracker.add(prefix);
            finalData[key] = mergedData[key];
            processedPrefixes.add(prefix);
        }
    });

    // Second pass: Process wanted entries
    Object.keys(mergedData).forEach(key => {
        const prefix = extractPrefix(key);

        if (!processedPrefixes.has(prefix) && mergedData[key].is_wanted === true) {
            // Keep wanted entries if the prefix hasn't already been processed
            finalData[key] = mergedData[key];
            processedPrefixes.add(prefix);
        }
    });

    // Third pass: Process unowned entries
    Object.keys(mergedData).forEach(key => {
        const prefix = extractPrefix(key);

        if (!processedPrefixes.has(prefix) && mergedData[key].is_unowned === true) {
            // Keep unowned entries only if no owned or wanted instance exists for the prefix
            finalData[key] = mergedData[key];
            processedPrefixes.add(prefix);
        }
    });

    console.log("Merge process completed.");
    return finalData;
};
