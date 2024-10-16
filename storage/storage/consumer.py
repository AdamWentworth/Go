# storage/consumer.py
import gzip
from io import BytesIO
import json
import time
import logging
from datetime import datetime
from pathlib import Path
from confluent_kafka import Consumer, KafkaException
from django.conf import settings
from .models import User, PokemonInstance
from django.db import connections, OperationalError
from apscheduler.schedulers.background import BackgroundScheduler

logger = logging.getLogger('basicLogger')
file_logger = logging.getLogger('fileLogger')

# Path to store messages
FAILED_MESSAGES_DIR = Path(__file__).resolve().parent / 'failed_messages'
FAILED_MESSAGES_DIR.mkdir(parents=True, exist_ok=True)
FAILED_MESSAGES_FILE = FAILED_MESSAGES_DIR / 'failed_messages.jsonl'

class TraceIDLoggerAdapter(logging.LoggerAdapter):
    def process(self, msg, kwargs):
        trace_id = self.extra.get('trace_id', 'N/A')
        return f'trace_id {trace_id} - {msg}', kwargs
    
def decompress_message(compressed_data):
    """Decompress the gzip data and return the decompressed message."""
    try:
        buf = BytesIO(compressed_data)
        with gzip.GzipFile(fileobj=buf) as f:
            decompressed_data = f.read()
        return decompressed_data
    except Exception as e:
        logger.error(f"Failed to decompress message: {e}")
        raise

def consume_messages():
    kafka_config = settings.KAFKA_CONFIG
    conf = {
        'bootstrap.servers': f"{kafka_config['hostname']}:{kafka_config['port']}",
        'group.id': 'event_group',
        'auto.offset.reset': 'earliest',
        'enable.auto.commit': False  # Disable auto commit
    }

    consumer = None
    max_retries = 5
    retry_attempt = 0
    backoff_time = 2  # Initial backoff time in seconds

    while retry_attempt < max_retries:
        try:
            consumer = Consumer(conf)
            consumer.subscribe([kafka_config['topic']])
            logger.info(f"Kafka consumer started and subscribed to topic: {kafka_config['topic']}")
            break  # Exit the retry loop if connection is successful
        except Exception as e:
            logger.error(f"Failed to start Kafka consumer: {e}")
            retry_attempt += 1
            time.sleep(backoff_time)
            backoff_time *= 2  # Exponential backoff

    if consumer is None:
        logger.error("Failed to start Kafka consumer after multiple attempts")
        return

    try:
        while True:
            try:
                logger.debug("Polling for messages")
                msg = consumer.poll(timeout=5.0)
                if msg is None:
                    logger.debug("No message received in this poll cycle")
                    continue
                if msg.error():
                    if msg.error().code() == KafkaException._PARTITION_EOF:
                        logger.debug("End of partition reached")
                        continue
                    else:
                        logger.error(f"Consumer error: {msg.error()}")
                        continue

                logger.debug(f"Message received: {msg.value()}")

                # Decompress the message
                try:
                    decompressed_data = decompress_message(msg.value())
                except Exception as e:
                    logger.error(f"Failed to decompress message: {e}")
                    continue  # Skip this message and continue polling

                # Decode JSON from the decompressed data
                data = json.loads(decompressed_data.decode('utf-8'))
                trace_id = data.get('trace_id', 'N/A')
                trace_logger = TraceIDLoggerAdapter(file_logger, {'trace_id': trace_id})
                trace_logger.info(f"Consumed message for user {data.get('user_id', 'unknown')}")
                
                # Handle the message
                handle_message(data, trace_logger)
                consumer.commit()  # Commit only after successful processing
            except KafkaException as ke:
                logger.error(f"Kafka error: {ke}")
                retry_attempt += 1
                time.sleep(backoff_time)
                backoff_time = min(backoff_time * 2, 60)  # Cap the backoff time at 60 seconds
            except Exception as e:
                logger.error(f"Error in consuming messages: {e}")
                retry_attempt += 1
                time.sleep(backoff_time)
                backoff_time = min(backoff_time * 2, 60)  # Cap the backoff time at 60 seconds
    finally:
        consumer.close()
        logger.info("Kafka consumer closed")

def ensure_db_connection(max_retries=5, retry_interval=5):
    retries = 0
    backoff_time = retry_interval
    while retries < max_retries:
        try:
            for conn in connections.all():
                conn.close_if_unusable_or_obsolete()  # Close and reopen connections if needed
                conn.ensure_connection()
            return True
        except OperationalError as e:
            retries += 1
            logger.warning(f"Database connection failed (attempt {retries}/{max_retries}): {e}")
            time.sleep(backoff_time)
            backoff_time = min(backoff_time * 2, 60)  # Exponential backoff
    return False

def filter_json_fields(data):
    if data is None:
        return {}
    return {k: v for k, v in data.items() if v is True}

def handle_message(data, trace_logger):
    max_retries = 5
    retry_interval = 5
    retries = 0

    while retries < max_retries:
        try:
            if not ensure_db_connection():
                retries += 1
                time.sleep(retry_interval)
                continue

            user_id = data.get('user_id')
            username = data.get('username')
            pokemon_data = data.get('pokemon', {})
            
            # Extract the location data (latitude and longitude)
            location = data.get('location', {})
            latitude = location.get('latitude') if location else None
            longitude = location.get('longitude') if location else None

            trace_logger.info(f"Handling message for user_id: {user_id}, username: {username}, location: {latitude}, {longitude}")

            # Update or create the user record, including location
            user, created = User.objects.update_or_create(
                user_id=user_id,
                defaults={'username': username, 'latitude': latitude, 'longitude': longitude}
            )

            trace_logger.info(f"User processed: {user_id}, created: {created}")

            created_count = 0
            updated_count = 0
            deleted_count = 0

            # Process each Pokemon instance
            for instance_id, pokemon in pokemon_data.items():
                trace_logger.info(f"Processing instance {instance_id} for user {user_id} with data: {pokemon}")

                cp = pokemon.get('cp') if pokemon.get('cp') != "" else None
                weight = pokemon.get('weight') if pokemon.get('weight') != "" else None
                height = pokemon.get('height') if pokemon.get('height') != "" else None

                # Filter the JSON fields
                not_trade_list = filter_json_fields(pokemon.get('not_trade_list') or {})
                not_wanted_list = filter_json_fields(pokemon.get('not_wanted_list') or {})
                trade_filters = filter_json_fields(pokemon.get('trade_filters') or {})
                wanted_filters = filter_json_fields(pokemon.get('wanted_filters') or {})

                date_caught_str = pokemon.get('date_caught')
                date_caught = None
                if date_caught_str:
                    try:
                        # Try parsing as date
                        date_caught = datetime.strptime(date_caught_str, '%Y-%m-%d').date()
                    except ValueError:
                        try:
                            # Try parsing as datetime with timezone
                            date_caught = datetime.strptime(date_caught_str, '%Y-%m-%dT%H:%M:%SZ').date()
                        except ValueError:
                            trace_logger.error(f"Unrecognized date format for date_caught: {date_caught_str}")

                # Check if the instance should be deleted
                if (
                    pokemon.get('is_unowned', False) and
                    not pokemon.get('is_owned', False) and
                    not pokemon.get('is_wanted', False) and
                    not pokemon.get('is_for_trade', False)
                ):
                    deleted, _ = PokemonInstance.objects.filter(instance_id=instance_id).delete()
                    if deleted:
                        deleted_count += 1
                        trace_logger.info(f"Instance deleted for user {user_id}: {instance_id}")
                else:
                    try:
                        existing_instance = PokemonInstance.objects.get(instance_id=instance_id)
                        trace_logger.info(f"Existing instance last_update: {existing_instance.last_update}, incoming last_update: {pokemon.get('last_update', 0)}")
                        if existing_instance.last_update >= pokemon.get('last_update', 0):
                            trace_logger.info(f"Ignored older or same update for instance {instance_id}")
                            continue
                    except PokemonInstance.DoesNotExist:
                        trace_logger.info(f"Instance {instance_id} does not exist, will create a new one.")

                    defaults = {
                        'pokemon_id': pokemon.get('pokemon_id'),
                        'nickname': pokemon.get('nickname'),
                        'cp': cp,
                        'attack_iv': pokemon.get('attack_iv'),
                        'defense_iv': pokemon.get('defense_iv'),
                        'stamina_iv': pokemon.get('stamina_iv'),
                        'shiny': pokemon.get('shiny', False),
                        'costume_id': pokemon.get('costume_id'),
                        'lucky': pokemon.get('lucky', False),
                        'shadow': pokemon.get('shadow', False),
                        'purified': pokemon.get('purified', False),
                        'fast_move_id': pokemon.get('fast_move_id'),
                        'charged_move1_id': pokemon.get('charged_move1_id'),
                        'charged_move2_id': pokemon.get('charged_move2_id'),
                        'weight': weight,
                        'height': height,
                        'gender': pokemon.get('gender'),
                        'mirror': pokemon.get('mirror', False),
                        'pref_lucky': pokemon.get('pref_lucky', False),
                        'registered': pokemon.get('registered', False),
                        'favorite': pokemon.get('favorite', False),
                        'location_card': pokemon.get('location_card'),
                        'location_caught': pokemon.get('location_caught'),
                        'friendship_level': pokemon.get('friendship_level'),
                        'date_caught': date_caught,
                        'date_added': pokemon.get('date_added'),
                        'last_update': pokemon.get('last_update'),
                        'is_unowned': pokemon.get('is_unowned', False),
                        'is_owned': pokemon.get('is_owned', False),
                        'is_for_trade': pokemon.get('is_for_trade', False),
                        'is_wanted': pokemon.get('is_wanted', False),
                        'not_trade_list': not_trade_list,
                        'not_wanted_list': not_wanted_list,
                        'trace_id': trace_logger.extra.get('trace_id'),
                        'wanted_filters': wanted_filters,
                        'trade_filters': trade_filters,
                    }

                    trace_logger.info(f"Defaults to be used for update/create: {defaults}")

                    obj, created = PokemonInstance.objects.update_or_create(instance_id=instance_id, user=user, defaults=defaults)
                    if created:
                        created_count += 1
                        trace_logger.info(f"Instance created for user {user_id}: {instance_id}")
                    else:
                        updated_count += 1
                        trace_logger.info(f"Instance updated for user {user_id}: {instance_id}")

            actions = []
            if created_count > 0:
                actions.append(f"created {created_count}")
            if updated_count > 0:
                actions.append(f"updated {updated_count}")
            if deleted_count > 0:
                actions.append(f"dropped {deleted_count}")
            action_summary = ", ".join(actions)

            logger.info(f"User {username} {action_summary} instances with status 200")
            file_logger.debug(f"User {username} {action_summary} instances with status 200")
            return  # Exit the retry loop if processing is successful
        except OperationalError as oe:
            trace_logger.error(f"Failed to handle message due to database error: {oe}")
            retries += 1
            time.sleep(retry_interval)
        except Exception as e:
            trace_logger.error(f"Failed to handle message: {e}")
            break

    save_failed_message(data)

def save_failed_message(data):
    try:
        with open(FAILED_MESSAGES_FILE, 'a') as f:
            f.write(json.dumps(data) + "\n")
        logger.warning(f"Message saved to {FAILED_MESSAGES_FILE} for later reprocessing.")
    except Exception as e:
        logger.error(f"Failed to save message to file: {e}")

def reprocess_failed_messages_silent():
    if FAILED_MESSAGES_FILE.exists() and FAILED_MESSAGES_FILE.stat().st_size > 0:
        with open(FAILED_MESSAGES_FILE, 'r') as f:
            messages = [line.strip() for line in f if line.strip()]

        if messages:
            logger.warning(f"Reprocessing {len(messages)} failed messages.")

            for message in messages:
                try:
                    data = json.loads(message)
                    trace_id = data.get('trace_id', 'N/A')
                    trace_logger = TraceIDLoggerAdapter(file_logger, {'trace_id': trace_id})
                    handle_message(data, trace_logger)
                except Exception as e:
                    logger.error(f"Failed to reprocess message: {e}")

            # Clear the file after reprocessing
            with open(FAILED_MESSAGES_FILE, 'w') as f:
                pass

            logger.warning("Reprocessed failed messages.")

def start_reprocessing_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(reprocess_failed_messages_silent, 'interval', minutes=5)
    scheduler.start()

# In your startup script or main Django app initialization, start the reprocessing scheduler
start_reprocessing_scheduler()
