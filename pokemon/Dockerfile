# Build stage
FROM golang:1.23-alpine AS build

WORKDIR /src
RUN apk add --no-cache ca-certificates tzdata

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/pokemon_data ./cmd/pokemon

# Runtime stage
FROM alpine:3.20

WORKDIR /usr/src/app
RUN apk add --no-cache ca-certificates tzdata

COPY --from=build /out/pokemon_data /usr/local/bin/pokemon_data

# data volume + defaults
RUN mkdir -p /usr/src/app/data

EXPOSE 3001
ENV SQLITE_PATH=/usr/src/app/data/pokego.db
CMD ["pokemon_data"]
