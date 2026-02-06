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
		id, ok := asIntOK(r["id"])
		if !ok || id == 0 {
			continue
		}
		p := out[id]

		lvl, ok := asIntOK(r["level_id"])
		if !ok {
			continue
		}
		switch lvl {
		case 40:
			p.cp40 = r["cp"]
		case 50:
			p.cp50 = r["cp"]
		}
		out[id] = p
	}
	return out, nil
}
