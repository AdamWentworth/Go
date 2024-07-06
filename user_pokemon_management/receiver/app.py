import os
import connexion
from connexion import NoContent
import yaml
import uuid
import logging
import logging.config
import json
from datetime import datetime
from pykafka import KafkaClient
from flask import request
from jose import jwt  # You can also use pyjwt

# Load configuration based on environment
env = os.getenv("TARGET_ENV", "dev")
app_conf_file = f"config/app_conf_{env}.yml"
log_conf_file = f"config/log_conf_{env}.yml"

# Setup logging
with open(log_conf_file, 'r') as f:
    log_config = yaml.safe_load(f.read())
    logging.config.dictConfig(log_config)
logger = logging.getLogger('basicLogger')

# Load app configuration
with open(app_conf_file, 'r') as f:
    app_config = yaml.safe_load(f.read())

# Kafka setup
kafka_config = app_config['events']
producer = None

def initialize_kafka_producer_with_retry():
    retry_count = 0
    while retry_count < kafka_config['max_retries']:
        try:
            logger.info('Attempting to connect to Kafka...')
            kafka_client = KafkaClient(hosts=f"{kafka_config['hostname']}:{kafka_config['port']}")
            kafka_topic = kafka_client.topics[str.encode(kafka_config['topic'])]
            return kafka_topic.get_sync_producer()
        except Exception as e:
            logger.error(f"Failed to connect to Kafka on retry {retry_count}: {e}")
            retry_count += 1
            if retry_count >= kafka_config['max_retries']:
                logger.error("Failed to initialize Kafka producer after max retries")
                break

producer = initialize_kafka_producer_with_retry()

def verify_access_token():
    token = request.headers.get('Authorization').split(" ")[1]  # Assuming Bearer token
    secret_key = app_config['jwt_secret_key']
    try:
        payload = jwt.decode(token, secret_key, algorithms=['HS256'])
        return payload['user_id']  # assuming user_id is embedded in the token
    except jwt.JWTError as e:
        logger.error(f"Token verification failed: {e}")
        return None

def handle_batched_updates():
    user_id = verify_access_token()
    if not user_id:
        return "Unauthorized", 401

    data = request.json
    logger.info(f"Received batched updates with user ID {user_id}: {data}")

    trace_id = str(uuid.uuid4())
    data['trace_id'] = trace_id

    msg = {
        "type": "batchedUpdates",
        "datetime": datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%S"),
        "payload": data
    }
    producer.produce(json.dumps(msg).encode('utf-8'))
    logger.info(f"Produced batchedUpdates event to Kafka topic with trace ID {trace_id}")
    return NoContent, 200

# Setting up Connexion app
app = connexion.FlaskApp(__name__, specification_dir='./')
app.add_api("openapi.yaml", base_path="/api", strict_validation=True, validate_responses=True)

if __name__ == "__main__":
    app.run(port=8080, host="0.0.0.0")
