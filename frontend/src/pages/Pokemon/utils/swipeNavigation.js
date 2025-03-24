// swipeNavigation.js

export function getNextActiveView(currentView, direction) {
    if (direction === 'left') {
      if (currentView === 'pokedex') return 'pokemon';
      if (currentView === 'pokemon') return 'tags';
    } else if (direction === 'right') {
      if (currentView === 'tags') return 'pokemon';
      if (currentView === 'pokemon') return 'pokedex';
    }
    // If no change, return the current view.
    return currentView;
  }
  