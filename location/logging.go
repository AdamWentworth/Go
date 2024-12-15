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

// CustomFormatter is a logrus formatter similar to the Python logging format
type CustomFormatter struct{}

func (f *CustomFormatter) Format(entry *logrus.Entry) ([]byte, error) {
	timestamp := entry.Time.Format("2006-01-02 15:04:05")
	level := entry.Level.String()

	// Uppercase format for log level
	levelUpper := level
	switch level {
	case "info":
		levelUpper = "INFO"
	case "error":
		levelUpper = "ERROR"
	case "fatal":
		levelUpper = "FATAL"
	case "warn":
		levelUpper = "WARN"
	default:
		// For debug, trace, etc. just keep uppercase
		levelUpper = levelUpper
	}

	message := fmt.Sprintf("%s - %s - %s\n", timestamp, levelUpper, entry.Message)
	return []byte(message), nil
}

func initLogging() {
	file, err := os.OpenFile("app.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		fmt.Printf("Failed to open log file: %v", err)
		return
	}

	logrus.SetFormatter(&CustomFormatter{})

	multiWriter := io.MultiWriter(os.Stdout, file)
	logrus.SetOutput(multiWriter)
	logrus.SetLevel(logrus.TraceLevel)
}

// Custom error handler for Fiber
func errorHandler(c *fiber.Ctx, err error) error {
	code := fiber.StatusInternalServerError
	if e, ok := err.(*fiber.Error); ok {
		code = e.Code
	}

	logrus.Errorf("Error %d: %v", code, err)
	return c.Status(code).JSON(fiber.Map{
		"error": err.Error(),
	})
}

// Custom request logging middleware
func requestLogger(c *fiber.Ctx) error {
	start := time.Now()
	err := c.Next()
	stop := time.Now()
	latency := stop.Sub(start)

	ip := c.IP()
	method := c.Method()
	path := c.OriginalURL()
	status := c.Response().StatusCode()

	logMessage := fmt.Sprintf("%s - %s %s - %d - %dms", ip, method, path, status, latency.Milliseconds())
	logrus.Infof(logMessage)
	return err
}
