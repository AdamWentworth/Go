package database

import (
	"log"

	"location/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Init(dsn string) {
	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to the database: %v", err)
	}

	// Perform schema migration
	models.AutoMigrate(DB)

	log.Println("Connected to the database and migrated schema successfully!")
}
