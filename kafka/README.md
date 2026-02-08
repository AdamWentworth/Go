# Kafka Service (Docker) 🦉

Single-broker Kafka + Zookeeper stack used by this repo for async event flow.

## 📦 What This Service Does

- Hosts Kafka topic `batchedUpdates`
- Accepts producer writes from `receiver_service`
- Supports internal container traffic on `kafka:9092`
- Supports host-only local access on `127.0.0.1:9093`

## ✅ Current Production Profile

- Single broker, single Zookeeper node
- Topic auto-created: `batchedUpdates:1:1`
- Message size limit: `3MB`
- Loopback-only host exposure for external listener (`127.0.0.1:9093`)
- Health checks on both Kafka and Zookeeper

## 🚀 Quick Start

1. Ensure the shared external network exists:

```bash
docker network create kafka_default || true
```

1. Start Kafka stack:

```bash
cd Go/kafka
docker compose up -d
```

1. Verify status:

```bash
docker compose ps
docker compose logs --tail=100 kafka
docker compose logs --tail=100 zookeeper
```

## 🔌 Connection Modes

- From other containers on `kafka_default`: `kafka:9092`
- From host machine (local tooling only): `127.0.0.1:9093`

`9092` is intentionally not published to the host.

## ⚙️ Key Kafka Settings

- `KAFKA_CREATE_TOPICS="batchedUpdates:1:1"`
- `KAFKA_LISTENERS="INTERNAL://0.0.0.0:9092,EXTERNAL://0.0.0.0:9093"`
- `KAFKA_ADVERTISED_LISTENERS="INTERNAL://kafka:9092,EXTERNAL://127.0.0.1:9093"`
- `KAFKA_MESSAGE_MAX_BYTES=3145728`
- `KAFKA_REPLICA_FETCH_MAX_BYTES=3145728`

## 🛡️ Durability and Scale Notes

- `1` partition = simple single-lane throughput.
- `1` replica = no broker redundancy (expected with one broker).
- To increase fault tolerance, you need a multi-broker Kafka deployment.

## 🗂️ Directory Layout

```text
kafka/
|-- .gitignore
|-- docker-compose.yml
`-- data/
    |-- kafka/
    `-- zookeeper/
```

## 🧪 Troubleshooting

- Kafka not healthy:
  - `docker compose logs kafka`
  - confirm `kafka_default` exists
- Producers cannot connect:
  - verify producer uses `kafka:9092` (container-to-container)
  - verify service is attached to `kafka_default`
