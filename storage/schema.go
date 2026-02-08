package main

import (
	"fmt"
	"strings"

	"github.com/sirupsen/logrus"
)

var (
	instanceUnownedColumn = "is_unowned"
	instanceUnownedInvert bool
	instanceColumns       = map[string]bool{}
)

func resolveInstanceUnownedColumn() {
	if err := loadInstanceColumns(); err != nil {
		logrus.Warnf("Could not load instances table columns: %v", err)
	}

	columnName, err := detectInstanceUnownedColumn()
	if err != nil {
		logrus.Warnf("Could not detect instances ownership column, defaulting to %q: %v", instanceUnownedColumn, err)
		return
	}

	if columnName == "is_caught" {
		instanceUnownedColumn = "is_caught"
		instanceUnownedInvert = true
		logrus.Infof("Using instances ownership column %q (inverse semantics of unowned/missing).", instanceUnownedColumn)
		return
	}

	instanceUnownedColumn = columnName
	instanceUnownedInvert = false
	logrus.Infof("Using instances ownership column %q for unowned/missing flag.", instanceUnownedColumn)
}

func detectInstanceUnownedColumn() (string, error) {
	candidates := []string{"is_unowned", "is_missing", "is_caught"}
	for _, candidate := range candidates {
		exists, err := columnExists("instances", candidate)
		if err != nil {
			return "", err
		}
		if exists {
			return candidate, nil
		}
	}
	return "", fmt.Errorf("no ownership indicator column found on instances table (checked is_unowned, is_missing, is_caught)")
}

func columnExists(tableName, columnName string) (bool, error) {
	var count int64
	if err := DB.Raw(
		`SELECT COUNT(*)
		   FROM information_schema.columns
		  WHERE table_schema = DATABASE()
		    AND table_name = ?
		    AND column_name = ?`,
		tableName,
		columnName,
	).Scan(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

func instanceUnownedFieldName() string {
	return instanceUnownedColumn
}

func parseUnownedFlag(payload map[string]interface{}) bool {
	if v, ok := payload["is_unowned"]; ok {
		return parseOptionalBool(v)
	}
	if v, ok := payload["is_missing"]; ok {
		return parseOptionalBool(v)
	}
	if v, ok := payload["is_caught"]; ok {
		return !parseOptionalBool(v)
	}
	if v, ok := payload["is_owned"]; ok {
		return !parseOptionalBool(v)
	}
	return false
}

func setUnownedValue(fields map[string]interface{}, isUnowned bool) {
	if strings.TrimSpace(instanceUnownedColumn) == "" {
		return
	}

	v := isUnowned
	if instanceUnownedInvert {
		v = !isUnowned
	}
	fields[instanceUnownedColumn] = v
}

func loadInstanceColumns() error {
	type row struct {
		ColumnName string `gorm:"column:COLUMN_NAME"`
	}
	var rows []row
	if err := DB.Raw(
		`SELECT COLUMN_NAME
		   FROM information_schema.columns
		  WHERE table_schema = DATABASE()
		    AND table_name = 'instances'`,
	).Scan(&rows).Error; err != nil {
		return err
	}

	next := make(map[string]bool, len(rows))
	for _, r := range rows {
		name := strings.TrimSpace(r.ColumnName)
		if name == "" {
			continue
		}
		next[name] = true
	}
	instanceColumns = next
	return nil
}

func instanceHasColumn(column string) bool {
	return instanceColumns[column]
}

func filterInstanceColumns(fields map[string]interface{}) map[string]interface{} {
	out := make(map[string]interface{}, len(fields))
	for k, v := range fields {
		if instanceHasColumn(k) {
			out[k] = v
		}
	}
	return out
}
