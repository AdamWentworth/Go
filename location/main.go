package main

import (
	"fmt"
	"log"
	"net/http"

	"location/config"
	"location/database"
	"location/handlers"
)

func main() {
	// Load environment variables
	config.LoadConfig()

	// Initialize the database connection
	dsn := config.GetDSN()
	database.Init(dsn)

	// Setup HTTP routes
	http.HandleFunc("/store", handlers.StorePokemonLocation)
	http.HandleFunc("/get", handlers.GetPokemonLocation)

	// Start the server
	port := "3006"
	fmt.Printf("Server is running on port %s...\n", port)
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}
