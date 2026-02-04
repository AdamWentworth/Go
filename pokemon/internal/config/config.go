package config

import (
	"log/slog"
	"os"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	Port              int
	Env               string
	SQLitePath         string
	CachePrewarm       bool
	CacheRefreshToken  string
	CacheBuildTimeout  time.Duration
	AllowedOrigins     []string
	AllowCloudflareSub bool
	LogLevel           slog.Level
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

	return Config{
		Port:              port,
		Env:               env,
		SQLitePath:         sqlitePath,
		CachePrewarm:       cachePrewarm,
		CacheRefreshToken:  cacheToken,
		CacheBuildTimeout:  cacheBuildTimeout,
		AllowedOrigins:     allowed,
		AllowCloudflareSub: allowCF,
		LogLevel:           logLevel,
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
