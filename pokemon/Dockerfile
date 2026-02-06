# Build stage
# Align with go.mod toolchain (go1.24.x)
FROM golang:1.24-alpine AS build

WORKDIR /src
RUN apk add --no-cache ca-certificates tzdata

# Ensure module downloads work consistently
ENV CGO_ENABLED=0

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN go build -trimpath -ldflags="-s -w" -o /out/pokemon_data ./cmd/pokemon

# Runtime stage
FROM alpine:3.20

WORKDIR /usr/src/app
RUN apk add --no-cache ca-certificates tzdata \
    && addgroup -S app \
    && adduser -S -G app app

COPY --from=build /out/pokemon_data /usr/local/bin/pokemon_data

# data volume + defaults
RUN mkdir -p /usr/src/app/data \
    && chown -R app:app /usr/src/app/data

USER app

EXPOSE 3001
ENV SQLITE_PATH=/usr/src/app/data/pokego.db
CMD ["pokemon_data"]
