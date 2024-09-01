// listUtils.js

export const revertWantedList = (prevLists, localNotWantedList) => {
    return Object.keys(prevLists.wanted).reduce((acc, key) => {
        if (!localNotWantedList[key]) {
            acc[key] = prevLists.wanted[key];
        }
        return acc;
    }, {});
};

export const updateDisplayedList = (newData, prevLists, setListsState) => {
    setListsState(prevLists => ({
        ...prevLists,
        wanted: newData ? { ...prevLists.wanted, ...newData } : revertWantedList(prevLists)
    }));
};
