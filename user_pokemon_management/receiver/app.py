# app.py
import os
import yaml
import uuid
import logging
import logging.config
import json
import time
from datetime import datetime
from pykafka import KafkaClient
from flask import Flask, request, jsonify, make_response
from jose import jwt
from dotenv import load_dotenv
from flask_cors import CORS

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

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)

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
    token = request.cookies.get('accessToken')
    if not token:
        logger.error("JWT token is missing in cookies")
        return None

    secret_key = os.getenv('JWT_SECRET')
    try:
        payload = jwt.decode(token, secret_key, algorithms=['HS256'])
        logger.info(f"Token decoded successfully, payload: {payload}")
        return payload.get('user_id'), payload.get('username')
    except jwt.JWTError as e:
        logger.error(f"Token verification failed: {e}")
        return None

@app.route('/api/batchedUpdates', methods=['POST', 'OPTIONS'])
def handle_batched_updates():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response

    user_id, username = verify_access_token()
    if not user_id:
        logger.error("Unauthorized access attempt detected")
        response = make_response(jsonify({"message": "Unauthorized"}), 401)
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response

    pokemon = request.json
    logger.info(f"Received batched updates for user ID {user_id} - {username}")

    trace_id = str(uuid.uuid4())
    
    data = {
        'used_id': user_id,
        'username': username,
        'trace_id': trace_id,
        'pokemon': pokemon
    }

    try:
        producer.produce(json.dumps(data).encode('utf-8'))
        logger.info(f"Produced batchedUpdates event to Kafka topic with trace ID {trace_id}")
        logger.info(f"All the data loaded into kafka:", {data})
        response = make_response(jsonify({"message": "Batched updates successfully processed"}), 200)
    except Exception as e:
        logger.error(f"Failed to produce to Kafka: {e}", exc_info=True)
        response = make_response(jsonify({"message": "Internal Server Error"}), 500)

    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
    response.headers['Access-Control-Allow-Credentials'] = 'true'
    return response

if __name__ == "__main__":
    # Initialize Kafka producer
    producer = initialize_kafka_producer_with_retry()
    if not producer:
        logger.error("Exiting due to failure to initialize Kafka producer.")
        exit(1)
    # Start the Flask app with CORS support
    app.run(port=3003, host="0.0.0.0")