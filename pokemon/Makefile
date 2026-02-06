.PHONY: run test test-integration vet lint ci govulncheck

run:
	go run ./cmd/pokemon

test:
	go test ./...

test-integration:
	go test -tags=integration ./...

vet:
	go vet ./...

lint:
	golangci-lint run

# Vulnerability scan (Go official).
# Use go run to avoid stale govulncheck binaries built with an older toolchain.
govulncheck:
	go run golang.org/x/vuln/cmd/govulncheck@v1.1.4 ./...

ci: test vet lint govulncheck
