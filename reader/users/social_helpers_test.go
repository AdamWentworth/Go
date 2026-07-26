package main

import "testing"

func TestCanonicalFriendPairIsOrderIndependent(t *testing.T) {
	low, high := canonicalFriendPair("user-z", "user-a")
	if low != "user-a" || high != "user-z" {
		t.Fatalf("canonicalFriendPair returned %q, %q", low, high)
	}

	reversedLow, reversedHigh := canonicalFriendPair("user-a", "user-z")
	if reversedLow != low || reversedHigh != high {
		t.Fatalf("friend pair changed with input order: %q, %q", reversedLow, reversedHigh)
	}
}

func TestVisibilityAllowsExpectedRelationships(t *testing.T) {
	testCases := []struct {
		name         string
		visibility   string
		relationship string
		allowed      bool
	}{
		{name: "owner always allowed", visibility: "private", relationship: relationshipSelf, allowed: true},
		{name: "public visitor", visibility: "public", relationship: relationshipNone, allowed: true},
		{name: "public blocked trainer", visibility: "public", relationship: relationshipBlocked, allowed: false},
		{name: "friends friend", visibility: "friends", relationship: relationshipFriend, allowed: true},
		{name: "friends stranger", visibility: "friends", relationship: relationshipNone, allowed: false},
		{name: "private friend", visibility: "private", relationship: relationshipFriend, allowed: false},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			if got := visibilityAllows(testCase.visibility, testCase.relationship); got != testCase.allowed {
				t.Fatalf("visibilityAllows(%q, %q) = %t, want %t", testCase.visibility, testCase.relationship, got, testCase.allowed)
			}
		})
	}
}

func TestNormalizeHighlightIDs(t *testing.T) {
	normalized, ok := normalizeHighlightIDs([]string{" first ", "", "second"})
	if !ok || len(normalized) != 2 || normalized[0] != "first" || normalized[1] != "second" {
		t.Fatalf("unexpected normalized highlights: %#v, valid=%t", normalized, ok)
	}

	if _, ok := normalizeHighlightIDs([]string{"same", " same "}); ok {
		t.Fatal("duplicate highlights must be rejected")
	}
	if _, ok := normalizeHighlightIDs([]string{"1", "2", "3", "4", "5", "6", "7"}); ok {
		t.Fatal("more than six highlights must be rejected")
	}
}
