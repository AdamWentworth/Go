// mergeOwnershipData.js

export const mergeOwnershipData = (oldData, newData) => {
    const mergedData = {};
    const oldDataProcessed = {};

    const extractPrefix = (key) => {
        const keyParts = key.split('_');
        keyParts.pop(); // Remove the UUID part
        return keyParts.join('_'); // Rejoin to form the actual prefix
    };

    console.log("Starting merge process...");

    // Step 1: Merge new data
    Object.keys(newData).forEach(key => {
        const prefix = extractPrefix(key);
        // Check for exact key match in old and new data
        if (oldData.hasOwnProperty(key)) {
            // If matching keys, compare their last_update values
            const newDate = new Date(newData[key].last_update);
            const oldDate = new Date(oldData[key].last_update);
            if (newDate > oldDate) {
                mergedData[key] = newData[key];
            } else {
                mergedData[key] = oldData[key];
            }
        } else {
            mergedData[key] = newData[key];
        }
        oldDataProcessed[prefix] = oldDataProcessed[prefix] || [];
        oldDataProcessed[prefix].push(key);
    });

    // Step 2: Merge old data
    Object.keys(oldData).forEach(oldKey => {
        const prefix = extractPrefix(oldKey);
        if (!oldDataProcessed[prefix]) {
            // No new data with this prefix, add old data as is
            mergedData[oldKey] = oldData[oldKey];
        } else {
            const significantOld = oldData[oldKey].is_owned || oldData[oldKey].is_for_trade || oldData[oldKey].is_wanted;
            const anySignificantNew = oldDataProcessed[prefix].some(newKey =>
                newData[newKey].is_owned || newData[newKey].is_for_trade || newData[newKey].is_wanted);

            if (significantOld && !anySignificantNew) {
                // Old data is significant and no new significant data, retain old
                mergedData[oldKey] = oldData[oldKey];
            }
        }
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
                const relatedNewKeys = Object.keys(newData).filter(newKey => newKey.startsWith(leadingNumbers));

                // Determine the type of mega entry
                const isShinyMega = key.includes("shiny_mega");
                const isMegaX = key.toLowerCase().includes("mega_x");
                const isMegaY = key.toLowerCase().includes("mega_y");

                // Determine the required form if it's mega_x or mega_y
                let requiredForm = null;
                if (isMegaX) {
                    requiredForm = "x";
                } else if (isMegaY) {
                    requiredForm = "y";
                }

                // Check if any of the related new entries satisfy the required conditions
                const hasRelevantMegaInNew = relatedNewKeys.some(newKey => {
                    const entry = newData[newKey];
                    if (!entry) return false;

                    // Standardize the form to lowercase for comparison
                    const entryForm = entry.mega_form ? entry.mega_form.toLowerCase() : null;

                    if (isShinyMega) {
                        // For 'shiny_mega', both mega and shiny must be true
                        return entry.mega === true && entry.shiny === true;
                    } else if (isMegaX || isMegaY) {
                        // For 'mega_x' or 'mega_y', mega must be true and mega_form must match
                        if (entry.mega !== true) return false;
                        if (!requiredForm) return false; // Safety check
                        return entryForm === requiredForm;
                    } else {
                        // For regular 'mega', only mega needs to be true
                        return entry.mega === true;
                    }
                });

                if (hasRelevantMegaInNew && mergedData[key].is_unowned === true) {
                    let entryType = "mega";

                    if (isShinyMega) {
                        entryType = "shiny mega";
                    } else if (isMegaX) {
                        entryType = "mega_x";
                    } else if (isMegaY) {
                        entryType = "mega_y";
                    }

                    console.log(`Dropping unowned ${entryType} "${key}" because a related new entry with the required flags exists.`);
                    delete mergedData[key]; // Remove the unowned mega entry
                }
            }
        }
    });

    // Step 4: Ensure at most one instance per prefix has is_unowned: true
    const finalData = {};
    const unownedTracker = new Set();

    Object.keys(mergedData).forEach(key => {
        const prefix = extractPrefix(key);

        if (mergedData[key].is_unowned === true) {
            if (unownedTracker.has(prefix)) {
                // Set the extra unowned instances to owned: false
                mergedData[key].is_unowned = false;
            } else {
                unownedTracker.add(prefix);
            }
        }

        finalData[key] = mergedData[key];
    });

    console.log("Merge process completed.");
    return finalData;
};
