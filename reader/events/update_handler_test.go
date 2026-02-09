package main

import (
	"testing"

	"gorm.io/datatypes"
)

func ptrInt(v int) *int             { return &v }
func ptrFloat64(v float64) *float64 { return &v }
func ptrString(v string) *string    { return &v }
func ptrInt64(v int64) *int64       { return &v }

func TestBuildPokemonInstancePayload_CanonicalOwnershipFields(t *testing.T) {
	instance := PokemonInstance{
		InstanceID:    "inst-1",
		PokemonID:     25,
		CP:            ptrInt(500),
		Nickname:      ptrString("Pika"),
		IsCaught:      true,
		IsForTrade:    false,
		IsWanted:      true,
		MostWanted:    true,
		CaughtTags:    datatypes.JSON([]byte(`["favorite"]`)),
		TradeTags:     datatypes.JSON([]byte(`["trade"]`)),
		WantedTags:    datatypes.JSON([]byte(`["wanted"]`)),
		NotTradeList:  datatypes.JSON([]byte(`{"foo":true}`)),
		NotWantedList: datatypes.JSON([]byte(`{"bar":true}`)),
		TradeFilters:  JSON{"iv": "high"},
		WantedFilters: JSON{"cp": "low"},
		Level:         ptrFloat64(23.5),
		LocationCard:  ptrString("Vancouver"),
		LastUpdate:    ptrInt64(1739000000000),
		Crown:         true,
		Dynamax:       true,
		Gigantamax:    false,
		MaxAttack:     ptrString("2"),
		MaxGuard:      ptrString("1"),
		MaxSpirit:     ptrString("0"),
	}

	payload := buildPokemonInstancePayload(instance)

	if got, ok := payload["is_caught"].(bool); !ok || !got {
		t.Fatalf("expected is_caught=true, got %#v", payload["is_caught"])
	}
	if got, ok := payload["is_for_trade"].(bool); !ok || got {
		t.Fatalf("expected is_for_trade=false, got %#v", payload["is_for_trade"])
	}
	if got, ok := payload["is_wanted"].(bool); !ok || !got {
		t.Fatalf("expected is_wanted=true, got %#v", payload["is_wanted"])
	}

	if _, exists := payload["is_unowned"]; exists {
		t.Fatalf("legacy field is_unowned should not be present")
	}
	if _, exists := payload["is_owned"]; exists {
		t.Fatalf("legacy field is_owned should not be present")
	}

	required := []string{"caught_tags", "trade_tags", "wanted_tags", "not_trade_list", "not_wanted_list", "most_wanted", "crown"}
	for _, key := range required {
		if _, ok := payload[key]; !ok {
			t.Fatalf("expected key %q in payload", key)
		}
	}
}
