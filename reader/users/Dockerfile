# syntax=docker/dockerfile:1

# Stage 1 - Build
FROM golang:1.22-alpine AS builder

WORKDIR /app

ENV CGO_ENABLED=0 \
    GO111MODULE=on

RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN go build -o users_service .

# Stage 2 - Runtime
FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/users_service .
COPY --from=builder /app/.env .
COPY --from=builder /app/app.log /app/app.log

EXPOSE 3005

CMD ["./users_service"]
