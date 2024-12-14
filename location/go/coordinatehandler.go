func coordinatesHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Parse location details from request
		var locationRequest Location
		err := json.NewDecoder(r.Body).Decode(&locationRequest)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// Prepare SQL query to find coordinates
		sqlQuery := `
			SELECT 
				latitude, 
				longitude 
			FROM 
				places p
			JOIN 
				countries c ON p.country_id = c.id
			WHERE 
				p.name = $1 AND 
				(p.state_or_province = $2 OR $2 = '') AND
				c.name = $3
			LIMIT 1
		`

		var location Location
		err = db.QueryRow(
			sqlQuery,
			locationRequest.Name,
			locationRequest.StateOrProvince,
			locationRequest.Country,
		).Scan(&location.Latitude, &location.Longitude)

		if err != nil {
			if err == sql.ErrNoRows {
				http.Error(w, "Location not found", http.StatusNotFound)
			} else {
				http.Error(w, err.Error(), http.StatusInternalServerError)
			}
			return
		}

		// Send JSON response
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(location)
	}
}