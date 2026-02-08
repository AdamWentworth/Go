package main

import "testing"

func TestSetUnownedValue_Direct(t *testing.T) {
	prevCol := instanceUnownedColumn
	prevInvert := instanceUnownedInvert
	t.Cleanup(func() {
		instanceUnownedColumn = prevCol
		instanceUnownedInvert = prevInvert
	})

	instanceUnownedColumn = "is_unowned"
	instanceUnownedInvert = false

	fields := map[string]interface{}{}
	setUnownedValue(fields, true)

	if got, ok := fields["is_unowned"]; !ok || got != true {
		t.Fatalf("expected is_unowned=true, got %#v", fields)
	}
}

func TestSetUnownedValue_Inverted(t *testing.T) {
	prevCol := instanceUnownedColumn
	prevInvert := instanceUnownedInvert
	t.Cleanup(func() {
		instanceUnownedColumn = prevCol
		instanceUnownedInvert = prevInvert
	})

	instanceUnownedColumn = "is_caught"
	instanceUnownedInvert = true

	fields := map[string]interface{}{}
	setUnownedValue(fields, true)

	if got, ok := fields["is_caught"]; !ok || got != false {
		t.Fatalf("expected is_caught=false for unowned=true, got %#v", fields)
	}
}

func TestFilterInstanceColumns(t *testing.T) {
	prevColumns := instanceColumns
	t.Cleanup(func() { instanceColumns = prevColumns })

	instanceColumns = map[string]bool{
		"instance_id": true,
		"is_caught":   true,
	}

	in := map[string]interface{}{
		"instance_id": "abc",
		"is_caught":   true,
		"is_unowned":  false,
	}
	out := filterInstanceColumns(in)

	if len(out) != 2 {
		t.Fatalf("expected 2 filtered columns, got %d (%#v)", len(out), out)
	}
	if _, ok := out["is_unowned"]; ok {
		t.Fatalf("did not expect unknown column is_unowned in output: %#v", out)
	}
}
