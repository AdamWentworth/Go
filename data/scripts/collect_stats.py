import requests
import sqlite3
import re

# Function to get missing Pokémon details from 'missing.txt'
def get_missing_pokemon():
    missing_pokemon = []
    with open('missing.txt', 'r') as f:
        for line in f.readlines():
            match = re.search(r"No match in database for (\w+) \((\d+)\) with form (\w+).", line)
            if match:
                name, pokedex_number, form = match.groups()
                missing_pokemon.append({
                    'pokemon_name': name,
                    'pokemon_id': int(pokedex_number),
                    'form': form
                })
    return missing_pokemon

def fetch_pokemon_stats():
    print("Starting to fetch Pokémon stats...")

    # Define the endpoint URL
    url = "https://pogoapi.net/api/v1/pokemon_stats.json"

    # Send a GET request to the endpoint
    try:
        response = requests.get(url)
        response.raise_for_status()  # Raise an exception for HTTP errors, if any
    except requests.RequestException as e:
        print(f"Error occurred while fetching data: {e}")
        return []

    # Check if the response has valid JSON content
    if not response.headers.get('content-type') == 'application/json':
        print("Unexpected content received. Expected JSON.")
        return []

    # Load the response JSON data
    data = response.json()

    print(f"Fetched data for {len(data)} Pokémon stats successfully!")
    return data

# New function to insert missing Pokémon stats into the database
def insert_pokemon_stat(cursor, stat):
    try:
        cursor.execute('''
        INSERT INTO pokemon (name, pokedex_number, form, attack, defense, stamina)
        VALUES (?, ?, ?, ?, ?, ?)
        ''', (stat["pokemon_name"], stat["pokemon_id"], stat["form"], stat["base_attack"], stat["base_defense"], stat["base_stamina"]))
        print(f"Inserted {stat['pokemon_name']} ({stat['pokemon_id']}) with form {stat['form']}.")
    except sqlite3.Error as e:
        print(f"Database error while inserting: {e}")

# Modify update_pokemon_stats
def update_pokemon_stats(stats, missing_pokemon_list):
    # Connect to the SQLite database
    connection = sqlite3.connect("data/pokego.db", timeout=30)
    cursor = connection.cursor()

    for stat in stats:
        # Check if this Pokémon is in the missing list
        is_missing = False
        for missing_pokemon in missing_pokemon_list:
            if (stat['pokemon_name'] == missing_pokemon['pokemon_name'] and 
                stat['pokemon_id'] == missing_pokemon['pokemon_id'] and 
                stat['form'] == missing_pokemon['form']):
                is_missing = True
                break

        if is_missing:
            # Try updating the record
            rows_updated = 0
            try:
                cursor.execute('''
                UPDATE pokemon
                SET attack = ?, defense = ?, stamina = ?
                WHERE name = ? AND pokedex_number = ? AND form = ?
                ''', (stat["base_attack"], stat["base_defense"], stat["base_stamina"], stat["pokemon_name"], stat["pokemon_id"], stat["form"]))
                rows_updated = cursor.rowcount

            except sqlite3.Error as e:
                print(f"Database error while updating: {e}")
            
            # If not updated, then insert as new
            if rows_updated == 0:
                insert_pokemon_stat(cursor, stat)

    # Commit the changes and close the connection
    connection.commit()
    connection.close()

# Main section
if __name__ == "__main__":
    missing_pokemon_list = get_missing_pokemon()
    pokemon_stats = fetch_pokemon_stats()

    if not pokemon_stats:
        print("No Pokémon stats retrieved.")
        exit(1)

    # Update the database for the missing Pokémon stats
    update_pokemon_stats(pokemon_stats, missing_pokemon_list)