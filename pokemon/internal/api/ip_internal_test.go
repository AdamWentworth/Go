package api

import (
	"net/http/httptest"
	"testing"
)

func TestNewCIDRGuard_BareIPAndCIDR(t *testing.T) {
	g, err := NewCIDRGuard([]string{"10.0.0.0/8", "127.0.0.1"}, nil)
	if err != nil {
		t.Fatalf("NewCIDRGuard err: %v", err)
	}
	if !g.allowed("10.1.2.3") {
		t.Fatalf("expected 10.1.2.3 to be allowed")
	}
	if !g.allowed("127.0.0.1:9999") {
		t.Fatalf("expected 127.0.0.1:9999 to be allowed")
	}
	if g.allowed("8.8.8.8") {
		t.Fatalf("did not expect 8.8.8.8 to be allowed")
	}
}

func TestNewCIDRGuard_InvalidInput(t *testing.T) {
	if _, err := NewCIDRGuard([]string{"not-a-cidr"}, nil); err == nil {
		t.Fatalf("expected parse error for invalid cidr")
	}
}

func TestIPResolverTrustedProxyUsesForwardedHeaders(t *testing.T) {
	r, err := NewIPResolver([]string{"127.0.0.0/8"}, nil)
	if err != nil {
		t.Fatalf("NewIPResolver err: %v", err)
	}

	req := httptest.NewRequest("GET", "/", nil)
	req.RemoteAddr = "127.0.0.1:12345"
	req.Header.Set("X-Forwarded-For", "203.0.113.9, 203.0.113.10")

	if got := r.ClientIP(req); got != "203.0.113.9" {
		t.Fatalf("expected first forwarded ip, got %q", got)
	}
}

func TestIPResolverUntrustedRemoteIgnoresForwardedHeaders(t *testing.T) {
	r, err := NewIPResolver([]string{"127.0.0.0/8"}, nil)
	if err != nil {
		t.Fatalf("NewIPResolver err: %v", err)
	}

	req := httptest.NewRequest("GET", "/", nil)
	req.RemoteAddr = "8.8.8.8:12345"
	req.Header.Set("X-Forwarded-For", "203.0.113.9")
	req.Header.Set("X-Real-IP", "203.0.113.10")

	if got := r.ClientIP(req); got != "8.8.8.8" {
		t.Fatalf("expected remote addr ip, got %q", got)
	}
}

func TestIPResolverFallsBackToXRealIP(t *testing.T) {
	r, err := NewIPResolver([]string{"127.0.0.0/8"}, nil)
	if err != nil {
		t.Fatalf("NewIPResolver err: %v", err)
	}

	req := httptest.NewRequest("GET", "/", nil)
	req.RemoteAddr = "127.0.0.1:12345"
	req.Header.Set("X-Real-IP", "203.0.113.22")

	if got := r.ClientIP(req); got != "203.0.113.22" {
		t.Fatalf("expected x-real-ip, got %q", got)
	}
}

func TestCleanIP(t *testing.T) {
	if got := cleanIP(" 203.0.113.1 "); got != "203.0.113.1" {
		t.Fatalf("expected cleaned ip, got %q", got)
	}
	if got := cleanIP("not-an-ip"); got != "" {
		t.Fatalf("expected empty for invalid input, got %q", got)
	}
}
