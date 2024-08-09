package handlers

import (
	"encoding/json"
	"net/http"

	"location/database"
	"location/models"

	"gorm.io/gorm"
)

func StorePokemonLocation(w http.ResponseWriter, r *http.Request) {
	var pokemonLocation models.PokemonLocation
	if err := json.NewDecoder(r.Body).Decode(&pokemonLocation); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := database.DB.Save(&pokemonLocation).Error; err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func GetPokemonLocation(w http.ResponseWriter, r *http.Request) {
	instanceID := r.URL.Query().Get("instance_id")
	if instanceID == "" {
		http.Error(w, "Missing Pokemon Instance ID", http.StatusBadRequest)
		return
	}

	var pokemonLocation models.PokemonLocation
	if err := database.DB.First(&pokemonLocation, "instance_id = ?", instanceID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			http.Error(w, "Pokemon not found", http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(pokemonLocation)
}
