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

    // Merge new data
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

    // Merge old data
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

    // Ensure at most one instance per prefix has is_unowned: true
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
