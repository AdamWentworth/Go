package models

import (
	"gorm.io/gorm"
)

type PokemonLocation struct {
	InstanceID      string          `gorm:"primaryKey"`     // Unique identifier for the Pokémon instance
	Latitude        float64         `gorm:"not null"`       // Latitude of the Pokémon’s location
	Longitude       float64         `gorm:"not null"`       // Longitude of the Pokémon’s location
	PokemonID       int             `gorm:"not null"`       // Pokémon ID to identify the type/species
	Nickname        string          `gorm:"size:255"`       // Optional nickname
	CP              int             `gorm:"null"`           // Combat Power
	AttackIV        int             `gorm:"null"`           // Attack IV
	DefenseIV       int             `gorm:"null"`           // Defense IV
	StaminaIV       int             `gorm:"null"`           // Stamina IV
	Shiny           bool            `gorm:"default:false"`  // Shiny status
	CostumeID       int             `gorm:"null"`           // Costume ID
	Lucky           bool            `gorm:"default:false"`  // Lucky status
	Shadow          bool            `gorm:"default:false"`  // Shadow status
	Purified        bool            `gorm:"default:false"`  // Purified status
	FastMoveID      int             `gorm:"null"`           // Fast Move ID
	ChargedMove1ID  int             `gorm:"null"`           // Charged Move 1 ID
	ChargedMove2ID  int             `gorm:"null"`           // Charged Move 2 ID
	Weight          float64         `gorm:"null"`           // Weight of the Pokémon
	Height          float64         `gorm:"null"`           // Height of the Pokémon
	Gender          string          `gorm:"size:10;null"`   // Gender
	DateCaught      string          `gorm:"type:date;null"` // Date when the Pokémon was caught
	Mirror          bool            `gorm:"default:false"`  // Mirror status
	PrefLucky       bool            `gorm:"default:false"`  // Preferred Lucky status
	Registered      bool            `gorm:"default:false"`  // Registered status
	Favorite        bool            `gorm:"default:false"`  // Favorite status
	LocationCard    string          `gorm:"size:255;null"`  // Location Card
	LocationCaught  string          `gorm:"size:255;null"`  // Location Caught
	FriendshipLevel int             `gorm:"null"`           // Friendship Level
	DateAdded       string          `gorm:"type:timestamp;autoCreateTime"`
	LastUpdate      int64           `gorm:"default:0"`              // Timestamp of the last update
	IsUnowned       bool            `gorm:"default:false"`          // Is Unowned
	IsOwned         bool            `gorm:"default:false"`          // Is Owned
	IsForTrade      bool            `gorm:"default:false"`          // Is For Trade
	IsWanted        bool            `gorm:"default:false"`          // Is Wanted
	NotTradeList    map[string]bool `gorm:"type:json;default:'{}'"` // Not Trade List
	NotWantedList   map[string]bool `gorm:"type:json;default:'{}'"` // Not Wanted List
	TraceID         string          `gorm:"size:255;null"`          // Trace ID
}

func AutoMigrate(db *gorm.DB) {
	db.AutoMigrate(&PokemonLocation{})
}
