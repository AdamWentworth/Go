# Dockerfile
FROM golang:1.22-alpine

WORKDIR /app

# Copy Go modules first to cache better
COPY go.mod go.sum ./
RUN go mod download

# Copy rest of the source
COPY . .

# Build the binary
RUN go build -o storage_service

# Copy environment config
COPY .env .

CMD ["./storage_service"]
