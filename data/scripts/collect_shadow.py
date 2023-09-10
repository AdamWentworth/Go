import sqlite3
import requests

def fetch_pokemon_id(connection, pokemon_name):
    cursor = connection.cursor()
    cursor.execute('''
        SELECT pokemon_id 
        FROM pokemon
        WHERE name = ?
    ''', (pokemon_name,))
    result = cursor.fetchone()
    return result[0] if result else None

def store_shadow_pokemon():
    # Connect to the SQLite database
    connection = sqlite3.connect("data/pokego.db", timeout=30)
    cursor = connection.cursor()
    
    # Fetch the shadow_pokemon data from the endpoint
    response = requests.get("https://pogoapi.net/api/v1/shadow_pokemon.json")
    shadow_pokemon_data = response.json()

    for key, pokemon_data in shadow_pokemon_data.items():
        pokemon_name = pokemon_data["name"]
        pokemon_id = fetch_pokemon_id(connection, pokemon_name)

        if not pokemon_id:
            print(f"No matching Pokémon found for: {pokemon_name}")
            continue

        # Insert into shadow_pokemon
        cursor.execute('''
            INSERT INTO shadow_pokemon (pokemon_id, shiny_available, apex)
            VALUES (?, NULL, NULL)
        ''', (pokemon_id,))

    # Commit the changes and close the connection
    connection.commit()
    connection.close()

if __name__ == "__main__":
    store_shadow_pokemon()
