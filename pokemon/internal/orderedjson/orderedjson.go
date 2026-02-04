package orderedjson

import (
	"bytes"
	"encoding/json"
	"sort"
)

// Map is a JSON object with a preferred key order.
// Keys listed in Order are emitted first (if present), in that exact order.
// Any remaining keys are emitted afterward in lexicographic order.
//
// This exists to match Node/JS object insertion ordering in JSON.stringify output.
type Map struct {
	M     map[string]any
	Order []string
}

func (om Map) MarshalJSON() ([]byte, error) {
	if om.M == nil {
		return []byte("null"), nil
	}

	seen := make(map[string]struct{}, len(om.M))

	var buf bytes.Buffer
	buf.WriteByte('{')

	first := true
	writeKV := func(k string, v any) error {
		kb, err := json.Marshal(k)
		if err != nil {
			return err
		}
		vb, err := json.Marshal(v)
		if err != nil {
			return err
		}
		if !first {
			buf.WriteByte(',')
		}
		first = false
		buf.Write(kb)
		buf.WriteByte(':')
		buf.Write(vb)
		return nil
	}

	// 1) Preferred order first
	for _, k := range om.Order {
		v, ok := om.M[k]
		if !ok {
			continue
		}
		seen[k] = struct{}{}
		if err := writeKV(k, v); err != nil {
			return nil, err
		}
	}

	// 2) Remaining keys lexicographically
	rest := make([]string, 0, len(om.M))
	for k := range om.M {
		if _, ok := seen[k]; ok {
			continue
		}
		rest = append(rest, k)
	}
	sort.Strings(rest)
	for _, k := range rest {
		if err := writeKV(k, om.M[k]); err != nil {
			return nil, err
		}
	}

	buf.WriteByte('}')
	return buf.Bytes(), nil
}
