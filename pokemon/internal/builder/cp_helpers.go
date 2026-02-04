package builder

import (
	"context"
	"fmt"
)

type cpPair struct {
	cp40 any
	cp50 any
}

func (b *Builder) getCPBulk(ctx context.Context, table string, idCol string) (map[int]cpPair, error) {
	rows, err := b.queryRows(ctx, fmt.Sprintf(`
SELECT %s AS id, level_id, cp FROM %s
WHERE level_id IN (40,50)
`, idCol, table))
	if err != nil {
		return nil, err
	}
	out := make(map[int]cpPair, 1024)
	for _, r := range rows {
		id := asInt(r["id"])
		p := out[id]
		switch asInt(r["level_id"]) {
		case 40:
			p.cp40 = r["cp"]
		case 50:
			p.cp50 = r["cp"]
		}
		out[id] = p
	}
	return out, nil
}

func (b *Builder) getCP(ctx context.Context, table string, idCol string, id int) (cp40 any, cp50 any, err error) {
	rows, err := b.queryRows(ctx, fmt.Sprintf(`
SELECT level_id, cp FROM %s
WHERE %s = ? AND level_id IN (40,50)
ORDER BY level_id ASC
`, table, idCol), id)
	if err != nil {
		return nil, nil, err
	}
	for _, r := range rows {
		lvl := asInt(r["level_id"])
		if lvl == 40 {
			cp40 = r["cp"]
		} else if lvl == 50 {
			cp50 = r["cp"]
		}
	}
	return cp40, cp50, nil
}
