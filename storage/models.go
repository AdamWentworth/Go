// models.go

package main

import (
	"time"
)

// User mirrors your "users" table.
type User struct {
	UserID    string  `gorm:"primaryKey;column:user_id"`
	Username  string  `gorm:"unique;column:username"`
	Latitude  float64 `gorm:"column:latitude"`
	Longitude float64 `gorm:"column:longitude"`
}

func (User) TableName() string {
	return "users"
}

// PokemonInstance mirrors the "instances" table.
type PokemonInstance struct {
	InstanceID          string     `gorm:"primaryKey;column:instance_id"`
	UserID              string     `gorm:"column:user_id"`
	VariantID           *string    `gorm:"column:variant_id"`
	PokemonID           int        `gorm:"column:pokemon_id"`
	Nickname            *string    `gorm:"column:nickname"`
	CP                  *int       `gorm:"column:cp"`
	AttackIV            *int       `gorm:"column:attack_iv"`
	DefenseIV           *int       `gorm:"column:defense_iv"`
	StaminaIV           *int       `gorm:"column:stamina_iv"`
	Shiny               bool       `gorm:"column:shiny;default:false"`
	CostumeID           *int       `gorm:"column:costume_id"`
	Lucky               bool       `gorm:"column:lucky;default:false"`
	Shadow              bool       `gorm:"column:shadow;default:false"`
	Purified            bool       `gorm:"column:purified;default:false"`
	FastMoveID          *int       `gorm:"column:fast_move_id"`
	ChargedMove1ID      *int       `gorm:"column:charged_move1_id"`
	ChargedMove2ID      *int       `gorm:"column:charged_move2_id"`
	Pokeball            *string    `gorm:"column:pokeball"`
	Weight              *float64   `gorm:"column:weight"`
	Height              *float64   `gorm:"column:height"`
	Gender              *string    `gorm:"column:gender"`
	Mirror              bool       `gorm:"column:mirror;default:false"`
	PrefLucky           bool       `gorm:"column:pref_lucky;default:false"`
	Registered          bool       `gorm:"column:registered;default:false"`
	Favorite            bool       `gorm:"column:favorite;default:false"`
	LocationCard        *string    `gorm:"column:location_card"`
	LocationCaught      *string    `gorm:"column:location_caught"`
	FriendshipLevel     *int       `gorm:"column:friendship_level"`
	DateCaught          *time.Time `gorm:"column:date_caught"`
	IsTraded            bool       `gorm:"column:is_traded;default:false;not null"`
	TradedDate          *time.Time `gorm:"column:traded_date"`
	OriginalTrainerID   *string    `gorm:"column:original_trainer_id"`
	OriginalTrainerName *string    `gorm:"column:original_trainer_name"`
	DateAdded           time.Time  `gorm:"column:date_added;autoCreateTime"`
	LastUpdate          int64      `gorm:"column:last_update;default:0"`
	IsCaught            bool       `gorm:"column:is_caught;default:false;not null"`
	IsForTrade          bool       `gorm:"column:is_for_trade;default:false;not null"`
	IsWanted            bool       `gorm:"column:is_wanted;default:false;not null"`
	MostWanted          bool       `gorm:"column:most_wanted;default:false;not null"`
	CaughtTags          string     `gorm:"column:caught_tags;type:json;default:'[]'"`
	TradeTags           string     `gorm:"column:trade_tags;type:json;default:'[]'"`
	WantedTags          string     `gorm:"column:wanted_tags;type:json;default:'[]'"`
	NotTradeList        string     `gorm:"column:not_trade_list;type:json;default:'{}'"`
	NotWantedList       string     `gorm:"column:not_wanted_list;type:json;default:'{}'"`
	TraceID             *string    `gorm:"column:trace_id"`
	TradeFilters        *string    `gorm:"column:trade_filters;type:json"`
	WantedFilters       *string    `gorm:"column:wanted_filters;type:json"`
	Mega                bool       `gorm:"column:mega;default:false"`
	MegaForm            *string    `gorm:"column:mega_form"`
	IsMega              bool       `gorm:"column:is_mega;default:false"`
	Level               *float64   `gorm:"column:level"`
	IsFused             bool       `gorm:"column:is_fused;default:false"`
	Fusion              string     `gorm:"column:fusion;type:json;default:'{}'"`
	FusionForm          *string    `gorm:"column:fusion_form"`
	FusedWith           *string    `gorm:"column:fused_with"`
	Disabled            bool       `gorm:"column:disabled;default:false"`
	Dynamax             bool       `gorm:"column:dynamax;default:false"`
	Gigantamax          bool       `gorm:"column:gigantamax;default:false"`
	Crown               bool       `gorm:"column:crown;default:false;not null"`
	MaxAttack           *string    `gorm:"column:max_attack"`
	MaxGuard            *string    `gorm:"column:max_guard"`
	MaxSpirit           *string    `gorm:"column:max_spirit"`
}

func (PokemonInstance) TableName() string {
	return "instances"
}

// Registration mirrors the "registrations" table.
type Registration struct {
	UserID    string `gorm:"column:user_id;primaryKey"`
	VariantID string `gorm:"column:variant_id;primaryKey"`
}

func (Registration) TableName() string {
	return "registrations"
}

// InstanceTag mirrors the "instance_tags" table.
type InstanceTag struct {
	TagID      string    `gorm:"column:tag_id;primaryKey"`
	InstanceID string    `gorm:"column:instance_id;primaryKey"`
	UserID     string    `gorm:"column:user_id"`
	CreatedAt  time.Time `gorm:"column:created_at"`
}

func (InstanceTag) TableName() string {
	return "instance_tags"
}

// Trade mirrors the "trades" table.
type Trade struct {
	TradeID                        string `gorm:"primaryKey;column:trade_id"`
	UserIDProposed                 string `gorm:"column:user_id_proposed"`
	UserIDAccepting                string `gorm:"column:user_id_accepting"`
	PokemonInstanceIDUserProposed  string `gorm:"column:pokemon_instance_id_user_proposed"`
	PokemonInstanceIDUserAccepting string `gorm:"column:pokemon_instance_id_user_accepting"`

	// Nullable fields for handling NULL values
	TraceID                          *string    `gorm:"column:trace_id"`
	UsernameProposed                 string     `gorm:"column:username_proposed"`
	UsernameAccepting                string     `gorm:"column:username_accepting"`
	TradeStatus                      string     `gorm:"column:trade_status"`
	UserProposedCompletionConfirmed  bool       `gorm:"column:user_proposed_completion_confirmed" json:"user_proposed_completion_confirmed"`
	UserAcceptingCompletionConfirmed bool       `gorm:"column:user_accepting_completion_confirmed" json:"user_accepting_completion_confirmed"`
	TradeProposalDate                *time.Time `gorm:"column:trade_proposal_date"`
	TradeAcceptedDate                *time.Time `gorm:"column:trade_accepted_date"`
	TradeCompletedDate               *time.Time `gorm:"column:trade_completed_date"`
	TradeCancelledDate               *time.Time `gorm:"column:trade_cancelled_date"`
	TradeCancelledBy                 *string    `gorm:"column:trade_cancelled_by"`
	IsSpecialTrade                   bool       `gorm:"column:is_special_trade"`
	IsRegisteredTrade                bool       `gorm:"column:is_registered_trade"`
	IsLuckyTrade                     bool       `gorm:"column:is_lucky_trade"`
	TradeDustCost                    *int       `gorm:"column:trade_dust_cost"`
	TradeFriendshipLevel             string     `gorm:"column:trade_friendship_level"`
	User1TradeSatisfaction           bool       `gorm:"column:user_1_trade_satisfaction"`
	User2TradeSatisfaction           bool       `gorm:"column:user_2_trade_satisfaction"`
	LastUpdate                       int64      `gorm:"column:last_update;default:0"`
}

func (Trade) TableName() string {
	return "trades"
}
