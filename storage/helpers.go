// helpers/helpers.go
package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

// ---------------------
// HELPER FUNCTIONS
// ---------------------

// parseNullableString returns *string if the incoming value is non-empty; otherwise nil.
// This matches your request to “convert empty strings to null” for nullable columns.
func parseNullableString(value interface{}) *string {
	if value == nil {
		return nil
	}
	strVal := fmt.Sprintf("%v", value)
	if strVal == "" {
		return nil
	}
	return &strVal
}

// parseOptionalBool tries to convert a value to bool, defaults to false if nil/invalid.
func parseOptionalBool(value interface{}) bool {
	if value == nil {
		return false
	}
	boolValue, err := strconv.ParseBool(fmt.Sprintf("%v", value))
	if err != nil {
		return false
	}
	return boolValue
}

// parseNullableInt returns *int if the value is non-empty and valid; otherwise nil.
func parseNullableInt(value interface{}) *int {
	if value == nil {
		return nil
	}
	strVal := fmt.Sprintf("%v", value)
	if strVal == "" {
		return nil
	}
	intValue, err := strconv.Atoi(strVal)
	if err != nil {
		return nil
	}
	return &intValue
}

// parseRequiredInt ensures that the field is present and non-empty, else returns an error.
func parseRequiredInt(value interface{}) (int, error) {
	if value == nil {
		return 0, errors.New("required int field is missing")
	}
	strVal := fmt.Sprintf("%v", value)
	if strVal == "" {
		return 0, errors.New("required int field is empty")
	}
	intValue, err := strconv.Atoi(strVal)
	if err != nil {
		return 0, fmt.Errorf("invalid int value: %v", err)
	}
	return intValue, nil
}

// parseNullableFloat returns *float64 if non-empty and valid; otherwise nil.
func parseNullableFloat(value interface{}) *float64 {
	if value == nil {
		return nil
	}
	strVal := fmt.Sprintf("%v", value)
	if strVal == "" {
		return nil
	}
	floatValue, err := strconv.ParseFloat(strVal, 64)
	if err != nil {
		return nil
	}
	return &floatValue
}

// parseOptionalDate tries to parse a date/datetime string into time.Time. If unrecognized, returns nil.
func parseOptionalDate(value interface{}) *time.Time {
	if value == nil {
		return nil
	}
	strVal := strings.TrimSpace(fmt.Sprintf("%v", value))
	if strVal == "" {
		return nil
	}
	layouts := []string{
		"2006-01-02",
		"2006-01-02T15:04:05Z",
	}
	for _, layout := range layouts {
		if t, err := time.Parse(layout, strVal); err == nil {
			return &t
		}
	}
	logrus.Errorf("Unrecognized date format for date_caught/date_added: %s", strVal)
	return nil
}

// parseOptionalTime parses timestamps for Trades (proposal/accepted/etc). Returns nil if parse fails.
func parseOptionalTime(value interface{}) *time.Time {
	if value == nil {
		return nil // Return nil if the value is nil
	}
	strVal := strings.TrimSpace(fmt.Sprintf("%v", value))
	if strVal == "" {
		return nil // Return nil if the value is empty
	}
	t, err := time.Parse(time.RFC3339, strVal)
	if err != nil {
		return nil // Silently return nil if parsing fails
	}
	return &t
}

// safeFloat parses a float with fallback if invalid.
func safeFloat(value interface{}, fallback float64) float64 {
	if value == nil {
		return fallback
	}
	f, err := strconv.ParseFloat(fmt.Sprintf("%v", value), 64)
	if err != nil {
		return fallback
	}
	return f
}

// safeJSON replicates Python’s “jsonField or {}” => always store at least "{}".
func safeJSON(value interface{}) *string {
	if value == nil {
		empty := "{}"
		return &empty
	}
	bytes, err := json.Marshal(value)
	if err != nil {
		empty := "{}"
		return &empty
	}
	str := string(bytes)
	// If user passes an empty string for a JSON field, we store "{}"
	if str == `""` {
		str = "{}"
	}
	return &str
}
