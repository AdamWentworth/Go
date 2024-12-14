package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"

	_ "github.com/lib/pq"
)

// Config for database connection
type Config struct {
	Host     string
	Port     int
	User     string
	Password string
	DBName   string
}

// Location represents a generic location
type Location struct {
	Name            string  `json:"name"`
	StateOrProvince string  `json:"state_or_province,omitempty"`
	Country         string  `json:"country,omitempty"`
	Latitude        float64 `json:"latitude,omitempty"`
	Longitude       float64 `json:"longitude,omitempty"`
}

// DatabaseConnection establishes a connection to PostgreSQL
func DatabaseConnection(cfg Config) (*sql.DB, error) {
	connStr := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.DBName)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("error opening database: %v", err)
	}

	err = db.Ping()
	if err != nil {
		return nil, fmt.Errorf("error connecting to the database: %v", err)
	}

	return db, nil
}

func main() {
	// Database configuration - replace with your actual credentials
	config := Config{
		Host:     "localhost",
		Port:     5432,
		User:     "yourusername",
		Password: "yourpassword",
		DBName:   "yourdatabase",
	}

	// Establish database connection
	db, err := DatabaseConnection(config)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Setup routes
	http.HandleFunc("/autocomplete", autocompleteHandler(db))
	http.HandleFunc("/coordinates", coordinatesHandler(db))
	http.HandleFunc("/reverse-geocode", reverseGeocodeHandler(db))

	// Start server
	port := ":8080"
	log.Printf("Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(port, nil))
}
