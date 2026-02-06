package api

import (
	"log/slog"
	"net"
	"net/http"
	"net/netip"
	"strings"
)

// IPResolver determines the effective client IP in a way that is safe for making security decisions.
//
// Rule:
// - If TrustedProxyCIDRs is empty or RemoteAddr is NOT within a trusted proxy range: ignore forwarding headers.
// - If RemoteAddr IS within a trusted proxy range: honor X-Forwarded-For (first IP) then X-Real-IP.
//
// This prevents spoofing X-Forwarded-For when the service is reachable directly.
type IPResolver struct {
	trusted *cidrGuard
	log     *slog.Logger
}

func NewIPResolver(trustedProxyCIDRs []string, log *slog.Logger) (*IPResolver, error) {
	var tg *cidrGuard
	if len(trustedProxyCIDRs) > 0 {
		g, err := NewCIDRGuard(trustedProxyCIDRs, log)
		if err != nil {
			return nil, err
		}
		tg = g
	}
	return &IPResolver{trusted: tg, log: log}, nil
}

func (r *IPResolver) ClientIP(req *http.Request) string {
	remote := remoteIP(req)
	if remote == "" {
		remote = "unknown"
	}

	// No trusted proxies configured => do not trust forwarded headers.
	if r == nil || r.trusted == nil {
		return remote
	}

	// Only honor forwarding headers if the immediate peer is a trusted proxy.
	if !r.trusted.allowed(remote) {
		return remote
	}

	if ip := firstForwardedFor(req.Header.Get("X-Forwarded-For")); ip != "" {
		return ip
	}
	if ip := cleanIP(req.Header.Get("X-Real-IP")); ip != "" {
		return ip
	}
	return remote
}

func remoteIP(req *http.Request) string {
	if req == nil {
		return ""
	}
	// RemoteAddr may be "IP:port".
	host, _, err := net.SplitHostPort(strings.TrimSpace(req.RemoteAddr))
	if err == nil && host != "" {
		return host
	}
	// If SplitHostPort failed, maybe it's already an IP.
	return cleanIP(req.RemoteAddr)
}

func firstForwardedFor(xff string) string {
	if xff == "" {
		return ""
	}
	// Take the first IP in the list.
	parts := strings.Split(xff, ",")
	if len(parts) == 0 {
		return ""
	}
	return cleanIP(parts[0])
}

func cleanIP(s string) string {
	s = strings.TrimSpace(s)
	if s == "" {
		return ""
	}
	// Strip any accidental "ip:port".
	if host, _, err := net.SplitHostPort(s); err == nil && host != "" {
		s = host
	}
	// Validate.
	if _, err := netip.ParseAddr(s); err != nil {
		return ""
	}
	return s
}
