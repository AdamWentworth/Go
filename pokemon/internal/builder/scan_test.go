package builder

import "testing"

func TestLegacyScalarWireValue(t *testing.T) {
	t.Parallel()

	if got, ok := legacyScalarWireValue("apex", "1"); !ok || got != int64(1) {
		t.Fatalf("legacyScalarWireValue(apex, 1) = %#v, %v", got, ok)
	}
	if got, ok := legacyScalarWireValue("apex", ""); !ok || got != "" {
		t.Fatalf("legacyScalarWireValue(apex, empty) = %#v, %v", got, ok)
	}
	if got, ok := legacyScalarWireValue("name", "1"); ok || got != nil {
		t.Fatalf("legacyScalarWireValue(name, 1) = %#v, %v", got, ok)
	}
}
