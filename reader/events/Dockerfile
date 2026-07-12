# syntax=docker/dockerfile:1
FROM golang:1.26.5-alpine3.23 AS build

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/events_service .

FROM alpine:3.23
WORKDIR /app

RUN apk add --no-cache ca-certificates tzdata \
    && addgroup -S app \
    && adduser -S -G app app \
    && chown -R app:app /app

COPY --from=build /out/events_service /usr/local/bin/events_service

USER app
EXPOSE 3008

CMD ["events_service"]
