package main

// normalizeOwnershipState enforces canonical invariants for instance ownership
// and intent flags.
func normalizeOwnershipState(
	isCaught bool,
	isWanted bool,
	isForTrade bool,
	registered bool,
	mostWanted bool,
) (bool, bool, bool, bool, bool) {
	// Trade requires ownership. If not caught:
	// - 0/1/1 becomes 0/1/0
	// - 0/0/1 becomes 0/0/0 (caller will treat as delete candidate)
	if !isCaught && isForTrade {
		isForTrade = false
	}

	// Caught and wanted at the same time on the same instance is invalid.
	// When not for trade, keep it as wanted (0/1/0) and preserve registration.
	if isCaught && isWanted && !isForTrade {
		isCaught = false
		registered = true
	}

	// If it is explicitly for trade while caught, wanted is contradictory.
	if isCaught && isForTrade && isWanted {
		isWanted = false
	}

	// Caught instances are always registered.
	if isCaught && !registered {
		registered = true
	}

	// most_wanted only applies to wanted instances.
	if mostWanted && !isWanted {
		mostWanted = false
	}

	return isCaught, isWanted, isForTrade, registered, mostWanted
}
