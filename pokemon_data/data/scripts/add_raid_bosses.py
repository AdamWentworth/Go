import sqlite3
import requests
import json

# Define the SQLite database file
DATABASE_FILE = '../pokego.db'

# API endpoint for raid bosses
API_ENDPOINT = 'https://pogoapi.net/api/v1/raid_bosses.json'

def create_connection(db_file):
    """ Create a database connection to the SQLite database specified by db_file """
    conn = None
    try:
        conn = sqlite3.connect(db_file)
        return conn
    except sqlite3.Error as e:
        print(f"Error creating connection: {e}")
    return conn

def insert_raid_boss(cur, boss):
    """ Insert a new raid boss into the raid_bosses table """
    try:
        cur.execute('''
            INSERT INTO raid_bosses (
                pokemon_id, name, form, type, boosted_weather, 
                max_boosted_cp, max_unboosted_cp, min_boosted_cp, min_unboosted_cp, 
                possible_shiny, tier
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            boss['id'], 
            boss['name'], 
            boss.get('form', ''),
            ','.join(boss['type']),
            ','.join(boss['boosted_weather']),
            boss['max_boosted_cp'],
            boss['max_unboosted_cp'],
            boss['min_boosted_cp'],
            boss['min_unboosted_cp'],
            boss['possible_shiny'],
            boss['tier']
        ))
        print(f"Inserted boss: {boss['name']} (ID: {boss['id']}) - Tier: {boss['tier']}")
    except sqlite3.Error as e:
        print(f"Error inserting boss {boss['name']} (ID: {boss['id']}): {e}")

def process_raid_bosses(cur, bosses, section):
    """ Process raid bosses from a given section (current or previous) """
    total_inserted = 0
    for tier in bosses:
        print(f"Processing tier: {tier} in section: {section}")
        for boss in bosses[tier]:
            try:
                boss['tier'] = tier  # Assign the tier directly as a string
                insert_raid_boss(cur, boss)
                total_inserted += 1
            except KeyError as e:
                print(f"Missing key {e} in boss data: {json.dumps(boss)}")
            except Exception as e:
                print(f"Unexpected error with boss {json.dumps(boss)}: {e}")
    return total_inserted

def fetch_and_store_raid_bosses():
    # Create a database connection
    conn = create_connection(DATABASE_FILE)
    if conn is None:
        print("Error! Cannot create the database connection.")
        return

    with conn:
        cur = conn.cursor()
        
        # Fetch the raid bosses data from the API
        response = requests.get(API_ENDPOINT)
        
        if response.status_code == 200:
            raid_bosses_data = response.json()
            total_inserted = 0

            print(f"Data fetched successfully from API. Processing data...")

            # Process current raid bosses
            total_inserted += process_raid_bosses(cur, raid_bosses_data['current'], 'current')

            # Process previous raid bosses
            total_inserted += process_raid_bosses(cur, raid_bosses_data['previous'], 'previous')

            print(f"Total raid bosses inserted: {total_inserted}")
        else:
            print(f"Failed to fetch data from API. Status code: {response.status_code}")

if __name__ == '__main__':
    fetch_and_store_raid_bosses()
