package main

import (
	"fmt"

	"github.com/sirupsen/logrus"
)

var instanceUnownedColumn = "is_unowned"

func resolveInstanceUnownedColumn() {
	columnName, err := detectInstanceUnownedColumn()
	if err != nil {
		logrus.Warnf("Could not detect instances ownership column, defaulting to %q: %v", instanceUnownedColumn, err)
		return
	}
	instanceUnownedColumn = columnName
	logrus.Infof("Using instances ownership column %q for unowned/missing flag.", instanceUnownedColumn)
}

func detectInstanceUnownedColumn() (string, error) {
	candidates := []string{"is_unowned", "is_missing"}
	for _, candidate := range candidates {
		exists, err := columnExists("instances", candidate)
		if err != nil {
			return "", err
		}
		if exists {
			return candidate, nil
		}
	}
	return "", fmt.Errorf("neither is_unowned nor is_missing exists on instances table")
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
	return false
}
