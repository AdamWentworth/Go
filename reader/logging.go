// logging.go

package main

import (
	"fmt"
	"io"
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
	} else if level == "fatal" {
		levelUpper = "FATAL"
	}

	// Construct the log message to match the Python format
	message := fmt.Sprintf("%s - %s - %s\n", timestamp, levelUpper, entry.Message)
	return []byte(message), nil
}

func initLogging() {
	// Open the log file in append mode, create if it doesn't exist
	file, err := os.OpenFile("app.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		fmt.Printf("Failed to open log file: %v", err)
		return
	}

	// Set the custom formatter
	logrus.SetFormatter(&CustomFormatter{})

	// MultiWriter to log to both the file and stdout
	multiWriter := io.MultiWriter(os.Stdout, file)

	// Set the output to both standard out and the log file
	logrus.SetOutput(multiWriter)

	// Set the log level to capture everything for app.log
	logrus.SetLevel(logrus.TraceLevel)
}
