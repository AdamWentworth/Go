package main

import (
	"math"
	"testing"
)

func intPtr(v int) *int       { return &v }
func strPtr(v string) *string { return &v }

func TestHaversine(t *testing.T) {
	if got := haversine(0, 0, 0, 0); got != 0 {
		t.Fatalf("expected 0, got %f", got)
	}

	sfToLA := haversine(37.7749, -122.4194, 34.0522, -118.2437)
	if math.Abs(sfToLA-559) > 20 {
		t.Fatalf("unexpected haversine distance: got %.2fkm", sfToLA)
	}
}

func TestInstancesMatch(t *testing.T) {
	base := PokemonInstance{
		PokemonID:      25,
		Shiny:          true,
		Shadow:         false,
		CostumeID:      intPtr(1),
		Gender:         strPtr("Female"),
		LocationCard:   strPtr("11"),
		Dynamax:        true,
		Gigantamax:     false,
		FastMoveID:     intPtr(10),
		ChargedMove1ID: intPtr(20),
		ChargedMove2ID: intPtr(30),
	}

	sameDifferentMoveOrder := base
	sameDifferentMoveOrder.ChargedMove1ID = intPtr(30)
	sameDifferentMoveOrder.ChargedMove2ID = intPtr(20)

	matched, reason := instancesMatch(base, sameDifferentMoveOrder)
	if !matched || reason != "" {
		t.Fatalf("expected match with swapped charged moves, got matched=%v reason=%q", matched, reason)
	}

	diff := base
	diff.PokemonID = 26
	matched, _ = instancesMatch(base, diff)
	if matched {
		t.Fatalf("expected mismatch for different pokemon_id")
	}

	diffCard := base
	diffCard.LocationCard = strPtr("12")
	matched, reason = instancesMatch(base, diffCard)
	if matched || reason != "LocationCard mismatch" {
		t.Fatalf("expected location mismatch, got matched=%v reason=%q", matched, reason)
	}
}
