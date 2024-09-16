// logging.go

package main

import (
	"fmt"
	"os"

	"github.com/sirupsen/logrus"
)

// CustomFormatter is a logrus formatter that mimics the Python logging format
type CustomFormatter struct{}

// Format builds the log message in the desired format
func (f *CustomFormatter) Format(entry *logrus.Entry) ([]byte, error) {
	timestamp := entry.Time.Format("2006-01-02 15:04:05")
	level := entry.Level.String()

	// Use the uppercase format for the log level
	levelUpper := level
	if level == "info" {
		levelUpper = "INFO"
	} else if level == "error" {
		levelUpper = "ERROR"
	}

	// Construct the log message to match the Python format
	message := fmt.Sprintf("%s - %s - %s\n", timestamp, levelUpper, entry.Message)
	return []byte(message), nil
}

func initLogging() {
	// Set the custom formatter
	logrus.SetFormatter(&CustomFormatter{})

	// Set the output to standard out
	logrus.SetOutput(os.Stdout)

	// Set log level
	logLevel, err := logrus.ParseLevel(os.Getenv("LOG_LEVEL"))
	if err != nil {
		logLevel = logrus.InfoLevel
	}
	logrus.SetLevel(logLevel)
}
