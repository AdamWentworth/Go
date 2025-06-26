# events dockerfile

# syntax=docker/dockerfile:1

# --- Build Stage ---
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Enable Go modules
ENV GO111MODULE=on

# Install git (and curl for debugging, optional)
RUN apk add --no-cache git

# Copy Go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy app source
COPY . .

# Build the app
RUN go build -o events_service .

# --- Runtime Stage ---
FROM alpine:latest

WORKDIR /app

# Install root certs (important for Kafka + MySQL)
RUN apk add --no-cache ca-certificates

# Copy app binary and supporting files
COPY --from=builder /app/events_service .
COPY --from=builder /app/.env .
COPY --from=builder /app/app.log ./app.log
COPY --from=builder /app/config ./config

EXPOSE 3008

CMD ["./events_service"]
