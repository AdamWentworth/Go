// db.go

package main

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/sirupsen/logrus"
)

func ConnectDB(dsn string) *pgxpool.Pool {
	logrus.Info("Attempting to connect to the database...")
	pool, err := pgxpool.New(context.Background(), dsn)
	if err != nil {
		logrus.Fatalf("Unable to connect to database: %v\n", err)
	}
	logrus.Info("Successfully connected to the database.")
	return pool
}
