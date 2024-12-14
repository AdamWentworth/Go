func reverseGeocodeHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Parse coordinates from request
		var coords Location
		err := json.NewDecoder(r.Body).Decode(&coords)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// Validation
		if coords.Latitude == 0 || coords.Longitude == 0 {
			http.Error(w, "Invalid coordinates", http.StatusBadRequest)
			return
		}

		// Sequentially search through admin levels and countries
		adminLevels := []int{10, 8, 6, 4}
		var location Location

		// Try admin levels first
		for _, level := range adminLevels {
			sqlQuery := `
				SELECT 
					p.name, 
					p.state_or_province, 
					c.name as country
				FROM 
					places p
				JOIN 
					countries c ON p.country_id = c.id
				WHERE 
					ST_Contains(p.boundary, ST_Point($1, $2)) AND
					p.admin_level = $3
				LIMIT 1
			`

			err = db.QueryRow(
				sqlQuery,
				coords.Longitude,
				coords.Latitude,
				level,
			).Scan(&location.Name, &location.StateOrProvince, &location.Country)

			if err == nil {
				w.Header().Set("Content-Type", "application/json")
				json.NewEncoder(w).Encode(location)
				return
			}
		}

		// If admin levels fail, try country level
		sqlQuery := `
			SELECT 
				c.name as country
			FROM 
				countries c
			WHERE 
				ST_Contains(c.boundary, ST_Point($1, $2))
			LIMIT 1
		`

		err = db.QueryRow(
			sqlQuery,
			coords.Longitude,
			coords.Latitude,
		).Scan(&location.Country)

		if err == nil {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(location)
			return
		}

		// If all fails
		http.Error(w, "Location not found", http.StatusNotFound)
	}
}