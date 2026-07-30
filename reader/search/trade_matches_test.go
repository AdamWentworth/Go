package main

import "testing"

func testMatchInstance(id, userID string, pokemonID int) PokemonInstance {
	variantID := "variant-" + id
	return PokemonInstance{
		InstanceID: id, VariantID: &variantID, UserID: userID,
		PokemonID: pokemonID, IsCaught: true,
	}
}

func TestTradeMatchCursorRoundTrip(t *testing.T) {
	raw := encodeTradeMatchCursor(42)
	cursor, err := decodeTradeMatchCursor(raw)
	if err != nil || cursor.Offset != 42 {
		t.Fatalf("cursor round trip = %#v, %v", cursor, err)
	}
	if _, err := decodeTradeMatchCursor("not-a-cursor"); err == nil {
		t.Fatal("malformed cursor was accepted")
	}
}

func TestFilterSourceInstances(t *testing.T) {
	trade := []PokemonInstance{testMatchInstance("mine-trade", "me", 25)}
	wanted := []PokemonInstance{testMatchInstance("mine-wanted", "me", 150)}
	filteredTrade, filteredWanted, err := filterSourceInstances(
		trade, wanted, "trade", "mine-trade",
	)
	if err != nil || len(filteredTrade) != 1 || len(filteredWanted) != 1 {
		t.Fatalf("unexpected source filter result: %#v %#v %v", filteredTrade, filteredWanted, err)
	}
	if _, _, err := filterSourceInstances(trade, wanted, "trade", "missing"); err == nil {
		t.Fatal("missing source instance was accepted")
	}
}

func TestBuildTradeMatchesRanksFriends(t *testing.T) {
	ownTrade := []PokemonInstance{testMatchInstance("my-pika", "me", 25)}
	ownWanted := []PokemonInstance{testMatchInstance("my-mewtwo-want", "me", 150)}
	makeCandidate := func(user, name, id string, pokemonID int, trade, wanted, friend bool) tradeMatchCandidate {
		return tradeMatchCandidate{
			PokemonInstance: PokemonInstance{
				InstanceID: id, UserID: user, PokemonID: pokemonID,
				IsCaught: true, IsForTrade: trade, IsWanted: wanted,
			},
			Username: name, IsFriend: friend,
		}
	}
	candidates := []tradeMatchCandidate{
		makeCandidate("stranger", "Stranger", "stranger-wants-pika", 25, false, true, false),
		makeCandidate("stranger", "Stranger", "stranger-offers-mewtwo", 150, true, false, false),
		makeCandidate("friend", "Friend", "friend-wants-pika", 25, false, true, true),
		makeCandidate("friend", "Friend", "friend-offers-mewtwo", 150, true, false, true),
	}

	matches := buildTradeMatches(ownTrade, ownWanted, candidates, nil, nil, nil)
	if len(matches) != 2 {
		t.Fatalf("matches = %d; want 2", len(matches))
	}
	if matches[0].Trainer.Username != "Friend" || !matches[0].Trainer.IsFriend {
		t.Fatalf("friend was not ranked first: %#v", matches[0].Trainer)
	}
	if matches[0].MyOffer.InstanceID != "my-pika" ||
		matches[0].TheirOffer.InstanceID != "friend-offers-mewtwo" {
		t.Fatalf("wrong reciprocal pair: %#v", matches[0])
	}
}
