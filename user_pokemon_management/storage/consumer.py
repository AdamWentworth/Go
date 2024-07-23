# storage/consumer.py
import time
import json
import logging
from confluent_kafka import Consumer, KafkaException
from django.conf import settings
from .models import User, PokemonInstance
from django.db import connections

logger = logging.getLogger('basicLogger')
file_logger = logging.getLogger('fileLogger')

class TraceIDLoggerAdapter(logging.LoggerAdapter):
    def process(self, msg, kwargs):
        trace_id = self.extra.get('trace_id', 'N/A')
        return f'trace_id {trace_id} - {msg}', kwargs

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
                data = json.loads(msg.value().decode('utf-8'))
                trace_id = data.get('trace_id', 'N/A')
                trace_logger = TraceIDLoggerAdapter(file_logger, {'trace_id': trace_id})
                trace_logger.info(f"Consumed message for user {data.get('user_id', 'unknown')}")
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

def handle_message(data, trace_logger):
    try:
        # Validate database connection
        for conn in connections.all():
            conn.ensure_connection()

        user_id = data.get('user_id')
        username = data.get('username')
        pokemon_data = data.get('pokemon', {})

        trace_logger.info(f"Handling message for user_id: {user_id}, username: {username}")

        user, created = User.objects.get_or_create(user_id=user_id, defaults={'username': username})
        trace_logger.info(f"User processed: {user_id}, created: {created}")

        created_count = 0
        updated_count = 0
        deleted_count = 0

        for instance_id, pokemon in pokemon_data.items():
            trace_logger.info(f"Processing instance {instance_id} for user {user_id} with data: {pokemon}")

            cp = pokemon.get('cp')
            if cp == "":
                cp = None

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
                    'weight': pokemon.get('weight'),
                    'height': pokemon.get('height'),
                    'gender': pokemon.get('gender'),
                    'mirror': pokemon.get('mirror', False),
                    'pref_lucky': pokemon.get('pref_lucky', False),
                    'registered': pokemon.get('registered', False),
                    'favorite': pokemon.get('favorite', False),
                    'location_card': pokemon.get('location_card'),
                    'location_caught': pokemon.get('location_caught'),
                    'friendship_level': pokemon.get('friendship_level'),
                    'date_caught': pokemon.get('date_caught'),
                    'date_added': pokemon.get('date_added'),
                    'last_update': pokemon.get('last_update'),
                    'is_unowned': pokemon.get('is_unowned', False),
                    'is_owned': pokemon.get('is_owned', False),
                    'is_for_trade': pokemon.get('is_for_trade', False),
                    'is_wanted': pokemon.get('is_wanted', False),
                    'not_trade_list': pokemon.get('not_trade_list', {}),
                    'not_wanted_list': pokemon.get('not_wanted_list', {}),
                    'trace_id': trace_logger.extra.get('trace_id')
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
            actions.append(f"{created_count} created")
        if updated_count > 0:
            actions.append(f"{updated_count} updated")
        if deleted_count > 0:
            actions.append(f"{deleted_count} dropped")
        action_summary = ", ".join(actions)

        logger.info(f"User {username} {action_summary} instances with status 200")
        file_logger.debug(f"User {username} {action_summary} instances with status 200")
    except Exception as e:
        trace_logger.error(f"Failed to handle message: {e}")
