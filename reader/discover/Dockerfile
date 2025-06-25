# syntax=docker/dockerfile:1

FROM golang:1.22-alpine AS builder

WORKDIR /app

# Enable Go modules
ENV GO111MODULE=on

# Install git and other dependencies (for private modules if needed)
RUN apk add --no-cache git

# Copy go mod files and download deps
COPY go.mod go.sum ./
RUN go mod download

# Copy the rest of the app source
COPY . .

# Build the Go binary
RUN go build -o discover_service .

# Final image
FROM alpine:latest

WORKDIR /app

# Copy the binary from builder
COPY --from=builder /app/discover_service .

# Copy any config files needed at runtime
COPY --from=builder /app/.env .

COPY --from=builder /app/app.log /app/app.log

# Expose the port the app listens on
EXPOSE 3006

# Start the service
CMD ["./discover_service"]
