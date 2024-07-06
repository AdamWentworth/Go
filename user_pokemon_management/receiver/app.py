# app.py
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
from jose import jwt
from dotenv import load_dotenv
import time

# Load environment variables
load_dotenv(dotenv_path=".env.development")

# Setup logging from YAML configuration
log_conf_file = "config/log_conf.yml"
with open(log_conf_file, 'r') as f:
    log_config = yaml.safe_load(f.read())
    logging.config.dictConfig(log_config)
logger = logging.getLogger('basicLogger')

# Load app configuration
app_conf_file = "config/app_conf.yml"
with open(app_conf_file, 'r') as f:
    app_config = yaml.safe_load(f.read())

# Kafka setup using loaded app configuration
kafka_config = app_config['events']
kafka_config['hostname'] = os.getenv('HOST_IP')

producer = None

def initialize_kafka_producer_with_retry():
    retry_count = 0
    while retry_count < kafka_config['max_retries']:
        try:
            logger.info('Attempting to connect to Kafka...')
            kafka_client = KafkaClient(hosts=f"{kafka_config['hostname']}:{kafka_config['port']}")
            logger.info(f'Kafka client connected to {kafka_config["hostname"]}:{kafka_config["port"]}')
            kafka_topic = kafka_client.topics[str.encode(kafka_config['topic'])]
            logger.info(f'Connected to topic {kafka_config["topic"]}')
            return kafka_topic.get_sync_producer()
        except Exception as e:
            logger.error(f"Failed to connect to Kafka on retry {retry_count}: {e}", exc_info=True)
            retry_count += 1
            time.sleep(kafka_config['retry_interval'])
            if retry_count >= kafka_config['max_retries']:
                logger.error("Failed to initialize Kafka producer after max retries")
                break
    return None

def verify_access_token():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(" ")[1]
    secret_key = os.getenv('JWT_SECRET')
    try:
        payload = jwt.decode(token, secret_key, algorithms=['HS256'])
        return payload.get('user_id')
    except jwt.JWTError as e:
        logger.error(f"Token verification failed: {e}")
        return None

def handle_batched_updates():
    user_id = verify_access_token()
    if not user_id:
        return {"message": "Unauthorized"}, 401

    data = request.json
    logger.info(f"Received batched updates with user ID {user_id}: {data}")

    trace_id = str(uuid.uuid4())
    data['trace_id'] = trace_id

    try:
        producer.produce(json.dumps(data).encode('utf-8'))
        logger.info(f"Produced batchedUpdates event to Kafka topic with trace ID {trace_id}")
        return {"message": "Batched updates successfully processed"}, 200
    except Exception as e:
        logger.error(f"Failed to produce to Kafka: {e}", exc_info=True)
        return {"message": "Internal Server Error"}, 500

# Setting up Connexion app
connexion_app = connexion.FlaskApp(__name__, specification_dir='./config')
connexion_app.add_api("openapi.yml", base_path="/api", strict_validation=True, validate_responses=True)

if __name__ == "__main__":
    # Initialize Kafka producer
    producer = initialize_kafka_producer_with_retry()
    if not producer:
        logger.error("Exiting due to failure to initialize Kafka producer.")
        exit(1)
    
    # Start the Connexion app
    connexion_app.run(port=3003, host="0.0.0.0")

