package cache

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"net/url"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

const invalidatedVersionPrefix = "!invalidated:"

type RedisPayloadStoreConfig struct {
	URL       string
	KeyPrefix string
}

type RedisPayloadStore struct {
	client *redis.Client
	prefix string
}

func NewRedisPayloadStore(cfg RedisPayloadStoreConfig) (*RedisPayloadStore, error) {
	options, err := redis.ParseURL(strings.TrimSpace(cfg.URL))
	if err != nil {
		return nil, fmt.Errorf("parse Redis URL: %w", err)
	}
	prefix := strings.Trim(strings.TrimSpace(cfg.KeyPrefix), ":")
	if prefix == "" {
		prefix = "pokegonexus:pokemon:v1"
	}
	return &RedisPayloadStore{
		client: redis.NewClient(options),
		prefix: prefix,
	}, nil
}

func (s *RedisPayloadStore) Load(ctx context.Context, cacheName string) (StoredPayload, bool, error) {
	version, found, invalidated, err := s.CurrentVersion(ctx, cacheName)
	if err != nil || !found || invalidated {
		return StoredPayload{}, false, err
	}

	values, err := s.client.HMGet(ctx, s.payloadKey(cacheName, version), "json", "gzip", "etag", "built_at").Result()
	if err != nil {
		return StoredPayload{}, false, err
	}
	if len(values) != 4 || values[0] == nil || values[1] == nil || values[2] == nil || values[3] == nil {
		return StoredPayload{}, false, nil
	}

	builtAt, err := time.Parse(time.RFC3339Nano, redisString(values[3]))
	if err != nil {
		return StoredPayload{}, false, fmt.Errorf("parse cached payload timestamp: %w", err)
	}
	return StoredPayload{
		JSONBytes: []byte(redisString(values[0])),
		GzipBytes: []byte(redisString(values[1])),
		ETag:      redisString(values[2]),
		BuiltAt:   builtAt,
	}, true, nil
}

func (s *RedisPayloadStore) CurrentVersion(ctx context.Context, cacheName string) (string, bool, bool, error) {
	version, err := s.client.Get(ctx, s.currentKey(cacheName)).Result()
	if errors.Is(err, redis.Nil) {
		return "", false, false, nil
	}
	if err != nil {
		return "", false, false, err
	}
	return version, true, strings.HasPrefix(version, invalidatedVersionPrefix), nil
}

func (s *RedisPayloadStore) Save(ctx context.Context, cacheName string, payload StoredPayload, ttl time.Duration) error {
	version := strings.Trim(payload.ETag, `"`)
	if version == "" || len(payload.JSONBytes) == 0 {
		return errors.New("cached payload requires JSON bytes and an ETag")
	}
	if ttl <= 0 {
		ttl = 24 * time.Hour
	}
	if payload.BuiltAt.IsZero() {
		payload.BuiltAt = time.Now().UTC()
	}

	payloadKey := s.payloadKey(cacheName, version)
	_, err := s.client.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
		pipe.HSet(ctx, payloadKey, map[string]any{
			"json":     payload.JSONBytes,
			"gzip":     payload.GzipBytes,
			"etag":     payload.ETag,
			"built_at": payload.BuiltAt.UTC().Format(time.RFC3339Nano),
		})
		pipe.Expire(ctx, payloadKey, ttl)
		pipe.Set(ctx, s.currentKey(cacheName), version, ttl)
		return nil
	})
	return err
}

func (s *RedisPayloadStore) Invalidate(ctx context.Context, cacheName string, ttl time.Duration) error {
	if ttl <= 0 {
		ttl = time.Minute
	}
	token, err := randomToken()
	if err != nil {
		return err
	}
	marker := invalidatedVersionPrefix + token
	return s.client.Set(ctx, s.currentKey(cacheName), marker, ttl).Err()
}

func (s *RedisPayloadStore) AcquireBuildLock(ctx context.Context, cacheName string, ttl time.Duration) (BuildLock, bool, error) {
	if ttl <= 0 {
		ttl = 2 * time.Minute
	}
	token, err := randomToken()
	if err != nil {
		return nil, false, err
	}
	key := s.lockKey(cacheName)
	acquired, err := s.client.SetNX(ctx, key, token, ttl).Result()
	if err != nil || !acquired {
		return nil, acquired, err
	}
	return &redisBuildLock{client: s.client, key: key, token: token}, true, nil
}

func (s *RedisPayloadStore) Ping(ctx context.Context) error {
	return s.client.Ping(ctx).Err()
}

func (s *RedisPayloadStore) Close() error {
	return s.client.Close()
}

func (s *RedisPayloadStore) currentKey(cacheName string) string {
	return s.prefix + ":current:" + url.PathEscape(cacheName)
}

func (s *RedisPayloadStore) payloadKey(cacheName, version string) string {
	return s.prefix + ":payload:" + url.PathEscape(cacheName) + ":" + version
}

func (s *RedisPayloadStore) lockKey(cacheName string) string {
	return s.prefix + ":lock:" + url.PathEscape(cacheName)
}

type redisBuildLock struct {
	client *redis.Client
	key    string
	token  string
}

var releaseLockScript = redis.NewScript(`
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
end
return 0
`)

func (l *redisBuildLock) Release(ctx context.Context) error {
	return releaseLockScript.Run(ctx, l.client, []string{l.key}, l.token).Err()
}

func randomToken() (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("generate cache token: %w", err)
	}
	return hex.EncodeToString(bytes), nil
}

func redisString(value any) string {
	switch typed := value.(type) {
	case string:
		return typed
	case []byte:
		return string(typed)
	default:
		return fmt.Sprint(typed)
	}
}
