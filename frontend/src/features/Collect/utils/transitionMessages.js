// transitionMessages.js

// 1. A utility to figure out the status string from your ownership fields.
export function getStatusFromInstance(instance) {
    if (instance.is_unowned)   return 'Unowned';
    if (instance.is_for_trade) return 'Trade';
    if (instance.is_wanted)    return 'Wanted';
    if (instance.is_owned)     return 'Owned';
    return 'Unknown';
  }
  
  // 2. A dictionary of messages for each (from → to) combination.
  const MESSAGES = {
    Owned: {
      Trade: (name) => `List ${name} for Trade?`,
      Wanted: (name) => `Create a duplicate ${name} for your Wanted list?`,
      Unowned: (name) => `Transfer ${name}?`,
    },
    Trade: {
      Owned: (name) => `Remove ${name} from Trade Listing?`,
      Wanted: (name) => `Create a duplicate ${name} for your Wanted list?`,
      Unowned: (name) => `Transfer ${name}?`,
    },
    Wanted: {
      Owned: (name) => `Caught ${name}?`,
      Trade: (name) => `Caught ${name} and list for Trade?`,
      Unowned: (name) => `Transfer ${name}?`,
    },
    Unowned: {
      Owned: (name) => `Caught ${name}?`,
      Trade: (name) => `Caught ${name} and list for Trade?`,
      Wanted: (name) => `List ${name} as Wanted?`,
    },
  };
  
  // 3. This function returns your custom message if it exists,
  //    or falls back to "Move X from Y to Z" if there's no specific entry.
  export function getTransitionMessage(fromStatus, toStatus, displayName) {
    if (MESSAGES[fromStatus] && typeof MESSAGES[fromStatus][toStatus] === 'function') {
      return MESSAGES[fromStatus][toStatus](displayName);
    }
    // Fallback if no exact match:
    return `Move ${displayName} from ${fromStatus} to ${toStatus}`;
  }
  