// logging.go

package main

import (
	"fmt"
	"os"
	"strings"

	"github.com/sirupsen/logrus"
)

// CustomFormatter gives us "YYYY-MM-DD HH:MM:SS - LEVEL - message"
type CustomFormatter struct{}

// Format implements the logrus.Formatter interface
func (f *CustomFormatter) Format(entry *logrus.Entry) ([]byte, error) {
	timestamp := entry.Time.Format("2006-01-02 15:04:05")
	level := strings.ToUpper(entry.Level.String())
	return []byte(fmt.Sprintf("%s - %s - %s\n", timestamp, level, entry.Message)), nil
}

// Optional SQL filter hook
type SQLFilterHook struct{}

// Levels defines on which levels the hook triggers
func (h *SQLFilterHook) Levels() []logrus.Level {
	return logrus.AllLevels
}

// Fire is called when a log event is fired
func (h *SQLFilterHook) Fire(entry *logrus.Entry) error {
	sqlKeywords := []string{"SELECT", "UPDATE", "DELETE", "INSERT", "BEGIN", "COMMIT"}
	msgUpper := strings.ToUpper(entry.Message)
	for _, kw := range sqlKeywords {
		if strings.Contains(msgUpper, kw) {
			// For example, just log an extra warning or do nothing special:
			// logrus.Warnf("Filtered SQL-related log: %s", entry.Message)
			break
		}
	}
	return nil
}

// InitLogger sets a single output (stdout), a single custom format, and Info level
func InitLogger() error {
	// Use our custom formatter
	logrus.SetFormatter(&CustomFormatter{})

	// Send all logs to stdout
	logrus.SetOutput(os.Stdout)

	// Set global log level to INFO (or whatever you want)
	logrus.SetLevel(logrus.InfoLevel)

	// Optionally add the SQL filter (comment out if not needed)
	// logrus.AddHook(&SQLFilterHook{})

	return nil
}
