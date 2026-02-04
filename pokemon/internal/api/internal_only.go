package api

import (
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"net/netip"
	"strings"
)

// cidrGuard holds parsed CIDR prefixes for fast allow checks.
type cidrGuard struct {
	prefixes []netip.Prefix
	log      *slog.Logger
}

// NewCIDRGuard parses CIDR strings (and bare IPs) into a guard.
// Accepted inputs:
//   - "10.0.0.0/8"
//   - "192.168.1.10" (treated as /32)
//   - "fd00::/8"
func NewCIDRGuard(cidrs []string, log *slog.Logger) (*cidrGuard, error) {
	pfx := make([]netip.Prefix, 0, len(cidrs))
	for _, raw := range cidrs {
		s := strings.TrimSpace(raw)
		if s == "" {
			continue
		}
		// Bare IP => convert to host prefix.
		if !strings.Contains(s, "/") {
			addr, err := netip.ParseAddr(s)
			if err != nil {
				return nil, fmt.Errorf("parse ip %q: %w", s, err)
			}
			bits := 32
			if addr.Is6() {
				bits = 128
			}
			pfx = append(pfx, netip.PrefixFrom(addr, bits))
			continue
		}

		pr, err := netip.ParsePrefix(s)
		if err != nil {
			return nil, fmt.Errorf("parse cidr %q: %w", s, err)
		}
		pfx = append(pfx, pr)
	}
	return &cidrGuard{prefixes: pfx, log: log}, nil
}

func (g *cidrGuard) allowed(ipStr string) bool {
	ipStr = strings.TrimSpace(ipStr)
	if ipStr == "" {
		return false
	}

	// If clientIP() accidentally returns "IP:port", strip port.
	if host, _, err := net.SplitHostPort(ipStr); err == nil && host != "" {
		ipStr = host
	}

	addr, err := netip.ParseAddr(ipStr)
	if err != nil {
		return false
	}

	for _, p := range g.prefixes {
		if p.Contains(addr) {
			return true
		}
	}
	return false
}

// InternalOnlyMiddleware blocks requests unless client IP is inside the allowed CIDRs.
// This is a *network* control (no tokens). Use it for /metrics and /internal/*.
// It assumes your reverse proxy sets X-Forwarded-For correctly.
func InternalOnlyMiddleware(g *cidrGuard, ipFn func(*http.Request) string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip := ""
			if ipFn != nil {
				ip = ipFn(r)
			}
			if g.allowed(ip) {
				next.ServeHTTP(w, r)
				return
			}

			if g.log != nil {
				g.log.Warn("blocked internal endpoint", slog.String("path", r.URL.Path), slog.String("ip", ip))
			}
			w.WriteHeader(http.StatusForbidden)
			_, _ = w.Write([]byte("forbidden"))
		})
	}
}
