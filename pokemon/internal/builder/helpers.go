package builder

import "strconv"

// --- helpers ---

func appendTo(p map[string]any, key string, v any) {
	if p == nil {
		return
	}
	if arr, ok := p[key].([]any); ok {
		p[key] = append(arr, v)
		return
	}
	// If it's missing or the wrong type, replace it (matches Node's overwrite-by-spread behavior).
	p[key] = []any{v}
}

func asInt(v any) int {
	switch t := v.(type) {
	case int:
		return t
	case int64:
		return int(t)
	case float64:
		return int(t)
	case []byte:
		i, _ := strconv.Atoi(string(t))
		return i
	case string:
		i, _ := strconv.Atoi(t)
		return i
	default:
		return 0
	}
}

func asString(v any) string {
	switch t := v.(type) {
	case string:
		return t
	case []byte:
		return string(t)
	default:
		return ""
	}
}

func lower(s string) string {
	out := []rune(s)
	for i, r := range out {
		if r >= 'A' && r <= 'Z' {
			out[i] = r + 32
		}
	}
	return string(out)
}

func iconPath(typeName string) any {
	if typeName == "" {
		return nil
	}
	return "/images/types/" + lower(typeName) + ".png"
}

func nullIfEmpty(v any) any {
	if asString(v) == "" {
		return nil
	}
	return v
}

func nullIfZero(v any) any {
	if asInt(v) == 0 {
		return nil
	}
	return v
}

func cloneMap(m map[string]any) map[string]any {
	out := make(map[string]any, len(m))
	for k, v := range m {
		out[k] = v
	}
	return out
}
