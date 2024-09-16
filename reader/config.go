// config.go

package main

import (
	"log"
	"os"

	"github.com/spf13/viper"
)

func initConfig() {
	viper.SetConfigName("app_conf")
	viper.AddConfigPath("./config")
	viper.AutomaticEnv()

	if err := viper.ReadInConfig(); err != nil {
		log.Fatalf("Error reading config file, %s", err)
	}

	os.Setenv("JWT_SECRET", viper.GetString("jwt.secret"))
}
