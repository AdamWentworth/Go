# receiver/views.py

import json
import uuid
import logging
import time
import os
import threading
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_http_methods
from pykafka import KafkaClient
from django.conf import settings
from jose import jwt
from django.views.decorators.csrf import csrf_exempt

logger = logging.getLogger('basicLogger')

producer = None

def initialize_kafka_producer_with_retry():
    kafka_config = settings.KAFKA_CONFIG
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

producer = initialize_kafka_producer_with_retry()

def verify_access_token(request):
    token = request.COOKIES.get('accessToken')
    if not token:
        logger.error("JWT token is missing in cookies")
        return None, None

    secret_key = settings.JWT_SECRET
    try:
        payload = jwt.decode(token, secret_key, algorithms=['HS256'])
        logger.info("Token decoded successfully")
        return payload.get('user_id'), payload.get('username')
    except jwt.JWTError as e:
        logger.error(f"Token verification failed: {e}")
        return None, None

def save_to_local_storage(data, filename="pending_kafka_data.json"):
    with open(filename, 'a') as f:
        json.dump(data, f)
        f.write('\n')
    logger.info("Data saved to local storage due to Kafka connection failure")

def retry_sending_to_kafka():
    filename = "pending_kafka_data.json"
    while True:
        if os.path.exists(filename):
            with open(filename, 'r') as f:
                lines = f.readlines()
            with open(filename, 'w') as f:
                for line in lines:
                    try:
                        data = json.loads(line.strip())
                        producer.produce(json.dumps(data).encode('utf-8'))
                    except Exception as e:
                        logger.error(f"Failed to produce to Kafka: {e}", exc_info=True)
                        f.write(line)  # Write back to the file for retrying later
                    else:
                        logger.info("Successfully sent pending data to Kafka")
        time.sleep(60)  # Retry every 60 seconds

@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def handle_batched_updates(request):
    logger.info(f"{request.method} {request.path}")
    
    if request.method == 'OPTIONS':
        response = HttpResponse()
        response['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        response['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
        response['Access-Control-Allow-Credentials'] = 'true'
        return response

    # Log the exact data the server is receiving
    # logger.info(f"Received data: {request.body.decode('utf-8')}")
    
    user_id, username = verify_access_token(request)
    if not user_id:
        logger.error("Unauthorized access attempt detected")
        return JsonResponse({"message": "Unauthorized"}, status=401, headers={
            'Access-Control-Allow-Origin': 'http://localhost:3000',
            'Access-Control-Allow-Credentials': 'true'
        })

    pokemon = json.loads(request.body)
    pokemon_count = len(pokemon)

    trace_id = str(uuid.uuid4())
    
    data = {
        'user_id': user_id,
        'username': username,
        'trace_id': trace_id,
        'pokemon': pokemon
    }

    try:
        producer.produce(json.dumps(data).encode('utf-8'))
        response = JsonResponse({"message": "Batched updates successfully processed"}, status=200)
        logger.info(f"User {username} loaded {pokemon_count} pokemon into Kafka with status {response.status_code}")
    except Exception as e:
        logger.error(f"Failed to produce to Kafka: {e}", exc_info=True)
        save_to_local_storage(data)
        response = JsonResponse({"message": "Internal Server Error"}, status=500)
        logger.info(f"User {username} failed to load {pokemon_count} pokemon into Kafka with status {response.status_code}")

    response['Access-Control-Allow-Origin'] = 'http://localhost:3000'
    response['Access-Control-Allow-Credentials'] = 'true'
    return response

# Start the retry thread when the application starts
retry_thread = threading.Thread(target=retry_sending_to_kafka, daemon=True)
retry_thread.start()
