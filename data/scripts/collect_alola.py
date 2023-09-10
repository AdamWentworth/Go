import requests
import sqlite3

def fetch_alolan_pokemon():
    print("Starting to fetch Alolan Pokémon data...")

    # Define the endpoint URL
    url = "https://pogoapi.net/api/v1/alolan_pokemon.json"

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

    print(f"Fetched data for {len(data)} Alolan Pokémon successfully!")
    return data.values()  # return list of Pokémon dictionaries

def store_alolan_pokemon(pokemons):
    # Connect to the SQLite database
    connection = sqlite3.connect("data/pokego.db")
    cursor = connection.cursor()

    # Insert the Alolan Pokémon data with the "form" attribute set to "Alolan"
    for pokemon in pokemons:
        cursor.execute(
            "INSERT INTO pokemon (name, pokedex_number, form) VALUES (?, ?, 'Alolan')",
            (pokemon['name'], pokemon['id'])
        )

    # Commit the changes and close the connection
    connection.commit()
    connection.close()
    print("Alolan Pokémon data stored successfully!")

if __name__ == "__main__":
    alolan_pokemon = fetch_alolan_pokemon()
    if alolan_pokemon:
        store_alolan_pokemon(alolan_pokemon)
    else:
        print("No Alolan Pokémon data retrieved.")
