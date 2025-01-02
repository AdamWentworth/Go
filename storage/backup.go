// backup.go

package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

// CreateBackup - runs daily backup
func CreateBackup() {
	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		logrus.Error("DB_NAME environment variable is not set")
		return
	}

	now := time.Now()
	dateStr := now.Format("2006-01-02")
	backupFilename := fmt.Sprintf("user_pokemon_backup_%s.sql", dateStr)

	backupsDir := "backups"
	err := os.MkdirAll(backupsDir, os.ModePerm)
	if err != nil {
		logrus.Errorf("Failed to create backups directory: %v", err)
		return
	}

	backupFilePath := filepath.Join(backupsDir, backupFilename)
	backupFilePath = filepath.ToSlash(backupFilePath) // Ensure forward slashes

	myCnfPath := filepath.Join(".", "my.cnf")
	if _, err := os.Stat(myCnfPath); os.IsNotExist(err) {
		logrus.Errorf("my.cnf file does not exist at path: %s", myCnfPath)
		return
	}

	// Use --result-file option instead of shell redirection
	dumpCmd := fmt.Sprintf("mysqldump --defaults-extra-file=%s %s --result-file=%s",
		escapeShellArg(myCnfPath),
		escapeShellArg(dbName),
		escapeShellArg(backupFilePath))

	logrus.Infof("Executing backup command: %s", dumpCmd)
	if err := runShellCommand(dumpCmd); err != nil {
		logrus.Errorf("Failed to create backup: %v", err)
		return
	}

	logrus.Infof("Backup created successfully: %s", backupFilePath)
	manageRetention()
}

// escapeShellArg safely escapes shell arguments to prevent injection and parsing issues
func escapeShellArg(arg string) string {
	return "'" + strings.ReplaceAll(arg, "'", `'"'"'`) + "'"
}

// runShellCommand executes the given shell command and logs output
func runShellCommand(cmd string) error {
	// Execute the command using /bin/sh
	execCmd := exec.Command("sh", "-c", cmd)
	output, err := execCmd.CombinedOutput()
	if err != nil {
		logrus.Errorf("Command execution failed: %v\nOutput: %s", err, string(output))
		return err
	}

	logrus.Infof("Command output: %s", string(output))
	return nil
}

func manageRetention() {
	dailyRetentionDays := 30
	monthlyRetentionMonths := 12
	yearlyRetentionYears := 5

	backupsDir := "backups"
	now := time.Now()

	files, err := os.ReadDir(backupsDir)
	if err != nil {
		logrus.Errorf("Failed to read backups directory: %v", err)
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
			logrus.Warnf("Filename does not match expected format: %s", name)
			continue
		}

		dateStr := parts[len(parts)-1]
		fileDate, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			logrus.Warnf("Error parsing date from file %s: %v", name, err)
			continue
		}

		isYearly := (fileDate.Month() == time.January && fileDate.Day() == 1)
		isMonthly := (fileDate.Day() == 1 && !isYearly)
		isDaily := (!isYearly && !isMonthly)

		ageDays := int(now.Sub(fileDate).Hours() / 24)
		ageMonths := (now.Year()-fileDate.Year())*12 + int(now.Month()) - int(fileDate.Month())
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
				logrus.Errorf("Failed to delete old backup %s: %v", name, err)
			} else {
				logrus.Infof("Deleted old backup: %s", name)
			}
		} else {
			logrus.Debugf("Retained backup: %s", name)
		}
	}
	logrus.Info("Finished managing backup retention.")
}
