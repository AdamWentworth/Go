FROM golang:1.25-alpine AS builder

WORKDIR /src
RUN apk add --no-cache ca-certificates tzdata
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/location_service .

FROM alpine:3.20
WORKDIR /app
RUN apk add --no-cache ca-certificates tzdata \
    && addgroup -S app \
    && adduser -S -G app app
COPY --from=builder /out/location_service /usr/local/bin/location_service
COPY --from=builder /src/static /app/static
USER app

EXPOSE 3007
ENTRYPOINT ["location_service"]
