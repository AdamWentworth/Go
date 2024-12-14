func autocompleteHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Parse query parameter
		query := r.URL.Query().Get("q")

		// Require at least 3 characters for search
		if len(query) < 3 {
			http.Error(w, "Minimum 3 characters required", http.StatusBadRequest)
			return
		}

		// Prepare SQL query for autocomplete
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
				p.name ILIKE $1 OR 
				p.state_or_province ILIKE $1
			LIMIT 10
		`

		// Add % for partial matching
		searchTerm := query + "%"

		// Execute query
		rows, err := db.Query(sqlQuery, searchTerm)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		// Collect results
		var locations []Location
		for rows.Next() {
			var loc Location
			err := rows.Scan(&loc.Name, &loc.StateOrProvince, &loc.Country)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			locations = append(locations, loc)
		}

		// Send JSON response
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(locations)
	}
}