// backup.go

package main

import (
	"bytes"
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
	dbUser := os.Getenv("DB_USER")
	dbPass := os.Getenv("DB_PASSWORD")
	dbHost := os.Getenv("DB_HOSTNAME")
	dbPort := os.Getenv("DB_PORT")
	dbName := os.Getenv("DB_NAME")
	if dbUser == "" || dbPass == "" || dbHost == "" || dbPort == "" || dbName == "" {
		logrus.Error("database backup skipped: DB_USER/DB_PASSWORD/DB_HOSTNAME/DB_PORT/DB_NAME must all be set")
		return
	}

	dumpBinary, err := findDumpBinary()
	if err != nil {
		logrus.Errorf("database backup skipped: %v", err)
		return
	}

	now := time.Now()
	dateStr := now.Format("2006-01-02")
	backupFilename := fmt.Sprintf("user_pokemon_backup_%s.sql", dateStr)

	backupsDir := "backups"
	err = os.MkdirAll(backupsDir, os.ModePerm)
	if err != nil {
		logrus.Errorf("Failed to create backups directory: %v", err)
		return
	}

	backupFilePath := filepath.ToSlash(filepath.Join(backupsDir, backupFilename)) // Ensure forward slashes
	tmpBackupFilePath := backupFilePath + ".tmp"

	if err := createMySQLDump(dumpBinary, dbUser, dbPass, dbHost, dbPort, dbName, tmpBackupFilePath); err != nil {
		logrus.Errorf("Failed to create backup: %v", err)
		return
	}
	if err := os.Rename(tmpBackupFilePath, backupFilePath); err != nil {
		_ = os.Remove(tmpBackupFilePath)
		logrus.Errorf("Failed to finalize backup file: %v", err)
		return
	}

	logrus.Infof("Backup created successfully: %s", backupFilePath)
	manageRetention()
}

func findDumpBinary() (string, error) {
	for _, candidate := range []string{"mysqldump", "mariadb-dump"} {
		if path, err := exec.LookPath(candidate); err == nil {
			return path, nil
		}
	}
	return "", fmt.Errorf("mysqldump/mariadb-dump not found in PATH")
}

func createMySQLDump(
	dumpBinary string,
	dbUser string,
	dbPass string,
	dbHost string,
	dbPort string,
	dbName string,
	targetPath string,
) error {
	outFile, err := os.Create(targetPath)
	if err != nil {
		return err
	}
	defer outFile.Close()

	args := []string{
		"--user=" + dbUser,
		"--host=" + dbHost,
		"--port=" + dbPort,
		"--single-transaction",
		"--quick",
		"--no-tablespaces",
		dbName,
	}
	cmd := exec.Command(dumpBinary, args...)
	cmd.Stdout = outFile

	var stderr bytes.Buffer
	cmd.Stderr = &stderr
	cmd.Env = append(os.Environ(), "MYSQL_PWD="+dbPass)

	if err := cmd.Run(); err != nil {
		_ = os.Remove(targetPath)
		if stderr.Len() > 0 {
			logrus.Errorf("Dump command stderr: %s", stderr.String())
		}
		return err
	}

	if stderr.Len() > 0 {
		logrus.Warnf("Dump command stderr: %s", stderr.String())
	}
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
