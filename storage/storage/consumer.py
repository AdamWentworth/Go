# storage/consumer.py
import re
import gzip
import json
import time
import logging
from datetime import datetime
from io import BytesIO
from pathlib import Path
from pytz import UTC

from confluent_kafka import Consumer, KafkaException
from django.db import connections, OperationalError
from django.conf import settings
from django.utils.timezone import make_aware
from apscheduler.schedulers.background import BackgroundScheduler

from .models import User, PokemonInstance, Trade

logger = logging.getLogger('basicLogger')
file_logger = logging.getLogger('fileLogger')

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


def ensure_db_connection(max_retries=5, retry_interval=5):
    """Ensure DB connection, with retries."""
    retries = 0
    backoff_time = retry_interval
    while retries < max_retries:
        try:
            for conn in connections.all():
                conn.close_if_unusable_or_obsolete()
                conn.ensure_connection()
            return True
        except OperationalError as e:
            retries += 1
            logger.warning(f"Database connection failed (attempt {retries}/{max_retries}): {e}")
            time.sleep(backoff_time)
            backoff_time = min(backoff_time * 2, 60)
    return False


def filter_json_fields(data):
    if data is None:
        return {}
    # Return only keys where the value is True
    return {k: v for k, v in data.items() if v is True}

def parse_int_field(value):
    try:
        return int(value) if value not in [None, ''] else None
    except (ValueError, TypeError):
        return None

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


def get_user_id_for_username(username_val, trace_logger):
    """
    Utility function to look up user_id by username in the Users table.
    Return an empty string if not found (or you could skip the trade).
    """
    if not username_val:
        return ""

    try:
        user = User.objects.get(username=username_val)
        return user.user_id
    except User.DoesNotExist:
        trace_logger.warning(f"No user found for username='{username_val}', storing empty user_id.")
        return ""


def handle_message(data, trace_logger):
    """Process the received JSON data (pokemonUpdates, tradeUpdates, etc.)."""
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
            trace_id = data.get('trace_id', 'N/A')

            location = data.get('location', {})
            latitude = location.get('latitude')
            longitude = location.get('longitude')

            pokemon_updates = data.get('pokemonUpdates', [])
            trade_updates = data.get('tradeUpdates', [])

            trace_logger.info(
                f"Handling message for user_id: {user_id}, username: {username}, "
                f"location: {latitude}, {longitude}"
            )

            # 1) Upsert or verify user for the message sender
            try:
                existing_user = User.objects.get(user_id=user_id)
                if existing_user.username != username:
                    trace_logger.warning(
                        f"Username mismatch: user_id={user_id}, "
                        f"DB username='{existing_user.username}', message username='{username}'. Skipping."
                    )
                    return
                # Update location if changed
                existing_user.latitude = latitude
                existing_user.longitude = longitude
                existing_user.save()
                user = existing_user
                created = False
            except User.DoesNotExist:
                user, created = User.objects.update_or_create(
                    user_id=user_id,
                    defaults={
                        'username': username,
                        'latitude': latitude,
                        'longitude': longitude,
                    }
                )

            trace_logger.info(f"User processed: {user_id}, created: {created}")

            # 2) Process Pokemon updates (unchanged)
            created_count, updated_count, deleted_count = 0, 0, 0

            for pokemon in pokemon_updates:
                instance_id = pokemon.get('instance_id')
                trace_logger.info(f"Processing instance {instance_id} for user {user_id} with data: {pokemon}")

                # 2A) parse fields
                cp = pokemon.get('cp') if pokemon.get('cp') != "" else None
                weight = pokemon.get('weight') if pokemon.get('weight') != "" else None
                height = pokemon.get('height') if pokemon.get('height') != "" else None

                attack_iv = parse_int_field(pokemon.get('attack_iv'))
                defense_iv = parse_int_field(pokemon.get('defense_iv'))
                stamina_iv = parse_int_field(pokemon.get('stamina_iv'))

                not_trade_list = filter_json_fields(pokemon.get('not_trade_list') or {})
                not_wanted_list = filter_json_fields(pokemon.get('not_wanted_list') or {})
                trade_filters = filter_json_fields(pokemon.get('trade_filters') or {})
                wanted_filters = filter_json_fields(pokemon.get('wanted_filters') or {})

                date_caught_str = pokemon.get('date_caught')
                date_caught = None
                if date_caught_str:
                    # Attempt to parse as YYYY-MM-DD
                    try:
                        date_caught = datetime.strptime(date_caught_str, '%Y-%m-%d').date()
                    except ValueError:
                        # Attempt to parse as datetime with T/Z
                        try:
                            date_caught = datetime.strptime(date_caught_str, '%Y-%m-%dT%H:%M:%SZ').date()
                        except ValueError:
                            trace_logger.error(f"Unrecognized date format for date_caught: {date_caught_str}")

                # 2B) if flagged for deletion
                if (
                    pokemon.get('is_unowned', False)
                    and not pokemon.get('is_owned', False)
                    and not pokemon.get('is_wanted', False)
                    and not pokemon.get('is_for_trade', False)
                ):
                    deleted_n, _ = PokemonInstance.objects.filter(instance_id=instance_id).delete()
                    if deleted_n:
                        deleted_count += 1
                        trace_logger.info(f"Instance deleted for user {user_id}: {instance_id}")
                    continue

                # 2C) Upsert
                try:
                    existing_instance = PokemonInstance.objects.get(instance_id=instance_id)
                    # Ensure ownership
                    if existing_instance.user.user_id != user_id:
                        trace_logger.warning(
                            f"Unauthorized attempt by user {user_id} to modify instance {instance_id}"
                        )
                        continue
                    # Compare last_update
                    if existing_instance.last_update >= pokemon.get('last_update', 0):
                        trace_logger.info(
                            f"Ignored older or same update for instance {instance_id}"
                        )
                        continue
                except PokemonInstance.DoesNotExist:
                    trace_logger.info(
                        f"Instance {instance_id} does not exist, will create a new one."
                    )

                defaults = {
                    'pokemon_id': pokemon.get('pokemon_id'),
                    'nickname': pokemon.get('nickname'),
                    'cp': cp,  # Already handled earlier
                    'attack_iv': attack_iv,
                    'defense_iv': defense_iv,
                    'stamina_iv': stamina_iv,
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

                obj, created_pi = PokemonInstance.objects.update_or_create(
                    instance_id=instance_id,
                    user=user,
                    defaults=defaults
                )
                if created_pi:
                    created_count += 1
                    trace_logger.info(f"Instance created for user {user_id}: {instance_id}")
                else:
                    updated_count += 1
                    trace_logger.info(f"Instance updated for user {user_id}: {instance_id}")

            # 3) Process Trades
            trade_processed_count = 0
            for tradeObj in trade_updates:
                tradeData = tradeObj.get('tradeData', {})
                t_id = tradeData.get('trade_id') or tradeObj.get('key')
                if not t_id:
                    trace_logger.warning("Skipping a Trade update because no trade_id found.")
                    continue

                trace_logger.info(f"Processing Trade ID {t_id} for user {user_id}: {tradeObj}")

                # datetime fields
                proposal_date = tradeData.get('trade_proposal_date')
                accepted_date = tradeData.get('trade_accepted_date')  
                completed_date = tradeData.get('trade_completed_date')
                cancelled_date = tradeData.get('trade_cancelled_date') 

                # We only have usernames for proposed/accepting, so we look them up:
                proposed_username = tradeData.get('username_proposed') or ""
                accepting_username = tradeData.get('username_accepting') or ""

                # Attempt to find user_ids by those usernames
                proposed_user_id = get_user_id_for_username(proposed_username, trace_logger)
                accepting_user_id = get_user_id_for_username(accepting_username, trace_logger)

                # Convert booleans / ints
                is_special_trade = bool(tradeData.get('is_special_trade', 0))
                is_registered_trade = bool(tradeData.get('is_registered_trade', 0))
                is_lucky_trade = bool(tradeData.get('is_lucky_trade', 0))

                trade_dust_cost = tradeData.get('trade_dust_cost') or 0
                try:
                    trade_dust_cost = int(trade_dust_cost)
                except ValueError:
                    trade_dust_cost = 0

                trade_status = tradeData.get('trade_status', 'proposed')
                trade_friendship_level = tradeData.get('trade_friendship_level', 'Good')

                user_1_trade_satisfaction = tradeData.get('user_1_trade_satisfaction')
                if user_1_trade_satisfaction is not None:
                    user_1_trade_satisfaction = int(user_1_trade_satisfaction)

                user_2_trade_satisfaction = tradeData.get('user_2_trade_satisfaction')
                if user_2_trade_satisfaction is not None:
                    user_2_trade_satisfaction = int(user_2_trade_satisfaction)

                defaults_trade = {
                    "user_id_proposed": proposed_user_id,
                    "username_proposed": proposed_username,
                    "user_id_accepting": accepting_user_id,
                    "username_accepting": accepting_username,

                    "pokemon_instance_id_user_proposed": tradeData.get('pokemon_instance_id_user_proposed', ''),
                    "pokemon_instance_id_user_accepting": tradeData.get('pokemon_instance_id_user_accepting', ''),

                    "trade_status": trade_status,
                    "trade_proposal_date": proposal_date,
                    "trade_accepted_date": accepted_date,
                    "trade_completed_date": completed_date,
                    "trade_cancelled_date": cancelled_date,
                    "trade_cancelled_by": tradeData.get('trade_cancelled_by'),

                    "is_special_trade": is_special_trade,
                    "is_registered_trade": is_registered_trade,
                    "is_lucky_trade": is_lucky_trade,
                    "trade_dust_cost": trade_dust_cost,
                    "trade_friendship_level": trade_friendship_level,
                    "user_1_trade_satisfaction": user_1_trade_satisfaction,
                    "user_2_trade_satisfaction": user_2_trade_satisfaction,

                    "trace_id": trace_id,
                }

                trace_logger.info(f"Upserting Trade {t_id} with defaults: {defaults_trade}")
                trade_record, created_t = Trade.objects.update_or_create(
                    trade_id=t_id,
                    defaults=defaults_trade
                )
                if created_t:
                    trace_logger.info(f"Trade {t_id} created.")
                else:
                    trace_logger.info(f"Trade {t_id} updated.")

                trade_processed_count += 1

            # Summaries
            actions = []
            if created_count > 0:
                actions.append(f"created {created_count}")
            if updated_count > 0:
                actions.append(f"updated {updated_count}")
            if deleted_count > 0:
                actions.append(f"dropped {deleted_count}")
            if trade_processed_count > 0:
                actions.append(f"tradeProcessed {trade_processed_count}")

            action_summary = ", ".join(actions) if actions else "no changes"
            logger.info(f"User {username} {action_summary} with status 200")
            file_logger.debug(f"User {username} {action_summary} with status 200")
            return  # success

        except OperationalError as oe:
            trace_logger.error(f"Failed to handle message due to database error: {oe}")
            retries += 1
            time.sleep(retry_interval)
        except Exception as e:
            trace_logger.error(f"Failed to handle message: {e}")
            break

    # If we exhaust retries or hit an exception, save the message.
    save_failed_message(data)


def consume_messages():
    kafka_config = settings.KAFKA_CONFIG
    conf = {
        'bootstrap.servers': f"{kafka_config['hostname']}:{kafka_config['port']}",
        'group.id': 'event_group',
        'auto.offset.reset': 'earliest',
        'enable.auto.commit': False
    }

    consumer = None
    max_retries = 5
    retry_attempt = 0
    backoff_time = 2

    while retry_attempt < max_retries:
        try:
            consumer = Consumer(conf)
            consumer.subscribe([kafka_config['topic']])
            logger.info(f"Kafka consumer started and subscribed to topic: {kafka_config['topic']}")
            break
        except Exception as e:
            logger.error(f"Failed to start Kafka consumer: {e}")
            retry_attempt += 1
            time.sleep(backoff_time)
            backoff_time *= 2

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

                # Decompress
                try:
                    decompressed_data = decompress_message(msg.value())
                except Exception as e:
                    logger.error(f"Failed to decompress message: {e}")
                    continue

                # Decode JSON
                data = json.loads(decompressed_data.decode('utf-8'))
                trace_id = data.get('trace_id', 'N/A')
                trace_logger = TraceIDLoggerAdapter(file_logger, {'trace_id': trace_id})

                trace_logger.info(f"Consumed message for user {data.get('user_id', 'unknown')}")

                # Handle
                handle_message(data, trace_logger)
                consumer.commit()
            except KafkaException as ke:
                logger.error(f"Kafka error: {ke}")
                retry_attempt += 1
                time.sleep(backoff_time)
                backoff_time = min(backoff_time * 2, 60)
            except Exception as e:
                logger.error(f"Error in consuming messages: {e}")
                retry_attempt += 1
                time.sleep(backoff_time)
                backoff_time = min(backoff_time * 2, 60)
    finally:
        consumer.close()
        logger.info("Kafka consumer closed")

# Start the reprocessing scheduler
start_reprocessing_scheduler()

