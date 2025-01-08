// helpers.go

package main

import "strings"

// isTransientError checks if the error message suggests a transient DB connection issue.
func isTransientError(err error) bool {
	if err == nil {
		return false
	}

	// Example: Look for 'bad connection' substring in error text
	if strings.Contains(err.Error(), "bad connection") {
		return true
	}

	return false
}
