// models.go

package main

import (
	"time"
)

// User mirrors the Django "users" table
type User struct {
	UserID    string  `gorm:"primaryKey;column:user_id"`
	Username  string  `gorm:"unique;column:username"`
	Latitude  float64 `gorm:"column:latitude"`
	Longitude float64 `gorm:"column:longitude"`
}

func (User) TableName() string {
	return "users"
}

// PokemonInstance mirrors the "instances" table
type PokemonInstance struct {
	InstanceID      string `gorm:"primaryKey;column:instance_id"`
	UserID          string
	PokemonID       int
	Nickname        string
	CP              *int
	AttackIV        *int
	DefenseIV       *int
	StaminaIV       *int
	Shiny           bool
	CostumeID       *int
	Lucky           bool
	Shadow          bool
	Purified        bool
	FastMoveID      *int
	ChargedMove1ID  *int
	ChargedMove2ID  *int
	Weight          *float64
	Height          *float64
	Gender          string
	Mirror          bool
	PrefLucky       bool
	Registered      bool
	Favorite        bool
	LocationCard    string
	LocationCaught  string
	FriendshipLevel *int
	DateCaught      *time.Time
	DateAdded       time.Time `gorm:"autoCreateTime"`
	LastUpdate      int64
	IsUnowned       bool
	IsOwned         bool
	IsForTrade      bool
	IsWanted        bool
	NotTradeList    string
	NotWantedList   string
	TraceID         string
	WantedFilters   string
	TradeFilters    string
}

func (PokemonInstance) TableName() string {
	return "instances"
}

// Trade mirrors the "trades" table
// Trade mirrors the "trades" table
type Trade struct {
    TradeID                        string  `gorm:"primaryKey;column:trade_id"`
    UserIDProposed                 string  `gorm:"column:user_id_proposed"`
    UserIDAccepting                string  `gorm:"column:user_id_accepting"`
    PokemonInstanceIDUserProposed  string  `gorm:"column:pokemon_instance_id_user_proposed"`
    PokemonInstanceIDUserAccepting string  `gorm:"column:pokemon_instance_id_user_accepting"`

    TraceID                string     `gorm:"column:trace_id"`
    UsernameProposed       string     `gorm:"column:username_proposed"`
    UsernameAccepting      string     `gorm:"column:username_accepting"`
    TradeStatus            string     `gorm:"column:trade_status"`
    TradeProposalDate      *time.Time `gorm:"column:trade_proposal_date"`
    TradeAcceptedDate      *time.Time `gorm:"column:trade_accepted_date"`
    TradeCompletedDate     *time.Time `gorm:"column:trade_completed_date"`
    TradeCancelledDate     *time.Time `gorm:"column:trade_cancelled_date"`
    TradeCancelledBy       string     `gorm:"column:trade_cancelled_by"`
    IsSpecialTrade         bool       `gorm:"column:is_special_trade"`
    IsRegisteredTrade      bool       `gorm:"column:is_registered_trade"`
    IsLuckyTrade           bool       `gorm:"column:is_lucky_trade"`
    TradeDustCost          *int       `gorm:"column:trade_dust_cost"`
    TradeFriendshipLevel   string     `gorm:"column:trade_friendship_level"`
    User1TradeSatisfaction *int      `gorm:"column:user_1_trade_satisfaction"`
    User2TradeSatisfaction *int      `gorm:"column:user_2_trade_satisfaction"`
}

func (Trade) TableName() string {
    return "trades"
}