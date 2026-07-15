package builder

import (
	"context"
	"fmt"
)

func (b *Builder) queryRows(ctx context.Context, q string, args ...any) ([]map[string]any, error) {
	rows, err := b.db.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer func() { _ = rows.Close() }()
	return scanRowsToMaps(rows)
}

func (b *Builder) inClause(column string, ids []int) (string, []any) {
	if len(ids) == 0 {
		return "1=0", nil
	}

	args := make([]any, 0, len(ids))
	placeholders := ""
	for index, id := range ids {
		if index > 0 {
			placeholders += ","
		}
		placeholders += fmt.Sprintf("$%d", index+1)
		args = append(args, id)
	}
	return fmt.Sprintf("%s IN (%s)", column, placeholders), args
}

func (b *Builder) tableExists(ctx context.Context, table string) (bool, error) {
	var exists bool
	err := b.db.QueryRowContext(ctx, `
		SELECT EXISTS (
			SELECT 1
			FROM information_schema.tables
			WHERE table_schema = current_schema() AND table_name = $1
		)
	`, table).Scan(&exists)
	if err != nil {
		return false, err
	}
	return exists, nil
}
