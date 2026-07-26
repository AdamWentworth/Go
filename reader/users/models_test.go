package main

import (
	"encoding/json"
	"reflect"
	"testing"
)

func TestTrainerTitleListDatabaseRoundTrip(t *testing.T) {
	input := TrainerTitleList{"raid-regular", "egg-hatcher"}
	value, err := input.Value()
	if err != nil {
		t.Fatalf("Value: %v", err)
	}

	var output TrainerTitleList
	if err := output.Scan(value); err != nil {
		t.Fatalf("Scan: %v", err)
	}
	if !reflect.DeepEqual(output, input) {
		t.Fatalf("trainer titles changed during round trip: got %#v, want %#v", output, input)
	}

	if err := output.Scan(nil); err != nil {
		t.Fatalf("Scan(nil): %v", err)
	}
	if output == nil || len(output) != 0 {
		t.Fatalf("nil database value must become an empty title list: %#v", output)
	}
}

func TestTrainerTitleListMarshalsNilAsEmptyArray(t *testing.T) {
	bytes, err := json.Marshal(TrainerTitleList(nil))
	if err != nil {
		t.Fatalf("Marshal: %v", err)
	}
	if string(bytes) != "[]" {
		t.Fatalf("nil trainer titles marshaled as %s, want []", bytes)
	}
}
