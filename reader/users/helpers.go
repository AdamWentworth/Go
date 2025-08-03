// helpers.go

package main

import "strings"

// isTransientError checks if the error message indicates a transient DB connection issue.
// Adjust this logic to suit your DB driver's actual error strings or underlying error types.
func isTransientError(err error) bool {
	// Example: Look for "bad connection" in the error string
	return err != nil && strings.Contains(err.Error(), "bad connection")
}
