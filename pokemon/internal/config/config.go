package config

import (
	"log/slog"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	Port               int
	Env                string
	SQLitePath         string
	CachePrewarm       bool
	CacheRefreshToken  string
	CacheBuildTimeout  time.Duration
	AllowedOrigins     []string
	AllowCloudflareSub bool
	LogLevel           slog.Level

	// Rate limiting (per-client, in-process) for the heavy endpoint.
	RateLimitEnabled bool
	RateLimitRPS     float64
	RateLimitBurst   int

	// Internal-only endpoints (/metrics and /internal/*) guarded by CIDR allowlist.
	// This is intentionally "simple + local" so you can roll it out across services easily.
	InternalOnlyEnabled bool
	InternalOnlyCIDRs   []string

	// Trusted proxy ranges (CIDRs) used to decide whether to trust X-Forwarded-For / X-Real-IP.
	// If empty, forwarded headers are ignored and RemoteAddr is used as the client IP.
	// Example (local reverse proxy): "127.0.0.0/8"
	// Example (VPC/LB): your load balancer/proxy subnet CIDRs
	TrustedProxyCIDRs []string
}

func Load() Config {
	port := getInt("PORT", 3001)
	env := getString("NODE_ENV", getString("ENV", "production"))

	sqlitePath := getString("SQLITE_PATH", "./data/pokego.db")

	cachePrewarm := getBool("CACHE_PREWARM", true)
	cacheToken := getString("CACHE_REFRESH_TOKEN", "")
	cacheBuildTimeout := getDuration("CACHE_BUILD_TIMEOUT", 60*time.Second)

	origins := getString("ALLOWED_ORIGINS", "http://localhost:3000,https://pokemongonexus.com,https://www.pokemongonexus.com")
	allowed := splitCSV(origins)

	allowCF := getBool("ALLOW_CLOUDFLARE_SUBDOMAINS", true)

	logLevel := parseLogLevel(getString("LOG_LEVEL", "INFO"))

	rlEnabled := getBool("RATE_LIMIT_ENABLED", env == "production")
	rlRPS := getFloat("RATE_LIMIT_RPS", 5.0)
	rlBurst := getInt("RATE_LIMIT_BURST", 10)

	// Default: enabled in production, disabled elsewhere.
	internalOnlyEnabled := getBool("INTERNAL_ONLY_ENABLED", env == "production")

	// Default CIDRs allow:
	// - loopback
	// - RFC1918 private IPv4 ranges (includes docker bridge ranges)
	// - IPv6 ULA (fd00::/8)
	internalCIDRs := splitCSV(getString("INTERNAL_ONLY_CIDRS", "127.0.0.0/8,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,::1/128,fd00::/8"))

	// IMPORTANT: empty by default; forwarded headers are unsafe unless you explicitly
	// define which peers are trusted proxies.
	trustedProxyCIDRs := splitCSV(getString("TRUSTED_PROXY_CIDRS", ""))

	return Config{
		Port:                port,
		Env:                 env,
		SQLitePath:          sqlitePath,
		CachePrewarm:        cachePrewarm,
		CacheRefreshToken:   cacheToken,
		CacheBuildTimeout:   cacheBuildTimeout,
		AllowedOrigins:      allowed,
		AllowCloudflareSub:  allowCF,
		LogLevel:            logLevel,
		RateLimitEnabled:    rlEnabled,
		RateLimitRPS:        rlRPS,
		RateLimitBurst:      rlBurst,
		InternalOnlyEnabled: internalOnlyEnabled,
		InternalOnlyCIDRs:   internalCIDRs,
		TrustedProxyCIDRs:   trustedProxyCIDRs,
	}
}

func splitCSV(s string) []string {
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			out = append(out, p)
		}
	}
	return out
}

func getString(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func getInt(key string, def int) int {
	v := os.Getenv(key)
	if v == "" {
		return def
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return def
	}
	return n
}

func getFloat(key string, def float64) float64 {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return def
	}
	f, err := strconv.ParseFloat(v, 64)
	if err != nil {
		return def
	}
	return f
}

func getBool(key string, def bool) bool {
	v := strings.TrimSpace(strings.ToLower(os.Getenv(key)))
	if v == "" {
		return def
	}
	switch v {
	case "1", "true", "yes", "y", "on":
		return true
	case "0", "false", "no", "n", "off":
		return false
	default:
		return def
	}
}

func getDuration(key string, def time.Duration) time.Duration {
	v := os.Getenv(key)
	if v == "" {
		return def
	}
	d, err := time.ParseDuration(v)
	if err != nil {
		return def
	}
	return d
}

func parseLogLevel(s string) slog.Level {
	switch strings.ToUpper(strings.TrimSpace(s)) {
	case "DEBUG":
		return slog.LevelDebug
	case "WARN", "WARNING":
		return slog.LevelWarn
	case "ERROR":
		return slog.LevelError
	default:
		return slog.LevelInfo
	}
}
