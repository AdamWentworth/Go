FROM golang:1.21 as builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o location_service .

FROM ubuntu:22.04  
# This includes glibc 2.35
WORKDIR /app
COPY --from=builder /app/location_service .

EXPOSE 3007
CMD ["./location_service"]
