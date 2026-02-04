package builder

import (
	"database/sql"
	"fmt"
)

func scanRowsToMaps(rows *sql.Rows) ([]map[string]any, error) {
	cols, err := rows.Columns()
	if err != nil {
		return nil, err
	}
	colTypes, _ := rows.ColumnTypes()

	out := make([]map[string]any, 0)
	for rows.Next() {
		// Create scan targets
		vals := make([]any, len(cols))
		ptrs := make([]any, len(cols))
		for i := range vals {
			ptrs[i] = &vals[i]
		}

		if err := rows.Scan(ptrs...); err != nil {
			return nil, err
		}

		m := make(map[string]any, len(cols))
		for i, c := range cols {
			v := vals[i]
			// Normalize []byte to string for text-ish types
			if b, ok := v.([]byte); ok {
				// Keep bytes for blobs; otherwise convert to string
				if len(colTypes) > i && colTypes[i] != nil {
					if isTextType(colTypes[i].DatabaseTypeName()) {
						m[c] = string(b)
						continue
					}
				}
				m[c] = string(b)
				continue
			}
			m[c] = v
		}
		out = append(out, m)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return out, nil
}

func isTextType(dbType string) bool {
	switch dbType {
	case "TEXT", "VARCHAR", "CHAR", "NVARCHAR":
		return true
	default:
		return false
	}
}

func inClause(col string, ids []int) (string, []any) {
	if len(ids) == 0 {
		return "1=0", nil
	}
	args := make([]any, 0, len(ids))
	placeholders := ""
	for i, id := range ids {
		if i > 0 {
			placeholders += ","
		}
		placeholders += "?"
		args = append(args, id)
	}
	return fmt.Sprintf("%s IN (%s)", col, placeholders), args
}
