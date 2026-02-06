.PHONY: run test test-integration vet lint ci govulncheck

run:
	go run ./cmd/pokemon

test:
	go test ./...

test-integration:
	go test -tags=integration ./...

vet:
	go vet ./...

# Lint via golangci-lint v2 (runs staticcheck + govet + many others).
lint:
	golangci-lint run

# Vulnerability scan (Go official).
govulncheck:
	govulncheck ./...

# CI target for local parity with GitHub Actions.
ci: test vet lint govulncheck
