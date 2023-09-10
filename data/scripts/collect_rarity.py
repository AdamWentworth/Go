import requests
import sqlite3

def fetch_pokemon_rarity():
    print("Fetching Pokémon rarity data...")

    # Define the endpoint URL
    url = "https://pogoapi.net/api/v1/pokemon_rarity.json"

    # Send a GET request to the endpoint
    try:
        response = requests.get(url)
        response.raise_for_status()  # Raise an exception for HTTP errors, if any
    except requests.RequestException as e:
        print(f"Error occurred while fetching data: {e}")
        return {}

    # Check if the response has valid JSON content
    if not response.headers.get('content-type') == 'application/json':
        print("Unexpected content received. Expected JSON.")
        return {}

    # Load the response JSON data
    data = response.json()
    print("Fetched Pokémon rarity data successfully!")
    return data

def update_pokemon_rarity(rarity_data):
    # Connect to the SQLite database
    connection = sqlite3.connect("data/pokego.db", timeout=30)
    cursor = connection.cursor()

    for rarity_type, pokemons in rarity_data.items():
        for pokemon in pokemons:
            try:
                cursor.execute('''
                UPDATE pokemon
                SET rarity = ?
                WHERE name = ? AND pokedex_number = ?
                ''', (rarity_type, pokemon["pokemon_name"], pokemon["pokemon_id"]))

                if cursor.rowcount == 0:
                    print(f"No match in database for {pokemon['pokemon_name']} ({pokemon['pokemon_id']}).")
                else:
                    print(f"Updated rarity for {pokemon['pokemon_name']} ({pokemon['pokemon_id']}) to {rarity_type}.")

            except sqlite3.Error as e:
                print(f"Database error: {e}")

    # Commit the changes and close the connection
    connection.commit()
    connection.close()

if __name__ == "__main__":
    rarity_data = fetch_pokemon_rarity()
    if rarity_data:
        update_pokemon_rarity(rarity_data)
    else:
        print("No Pokémon rarity data retrieved.")
