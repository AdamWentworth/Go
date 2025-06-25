# Dockerfile
FROM golang:1.22-alpine

WORKDIR /app

COPY . .

RUN go build -o receiver_service

# Copy the env file if needed
COPY .env .

CMD ["./receiver_service"]
