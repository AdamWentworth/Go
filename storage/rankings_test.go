package main

import (
	"reflect"
	"testing"
)

func TestNormalizeRankingVariantIDs(t *testing.T) {
	got := normalizeRankingVariantIDs([]string{
		" shiny-pikachu ",
		"",
		"default-bulbasaur",
		"shiny-pikachu",
		"  ",
	})
	want := []string{"default-bulbasaur", "shiny-pikachu"}
	if !reflect.DeepEqual(got, want) {
		t.Fatalf("normalizeRankingVariantIDs() = %#v, want %#v", got, want)
	}
}
