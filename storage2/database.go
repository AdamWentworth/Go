// database.go

package main

import (
    "fmt"
    "os"
	
	"github.com/sirupsen/logrus"
    "gorm.io/driver/mysql"
    "gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() error {
    user := os.Getenv("DB_USER")
    pass := os.Getenv("DB_PASSWORD")
    host := os.Getenv("DB_HOSTNAME")
    port := os.Getenv("DB_PORT")
    dbName := os.Getenv("DB_NAME")

    // Data Source Name (DSN) for connecting to the database
    dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
        user, pass, host, port, dbName)

    // Open a database connection
    db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
    if err != nil {
        logrus.Fatalf("failed to connect to db: %v", err)
    }
    DB = db

    logrus.Info("Database connected successfully.")
    return nil
}
