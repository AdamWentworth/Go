package main

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"sort"
	"strconv"
	"strings"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"
)

const (
	defaultTradeMatchLimit = 20
	maxTradeMatchLimit     = 50
	tradeMatchScanLimit    = 2000
)

type tradeMatchPokemon struct {
	InstanceID string  `json:"instance_id"`
	VariantID  *string `json:"variant_id,omitempty"`
	PokemonID  int     `json:"pokemon_id"`
	Nickname   *string `json:"nickname,omitempty"`
	CP         *int    `json:"cp,omitempty"`
	Shiny      bool    `json:"shiny"`
	CostumeID  *int    `json:"costume_id,omitempty"`
	Lucky      bool    `json:"lucky"`
	Shadow     bool    `json:"shadow"`
	Dynamax    bool    `json:"dynamax"`
	Gigantamax bool    `json:"gigantamax"`
}

type tradeMatchTrainer struct {
	UserID          string   `json:"user_id"`
	Username        string   `json:"username"`
	DistanceKM      *float64 `json:"distance_km,omitempty"`
	IsFriend        bool     `json:"is_friend"`
	FriendshipLevel *int     `json:"friendship_level,omitempty"`
}

type tradeMatchEligibility struct {
	CanPropose bool     `json:"can_propose"`
	Blockers   []string `json:"blockers"`
}

type tradeMatchCard struct {
	MatchID           string                `json:"match_id"`
	MyOffer           tradeMatchPokemon     `json:"my_offer"`
	MyWanted          tradeMatchPokemon     `json:"my_wanted"`
	TheirOffer        tradeMatchPokemon     `json:"their_offer"`
	TheirWanted       tradeMatchPokemon     `json:"their_wanted"`
	Trainer           tradeMatchTrainer     `json:"trainer"`
	MatchReasons      []string              `json:"match_reasons"`
	IsSpecialTrade    bool                  `json:"is_special_trade"`
	IsRegisteredTrade bool                  `json:"is_registered_trade"`
	Eligibility       tradeMatchEligibility `json:"eligibility"`
	reciprocalScore   int
}

type tradeMatchResponse struct {
	Matches    []tradeMatchCard `json:"matches"`
	NextCursor string           `json:"next_cursor,omitempty"`
}

type tradeMatchCursor struct {
	Offset int `json:"offset"`
}

type tradeMatchCandidate struct {
	PokemonInstance
	Username        string   `gorm:"column:username"`
	UserLatitude    *float64 `gorm:"column:user_latitude"`
	UserLongitude   *float64 `gorm:"column:user_longitude"`
	IsFriend        bool     `gorm:"column:is_friend"`
	FriendshipLevel *int     `gorm:"column:social_friendship_level"`
}

func encodeTradeMatchCursor(offset int) string {
	payload, _ := json.Marshal(tradeMatchCursor{Offset: offset})
	return base64.RawURLEncoding.EncodeToString(payload)
}

func decodeTradeMatchCursor(raw string) (tradeMatchCursor, error) {
	var cursor tradeMatchCursor
	payload, err := base64.RawURLEncoding.DecodeString(raw)
	if err != nil {
		return cursor, err
	}
	if err := json.Unmarshal(payload, &cursor); err != nil || cursor.Offset < 0 {
		return tradeMatchCursor{}, fmt.Errorf("invalid cursor")
	}
	return cursor, nil
}

func tradeMatchPokemonFrom(instance PokemonInstance) tradeMatchPokemon {
	return tradeMatchPokemon{
		InstanceID: instance.InstanceID,
		VariantID:  instance.VariantID,
		PokemonID:  instance.PokemonID,
		Nickname:   instance.Nickname,
		CP:         instance.CP,
		Shiny:      instance.Shiny,
		CostumeID:  instance.CostumeID,
		Lucky:      instance.Lucky,
		Shadow:     instance.Shadow,
		Dynamax:    instance.Dynamax,
		Gigantamax: instance.Gigantamax,
	}
}

func isSpecialTradePair(left, right PokemonInstance) bool {
	return left.Shiny || right.Shiny || left.Shadow || right.Shadow ||
		left.CostumeID != nil || right.CostumeID != nil ||
		left.Registered != right.Registered
}

func matchReason(instance PokemonInstance) string {
	if instance.VariantID != nil && *instance.VariantID != "" {
		return "Matches " + *instance.VariantID
	}
	return "Matches Pokémon #" + strconv.Itoa(instance.PokemonID)
}

func loadOwnMatchInstances(userID string) ([]PokemonInstance, []PokemonInstance, error) {
	var instances []PokemonInstance
	err := db.Where(
		"user_id = ? AND disabled = ? AND (is_for_trade = ? OR is_wanted = ?)",
		userID, false, true, true,
	).Where(`NOT EXISTS (
		SELECT 1 FROM trades t
		WHERE LOWER(t.trade_status) IN ('proposed', 'pending')
		  AND (t.pokemon_instance_id_user_proposed = instances.instance_id
		    OR t.pokemon_instance_id_user_accepting = instances.instance_id)
	)`,
	).Find(&instances).Error
	if err != nil {
		return nil, nil, err
	}

	trade := make([]PokemonInstance, 0)
	wanted := make([]PokemonInstance, 0)
	for _, instance := range instances {
		if instance.IsForTrade {
			trade = append(trade, instance)
		}
		if instance.IsWanted {
			wanted = append(wanted, instance)
		}
	}
	return trade, wanted, nil
}

func filterSourceInstances(
	trade, wanted []PokemonInstance,
	sourceType, sourceInstanceID string,
) ([]PokemonInstance, []PokemonInstance, error) {
	if sourceType == "" && sourceInstanceID == "" {
		return trade, wanted, nil
	}
	if sourceInstanceID == "" || (sourceType != "trade" && sourceType != "wanted") {
		return nil, nil, fmt.Errorf("source_type and source_instance_id must be supplied together")
	}

	source := trade
	if sourceType == "wanted" {
		source = wanted
	}
	for _, instance := range source {
		if instance.InstanceID == sourceInstanceID {
			if sourceType == "trade" {
				return []PokemonInstance{instance}, wanted, nil
			}
			return trade, []PokemonInstance{instance}, nil
		}
	}
	return nil, nil, gorm.ErrRecordNotFound
}

func loadRemoteMatchCandidates(
	userID string,
	friendOnly bool,
	candidateInstanceID string,
) ([]tradeMatchCandidate, error) {
	friendExpr := `EXISTS (
		SELECT 1 FROM friendships f
		WHERE f.status = 'accepted'
		  AND f.user_id_low = LEAST(instances.user_id, ?)
		  AND f.user_id_high = GREATEST(instances.user_id, ?)
	)`

	query := db.Table("instances").
		Select(`instances.*, users.username,
			CASE WHEN users.allow_location AND COALESCE(user_profiles.show_location, 0)
				THEN users.latitude ELSE NULL END AS user_latitude,
			CASE WHEN users.allow_location AND COALESCE(user_profiles.show_location, 0)
				THEN users.longitude ELSE NULL END AS user_longitude,
			`+friendExpr+` AS is_friend,
			instances.friendship_level AS social_friendship_level`,
			userID, userID).
		Joins("JOIN users ON users.user_id = instances.user_id").
		Joins("LEFT JOIN user_profiles ON user_profiles.user_id = instances.user_id").
		Where("instances.user_id <> ?", userID).
		Where("instances.disabled = ? AND (instances.is_for_trade = ? OR instances.is_wanted = ?)", false, true, true).
		Where(`(
			COALESCE(user_profiles.profile_visibility, 'public') = 'public'
			OR (user_profiles.profile_visibility = 'friends' AND `+friendExpr+`)
		)`, userID, userID).
		Where(`(
			COALESCE(user_profiles.collection_visibility, 'public') = 'public'
			OR (user_profiles.collection_visibility = 'friends' AND `+friendExpr+`)
		)`, userID, userID).
		Where(`NOT EXISTS (
			SELECT 1 FROM user_blocks b
			WHERE (b.blocker_user_id = ? AND b.blocked_user_id = instances.user_id)
			   OR (b.blocker_user_id = instances.user_id AND b.blocked_user_id = ?)
		)`, userID, userID).
		Where(`NOT EXISTS (
			SELECT 1 FROM trades t
			WHERE LOWER(t.trade_status) IN ('proposed', 'pending')
			  AND (t.pokemon_instance_id_user_proposed = instances.instance_id
			    OR t.pokemon_instance_id_user_accepting = instances.instance_id)
		)`)

	if friendOnly {
		query = query.Where(friendExpr, userID, userID)
	}
	if candidateInstanceID != "" {
		var candidate PokemonInstance
		if err := db.Where("instance_id = ? AND user_id <> ?", candidateInstanceID, userID).
			First(&candidate).Error; err != nil {
			return nil, err
		}
		query = query.Where("instances.user_id = ?", candidate.UserID)
	}

	var candidates []tradeMatchCandidate
	err := query.Order("instances.user_id, instances.instance_id").
		Limit(tradeMatchScanLimit).
		Scan(&candidates).Error
	return candidates, err
}

func buildTradeMatches(
	ownTrade, ownWanted []PokemonInstance,
	candidates []tradeMatchCandidate,
	latitude, longitude *float64,
	maxDistance *float64,
) []tradeMatchCard {
	type candidateGroup struct {
		trade  []tradeMatchCandidate
		wanted []tradeMatchCandidate
	}
	groups := make(map[string]*candidateGroup)
	for _, candidate := range candidates {
		group := groups[candidate.UserID]
		if group == nil {
			group = &candidateGroup{}
			groups[candidate.UserID] = group
		}
		if candidate.IsForTrade {
			group.trade = append(group.trade, candidate)
		}
		if candidate.IsWanted {
			group.wanted = append(group.wanted, candidate)
		}
	}

	matches := make([]tradeMatchCard, 0)
	seen := make(map[string]struct{})
	excludes := func(raw RawJSON, instanceID string) bool {
		if len(raw) == 0 {
			return false
		}
		var values map[string]bool
		return json.Unmarshal(raw, &values) == nil && values[instanceID]
	}
	for _, group := range groups {
		for _, mine := range ownTrade {
			for _, theirWanted := range group.wanted {
				if matched, _ := instancesMatch(mine, theirWanted.PokemonInstance); !matched {
					continue
				}
				if excludes(mine.NotWantedList, theirWanted.InstanceID) ||
					excludes(theirWanted.NotTradeList, mine.InstanceID) {
					continue
				}
				for _, wanted := range ownWanted {
					for _, theirOffer := range group.trade {
						if matched, _ := instancesMatch(wanted, theirOffer.PokemonInstance); !matched {
							continue
						}
						if excludes(wanted.NotTradeList, theirOffer.InstanceID) ||
							excludes(theirOffer.NotWantedList, wanted.InstanceID) {
							continue
						}

						matchID := strings.Join([]string{
							mine.InstanceID, wanted.InstanceID,
							theirOffer.InstanceID, theirWanted.InstanceID,
						}, ":")
						if _, exists := seen[matchID]; exists {
							continue
						}

						var distance *float64
						if latitude != nil && longitude != nil &&
							theirOffer.UserLatitude != nil && theirOffer.UserLongitude != nil {
							value := haversine(*latitude, *longitude, *theirOffer.UserLatitude, *theirOffer.UserLongitude)
							distance = &value
							if maxDistance != nil && value > *maxDistance {
								continue
							}
						} else if maxDistance != nil {
							continue
						}

						special := isSpecialTradePair(mine, theirOffer.PokemonInstance)
						match := tradeMatchCard{
							MatchID:     matchID,
							MyOffer:     tradeMatchPokemonFrom(mine),
							MyWanted:    tradeMatchPokemonFrom(wanted),
							TheirOffer:  tradeMatchPokemonFrom(theirOffer.PokemonInstance),
							TheirWanted: tradeMatchPokemonFrom(theirWanted.PokemonInstance),
							Trainer: tradeMatchTrainer{
								UserID:          theirOffer.UserID,
								Username:        theirOffer.Username,
								DistanceKM:      distance,
								IsFriend:        theirOffer.IsFriend,
								FriendshipLevel: theirOffer.FriendshipLevel,
							},
							MatchReasons: []string{
								matchReason(theirWanted.PokemonInstance),
								matchReason(wanted),
							},
							IsSpecialTrade:    special,
							IsRegisteredTrade: wanted.Registered && theirWanted.Registered,
							Eligibility: tradeMatchEligibility{
								CanPropose: true,
								Blockers:   []string{},
							},
							reciprocalScore: 2,
						}
						matches = append(matches, match)
						seen[matchID] = struct{}{}
					}
				}
			}
		}
	}

	sort.Slice(matches, func(i, j int) bool {
		if matches[i].Trainer.IsFriend != matches[j].Trainer.IsFriend {
			return matches[i].Trainer.IsFriend
		}
		if matches[i].reciprocalScore != matches[j].reciprocalScore {
			return matches[i].reciprocalScore > matches[j].reciprocalScore
		}
		left, right := matches[i].Trainer.DistanceKM, matches[j].Trainer.DistanceKM
		if left != nil && right != nil && *left != *right {
			return *left < *right
		}
		if left != nil && right == nil {
			return true
		}
		return matches[i].MatchID < matches[j].MatchID
	})
	return matches
}

func TradeMatches(c fiber.Ctx) error {
	userID, _ := c.Locals("user_id").(string)
	if userID == "" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{"error": "Authentication failed"})
	}

	limit := defaultTradeMatchLimit
	if raw := c.Query("limit"); raw != "" {
		value, err := strconv.Atoi(raw)
		if err != nil || value < 1 || value > maxTradeMatchLimit {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "limit must be between 1 and 50"})
		}
		limit = value
	}
	offset := 0
	if raw := c.Query("cursor"); raw != "" {
		cursor, err := decodeTradeMatchCursor(raw)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid cursor"})
		}
		offset = cursor.Offset
	}

	var latitude, longitude, maxDistance *float64
	if raw := c.Query("latitude"); raw != "" {
		value, err := strconv.ParseFloat(raw, 64)
		if err != nil || value < -90 || value > 90 {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid latitude"})
		}
		latitude = &value
	}
	if raw := c.Query("longitude"); raw != "" {
		value, err := strconv.ParseFloat(raw, 64)
		if err != nil || value < -180 || value > 180 {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid longitude"})
		}
		longitude = &value
	}
	if (latitude == nil) != (longitude == nil) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "latitude and longitude must be supplied together"})
	}
	if raw := c.Query("range_km"); raw != "" {
		value, err := strconv.ParseFloat(raw, 64)
		if err != nil || value <= 0 || value > 20000 {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid range_km"})
		}
		maxDistance = &value
	}
	if latitude == nil && longitude == nil {
		var viewer User
		if err := db.Select("latitude", "longitude").Where("user_id = ?", userID).
			First(&viewer).Error; err == nil {
			latitude = viewer.Latitude
			longitude = viewer.Longitude
		}
	}

	ownTrade, ownWanted, err := loadOwnMatchInstances(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to load your trade preferences"})
	}
	ownTrade, ownWanted, err = filterSourceInstances(
		ownTrade, ownWanted, c.Query("source_type"), c.Query("source_instance_id"),
	)
	if err == gorm.ErrRecordNotFound {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Source Pokémon was not found"})
	}
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": err.Error()})
	}

	candidates, err := loadRemoteMatchCandidates(
		userID,
		c.Query("friendship") == "friends",
		c.Query("candidate_instance_id"),
	)
	if err == gorm.ErrRecordNotFound {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"error": "Trade candidate was not found"})
	}
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Failed to load trade candidates"})
	}

	matches := buildTradeMatches(ownTrade, ownWanted, candidates, latitude, longitude, maxDistance)
	if c.Query("special_trade") == "true" {
		specialMatches := make([]tradeMatchCard, 0, len(matches))
		for _, match := range matches {
			if match.IsSpecialTrade {
				specialMatches = append(specialMatches, match)
			}
		}
		matches = specialMatches
	}
	response := tradeMatchResponse{Matches: []tradeMatchCard{}}
	if offset >= len(matches) {
		return c.JSON(response)
	}
	end := offset + limit
	if end > len(matches) {
		end = len(matches)
	}
	response.Matches = matches[offset:end]
	if end < len(matches) {
		response.NextCursor = encodeTradeMatchCursor(end)
	}
	return c.JSON(response)
}
