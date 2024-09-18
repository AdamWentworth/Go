// models.go

package main

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
)

// JSON type to handle JSON fields in GORM
type JSON map[string]interface{}

// Value implements the driver.Valuer interface for JSON to save JSON to the database
func (j JSON) Value() (driver.Value, error) {
	bytes, err := json.Marshal(j)
	if err != nil {
		return nil, err
	}
	return string(bytes), nil
}

// Scan implements the sql.Scanner interface for JSON to retrieve JSON from the database
func (j *JSON) Scan(src interface{}) error {
	if src == nil {
		*j = make(JSON)
		return nil
	}
	switch src := src.(type) {
	case []byte:
		if err := json.Unmarshal(src, j); err != nil {
			return fmt.Errorf("failed to unmarshal JSON: %w", err)
		}
	case string:
		if err := json.Unmarshal([]byte(src), j); err != nil {
			return fmt.Errorf("failed to unmarshal JSON: %w", err)
		}
	default:
		return fmt.Errorf("unsupported type: %T", src)
	}
	return nil
}

// User struct for the users table
type User struct {
	UserID    string   `gorm:"column:user_id;primaryKey" json:"user_id"` // Use correct database column and json field
	Username  string   `gorm:"column:username;unique" json:"username"`
	Latitude  *float64 `gorm:"column:latitude" json:"latitude"`
	Longitude *float64 `gorm:"column:longitude" json:"longitude"`
}

// PokemonInstance struct for the instances table
type PokemonInstance struct {
	InstanceID      string   `gorm:"column:instance_id;primaryKey" json:"instance_id"` // Explicit column name and JSON
	UserID          string   `gorm:"column:user_id" json:"user_id"`
	User            *User    `gorm:"foreignKey:UserID" json:"user,omitempty"`
	PokemonID       int      `gorm:"column:pokemon_id" json:"pokemon_id"`
	Nickname        *string  `gorm:"column:nickname" json:"nickname"`
	CP              *int     `gorm:"column:cp" json:"cp"`
	AttackIV        *int     `gorm:"column:attack_iv" json:"attack_iv"`
	DefenseIV       *int     `gorm:"column:defense_iv" json:"defense_iv"`
	StaminaIV       *int     `gorm:"column:stamina_iv" json:"stamina_iv"`
	Shiny           bool     `gorm:"column:shiny" json:"shiny"`
	CostumeID       *int     `gorm:"column:costume_id" json:"costume_id"`
	Lucky           bool     `gorm:"column:lucky" json:"lucky"`
	Shadow          bool     `gorm:"column:shadow" json:"shadow"`
	Purified        bool     `gorm:"column:purified" json:"purified"`
	FastMoveID      *int     `gorm:"column:fast_move_id" json:"fast_move_id"`
	ChargedMove1ID  *int     `gorm:"column:charged_move1_id" json:"charged_move1_id"`
	ChargedMove2ID  *int     `gorm:"column:charged_move2_id" json:"charged_move2_id"`
	Weight          *float64 `gorm:"column:weight" json:"weight"`
	Height          *float64 `gorm:"column:height" json:"height"`
	Gender          *string  `gorm:"column:gender" json:"gender"`
	Mirror          bool     `gorm:"column:mirror" json:"mirror"`
	PrefLucky       bool     `gorm:"column:pref_lucky" json:"pref_lucky"`
	Registered      bool     `gorm:"column:registered" json:"registered"`
	Favorite        bool     `gorm:"column:favorite" json:"favorite"`
	IsUnowned       bool     `gorm:"column:is_unowned" json:"is_unowned"`
	IsOwned         bool     `gorm:"column:is_owned" json:"is_owned"`
	IsForTrade      bool     `gorm:"column:is_for_trade" json:"is_for_trade"`
	IsWanted        bool     `gorm:"column:is_wanted" json:"is_wanted"`
	NotTradeList    JSON     `gorm:"column:not_trade_list;type:json" json:"not_trade_list"`
	NotWantedList   JSON     `gorm:"column:not_wanted_list;type:json" json:"not_wanted_list"`
	TraceID         *string  `gorm:"column:trace_id" json:"trace_id"`
	LocationCaught  *string  `gorm:"column:location_caught" json:"location_caught"`
	LocationCard    *string  `gorm:"column:location_card" json:"location_card"`
	FriendshipLevel *int     `gorm:"column:friendship_level" json:"friendship_level"`
	LastUpdate      *int64   `gorm:"column:last_update" json:"last_update"`
	DateCaught      *string  `gorm:"column:date_caught" json:"date_caught"`
	DateAdded       *string  `gorm:"column:date_added" json:"date_added"`
	WantedFilters   JSON     `gorm:"column:wanted_filters;type:json" json:"wanted_filters"`
	TradeFilters    JSON     `gorm:"column:trade_filters;type:json" json:"trade_filters"`
}

// TableName sets the name of the table in the database
func (PokemonInstance) TableName() string {
	return "instances" // Correct table name
}
