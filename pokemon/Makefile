.PHONY: run test test-integration vet

run:
	go run ./cmd/pokemon

test:
	go test ./...

test-integration:
	go test -tags=integration ./...

vet:
	go vet ./...
