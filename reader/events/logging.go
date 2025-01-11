// logging.go

package main

import (
	"fmt"
	"io"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
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
	switch level {
	case "info":
		levelUpper = "INFO"
	case "error":
		levelUpper = "ERROR"
	case "fatal":
		levelUpper = "FATAL"
	default:
		levelUpper = level
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

// Custom error handler for Fiber
func errorHandler(c *fiber.Ctx, err error) error {
	// Default to 500 Internal Server Error
	code := fiber.StatusInternalServerError

	// Retrieve the custom status code if it's a *fiber.Error
	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
	}

	// Log the error
	logrus.Errorf("Error %d: %v", code, err)

	// Send custom JSON response
	return c.Status(code).JSON(fiber.Map{
		"error": err.Error(),
	})
}

// Custom request logging middleware
func requestLogger(c *fiber.Ctx) error {
	start := time.Now()

	// Proceed with the next handler
	err := c.Next()

	// Calculate the latency
	stop := time.Now()
	latency := stop.Sub(start)

	// Get request details
	ip := c.IP()
	method := c.Method()
	path := c.OriginalURL()
	status := c.Response().StatusCode()

	// Format the log message
	logrus.Infof("%s - %s %s - %d - %dms", ip, method, path, status, latency.Milliseconds())

	return err
}
