package main

import "testing"

func TestInstanceSyncCheckpointIsStableAndChangeSensitive(t *testing.T) {
	first := []PokemonInstance{
		{InstanceID: "b", UserID: "user-1", LastUpdate: 20},
		{InstanceID: "a", UserID: "user-1", LastUpdate: 10},
	}
	reordered := []PokemonInstance{
		{InstanceID: "a", UserID: "user-1", LastUpdate: 10},
		{InstanceID: "b", UserID: "user-1", LastUpdate: 20},
	}
	if instanceSyncCheckpoint(first) != instanceSyncCheckpoint(reordered) {
		t.Fatal("checkpoint should not depend on query order")
	}

	updated := []PokemonInstance{
		{InstanceID: "a", UserID: "user-1", LastUpdate: 11},
		{InstanceID: "b", UserID: "user-1", LastUpdate: 20},
	}
	if instanceSyncCheckpoint(first) == instanceSyncCheckpoint(updated) {
		t.Fatal("checkpoint should change when an instance changes")
	}

	deleted := []PokemonInstance{{InstanceID: "a", UserID: "user-1", LastUpdate: 10}}
	if instanceSyncCheckpoint(first) == instanceSyncCheckpoint(deleted) {
		t.Fatal("checkpoint should change when an instance is deleted")
	}
}
