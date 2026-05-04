package main

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
)

// RawJSON stores arbitrary JSON values, including arrays and objects.
type RawJSON []byte

func (j RawJSON) Value() (driver.Value, error) {
	if len(j) == 0 {
		return nil, nil
	}
	if !json.Valid(j) {
		return nil, fmt.Errorf("invalid JSON value")
	}
	return string(j), nil
}

func (j *RawJSON) Scan(src interface{}) error {
	if src == nil {
		*j = nil
		return nil
	}

	var data []byte
	switch src := src.(type) {
	case []byte:
		data = src
	case string:
		data = []byte(src)
	default:
		return fmt.Errorf("unsupported type: %T", src)
	}

	if len(data) == 0 {
		*j = nil
		return nil
	}
	if !json.Valid(data) {
		return fmt.Errorf("failed to scan invalid JSON")
	}

	*j = append((*j)[:0], data...)
	return nil
}

func (j RawJSON) MarshalJSON() ([]byte, error) {
	if len(j) == 0 {
		return []byte("null"), nil
	}
	if !json.Valid(j) {
		return nil, fmt.Errorf("invalid JSON value")
	}
	return j, nil
}

func (j *RawJSON) UnmarshalJSON(data []byte) error {
	if len(data) == 0 {
		*j = nil
		return nil
	}
	if !json.Valid(data) {
		return fmt.Errorf("invalid JSON value")
	}
	*j = append((*j)[:0], data...)
	return nil
}
