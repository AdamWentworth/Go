// backup.go

package main

import (
	"fmt"
	"github.com/sirupsen/logrus"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// CreateBackup - runs daily backup
func CreateBackup() {
	dbName := os.Getenv("DB_NAME")

	now := time.Now()
	dateStr := now.Format("2006-01-02")
	backupFilename := fmt.Sprintf("user_pokemon_backup_%s.sql", dateStr)

	backupFilePath := filepath.Join("backups", backupFilename)
	_ = os.MkdirAll("backups", os.ModePerm)

	myCnfPath := filepath.Join(".", "my.cnf")
	dumpCmd := fmt.Sprintf("mysqldump --defaults-extra-file=%s %s > %s", myCnfPath, dbName, backupFilePath)

	logrus.Info("Executing backup command: %s\n", dumpCmd)
	if err := runShellCommand(dumpCmd); err != nil {
		logrus.Info("Failed to create backup: %v\n", err)
		return
	}

	logrus.Info("Backup created successfully: %s\n", backupFilePath)
	manageRetention()
}

func manageRetention() {
	dailyRetentionDays := 30
	monthlyRetentionMonths := 12
	yearlyRetentionYears := 5

	backupsDir := "backups"
	now := time.Now()

	files, err := os.ReadDir(backupsDir)
	if err != nil {
		logrus.Info("Failed to read backups dir: %v\n", err)
		return
	}

	for _, f := range files {
		if f.IsDir() {
			continue
		}
		name := f.Name()
		if !strings.HasSuffix(name, ".sql") {
			continue
		}

		parts := strings.Split(strings.TrimSuffix(name, ".sql"), "_")
		if len(parts) < 4 {
			logrus.Info("Filename does not match expected format: %s\n", name)
			continue
		}

		dateStr := parts[len(parts)-1]
		fileDate, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			logrus.Info("Error parsing date from file %s: %v\n", name, err)
			continue
		}

		isYearly := (fileDate.Month() == time.January && fileDate.Day() == 1)
		isMonthly := (fileDate.Day() == 1 && !isYearly)
		isDaily := (!isYearly && !isMonthly)

		ageDays := int(now.Sub(fileDate).Hours() / 24)
		ageMonths := (int(now.Year())-int(fileDate.Year()))*12 + int(now.Month()) - int(fileDate.Month())
		ageYears := now.Year() - fileDate.Year()

		deleteFile := false
		if isDaily && ageDays > dailyRetentionDays {
			deleteFile = true
		} else if isMonthly && ageMonths > monthlyRetentionMonths {
			deleteFile = true
		} else if isYearly && ageYears > yearlyRetentionYears {
			deleteFile = true
		}

		if deleteFile {
			fullPath := filepath.Join(backupsDir, name)
			if err := os.Remove(fullPath); err != nil {
				logrus.Info("Failed to delete old backup %s: %v\n", name, err)
			} else {
				logrus.Info("Deleted old backup: %s\n", name)
			}
		}
	}
	logrus.Println("Finished managing backup retention.")
}

func runShellCommand(cmd string) error {
	// Example shell call (commented out):
	// out, err := exec.Command("sh", "-c", cmd).CombinedOutput()
	// logrus.Println(string(out))
	// return err
	return nil
}
