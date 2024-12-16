// models.go

package main

type Country struct {
	ID          int64  `db:"id" json:"id"`
	Name        string `db:"name" json:"name"`
	CountryCode string `db:"country_code" json:"country_code"`
	// Storing centroid like this "0101000020E610000008DC482388F255C0CD311A1F2BEB4F40" boundary as a multipolygon 4326
	Centroid string `db:"centroid" json:"centroid"`
	Boundary string `db:"boundary" json:"boundary"`
}

type Place struct {
	ID              int64   `db:"id" json:"id"`
	Name            string  `db:"name" json:"name"`
	CountryID       int64   `db:"country_id" json:"country_id"`
	Latitude        float64 `db:"latitude" json:"latitude"`
	Longitude       float64 `db:"longitude" json:"longitude"`
	StateOrProvince string  `db:"state_or_province" json:"state_or_province"`
	// Again, boundary as a multipolygon 4326
	Boundary   string `db:"boundary" json:"boundary"`
	OSMID      int64  `db:"osm_id" json:"osm_id"`
	Population int64  `db:"population" json:"population"`
	AdminLevel int64  `db:"admin_level" json:"admin_level"`
}
