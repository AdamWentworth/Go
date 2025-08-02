// helpers.go
package main

import "strings"

// escapeLike sanitises a user-supplied string for use inside a SQL LIKE pattern
// by escaping %, _ and \ with a back-slash.
// Callers must append/prepend their own wildcards and add “ESCAPE '\'” to the SQL.
func escapeLike(s string) string {
	return strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`).Replace(s)
}

// isTransientError checks if the error message indicates a transient DB connection issue.
// Adjust this logic to suit your DB driver's actual error strings or underlying error types.
func isTransientError(err error) bool {
	return err != nil && strings.Contains(err.Error(), "bad connection")
}
