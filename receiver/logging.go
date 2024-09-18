// logging.go
package main

import (
	"fmt"
	"io"
	"os"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/sirupsen/logrus"
)

// Logger variable accessible throughout the application
var logger = logrus.New()

// CustomFormatter for log messages
type CustomFormatter struct {
	TimestampFormat string
}

func (f *CustomFormatter) Format(entry *logrus.Entry) ([]byte, error) {
	timestamp := entry.Time.Format(f.TimestampFormat)
	level := strings.ToUpper(entry.Level.String())
	message := entry.Message
	line := fmt.Sprintf("%s - %s - %s\n", timestamp, level, message)
	return []byte(line), nil
}

// FilteredWriter filters out unwanted logs from being written to the terminal
type FilteredWriter struct {
	Writer  io.Writer
	Filters []string
}

func (fw *FilteredWriter) Write(p []byte) (n int, err error) {
	s := string(p)
	for _, filter := range fw.Filters {
		if strings.Contains(s, filter) {
			// Don't write to Writer (terminal)
			return len(p), nil
		}
	}
	return fw.Writer.Write(p)
}

// Initialize the logger
func initLogger() {
	// Open the log file
	logFile, err := os.OpenFile("app.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		logger.Fatalf("Failed to open log file: %v", err)
	}

	// Create a filtered writer for the terminal
	filteredWriter := &FilteredWriter{
		Writer: os.Stdout,
		Filters: []string{
			"[Fiber]", // Adjust the filter as necessary
		},
	}

	// Set up writers
	terminalWriter := filteredWriter
	appLogWriter := logFile

	// Set logger output to write to both terminal and app log
	loggerOutput := io.MultiWriter(terminalWriter, appLogWriter)
	logger.SetOutput(loggerOutput)

	// Set the logger's formatter
	logger.SetFormatter(&CustomFormatter{
		TimestampFormat: "2006-01-02 15:04:05",
	})

	// Set the logger's level
	logger.SetLevel(logrus.InfoLevel)
}

// Custom request logger middleware for Fiber
func requestLogger(c *fiber.Ctx) error {
	start := time.Now()
	err := c.Next()
	stop := time.Now()

	// Skip logging for OPTIONS requests
	if c.Method() == "OPTIONS" {
		return err
	}

	latency := stop.Sub(start).Milliseconds()
	method := c.Method()
	path := c.OriginalURL()
	status := c.Response().StatusCode()
	ip := c.IP()

	logger.Infof("%s - %s %s - %d - %dms", ip, method, path, status, latency)
	return err
}

// Recovery middleware for Fiber to handle panics
func recoverMiddleware(c *fiber.Ctx) error {
	defer func() {
		if r := recover(); r != nil {
			logger.Errorf("Panic recovered: %v", r)
			c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"message": "Internal Server Error",
			})
		}
	}()
	return c.Next()
}

// Custom error handler for Fiber
func errorHandler(c *fiber.Ctx, err error) error {
	// Default 500 status code
	code := fiber.StatusInternalServerError

	// Retrieve the custom status code if it's a *fiber.Error
	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
	}

	// Log the error
	logger.Errorf("Error %d: %v", code, err)

	// Send JSON response
	return c.Status(code).JSON(fiber.Map{
		"message": err.Error(),
	})
}
