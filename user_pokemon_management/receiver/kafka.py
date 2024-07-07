import time
import logging
from pykafka import KafkaClient
from django.conf import settings

logger = logging.getLogger('basicLogger')

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
