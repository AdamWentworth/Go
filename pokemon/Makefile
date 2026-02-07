.PHONY: run test test-integration slo-gate coverage-gates vet lint ci govulncheck

run:
	go run ./cmd/pokemon

test:
	go test ./...

test-integration:
	go test -tags=integration ./...

slo-gate:
	go test -count=1 ./internal/api -run TestPokemonPokemons_WarmCacheSLO -v

coverage-gates:
	go test -count=1 -coverprofile coverage_api.out ./internal/api
	go test -count=1 -coverprofile coverage_cache.out ./internal/cache
	go test -count=1 -tags=integration -coverprofile coverage_builder_int.out ./internal/builder
	@api_cov=$$(go tool cover -func=coverage_api.out | awk '/^total:/ {gsub("%","",$$3); print $$3}'); \
	cache_cov=$$(go tool cover -func=coverage_cache.out | awk '/^total:/ {gsub("%","",$$3); print $$3}'); \
	builder_cov=$$(go tool cover -func=coverage_builder_int.out | awk '/^total:/ {gsub("%","",$$3); print $$3}'); \
	echo "api coverage: $${api_cov}% (min 80%)"; \
	echo "cache coverage: $${cache_cov}% (min 70%)"; \
	echo "builder integration coverage: $${builder_cov}% (min 82%)"; \
	awk -v cov="$$api_cov" 'BEGIN { if (cov+0 < 80) exit 1 }'; \
	awk -v cov="$$cache_cov" 'BEGIN { if (cov+0 < 70) exit 1 }'; \
	awk -v cov="$$builder_cov" 'BEGIN { if (cov+0 < 82) exit 1 }'
	rm -f coverage_api.out coverage_cache.out coverage_builder_int.out

vet:
	go vet ./...

lint:
	golangci-lint run

# Vulnerability scan (Go official).
# Use go run to avoid stale govulncheck binaries built with an older toolchain.
govulncheck:
	go run golang.org/x/vuln/cmd/govulncheck@v1.1.4 ./...

ci: test test-integration slo-gate coverage-gates vet lint govulncheck
