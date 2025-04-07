# 🦉 Kafka Microservice — Pokémon Go Nexus

This service provides a lightweight Kafka + Zookeeper setup using Docker, used for asynchronous event handling — especially batched Pokémon ownership updates.

---

## 📦 Overview

Kafka helps facilitate:

- Batched Pokémon data updates
- Efficient inter-service event syncing
- Potential pub-sub expansion in the microservice ecosystem

---

## 🚀 Quick Start

### 1. Set environment variable

Create a `.env` file in the `kafka/` directory with the following:

```env
HOST_IP=127.0.0.1
```

> Replace with your actual IP if needed to expose Kafka to external services.

---

### 2. Start Kafka + Zookeeper

```bash
docker-compose up -d
```

This launches:
- **Zookeeper** on port `2181`
- **Kafka Broker** on ports `9092` (internal) and `9093` (external)

Kafka is set up to automatically create the topic `batchedUpdates` with 1 partition and 1 replica.

---

## 🧱 docker-compose.yml

```yaml
version: '3.8'
services:
  zookeeper:
    image: wurstmeister/zookeeper
    ports:
      - "2181:2181"
    volumes:
      - ./data/zookeeper:/opt/zookeeper-3.4.13/data

  kafka:
    image: wurstmeister/kafka
    ports:
      - "9092:9092"
      - "9093:9093"
    environment:
      KAFKA_CREATE_TOPICS: "batchedUpdates:1:1"
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT_INTERNAL://kafka:9092,PLAINTEXT_EXTERNAL://${HOST_IP}:9093
      KAFKA_LISTENERS: PLAINTEXT_INTERNAL://0.0.0.0:9092,PLAINTEXT_EXTERNAL://0.0.0.0:9093
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT_INTERNAL:PLAINTEXT,PLAINTEXT_EXTERNAL:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT_INTERNAL
      KAFKA_BROKER_ID: 1
      KAFKA_MESSAGE_MAX_BYTES: 3145728
      KAFKA_REPLICA_FETCH_MAX_BYTES: 3145728
    volumes:
      - ./data/kafka:/kafka
    env_file:
      - .env
```

---

## 🧪 Testing & Debugging

- Check broker status:
  ```bash
  docker-compose logs kafka
  ```

- Inspect Zookeeper:
  ```bash
  docker-compose logs zookeeper
  ```

---

## 🗂 Directory Structure

```
kafka/
├── .env
├── .gitignore
├── docker-compose.yml
└── data/
    ├── kafka/
    └── zookeeper/
```

---

## 🧠 Notes

- `KAFKA_CREATE_TOPICS` auto-creates the topic `batchedUpdates` on container start.
- Message size limits are set to 3MB to support large batched payloads.
- Services can consume from or produce to this Kafka broker via `localhost:9092` (internal) or `localhost:9093` (external).
