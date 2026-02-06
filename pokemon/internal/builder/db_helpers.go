package builder

import (
	"context"
)

func (b *Builder) queryRows(ctx context.Context, q string, args ...any) ([]map[string]any, error) {
	rows, err := b.db.QueryContext(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer func() { _ = rows.Close() }()
	return scanRowsToMaps(rows)
}
