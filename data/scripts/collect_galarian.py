import requests
import sqlite3

def fetch_galarian_pokemon():
    print("Starting to fetch Galarian Pokémon data...")

    # Define the endpoint URL
    url = "https://pogoapi.net/api/v1/galarian_pokemon.json"

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

    print(f"Fetched data for {len(data)} Galarian Pokémon successfully!")
    return data.values()

def store_galarian_pokemon(pokemons):
    # Connect to the SQLite database
    connection = sqlite3.connect("data/pokego.db")
    cursor = connection.cursor()

    # Insert the Galarian Pokémon data with the "form" attribute set to "Galarian"
    for pokemon in pokemons:
        cursor.execute(
            "INSERT INTO pokemon (name, pokedex_number, form) VALUES (?, ?, 'Galarian')",
            (pokemon['name'], pokemon['id'])
        )

    # Commit the changes and close the connection
    connection.commit()
    connection.close()
    print("Galarian Pokémon data stored successfully!")

if __name__ == "__main__":
    galarian_pokemon = fetch_galarian_pokemon()
    if galarian_pokemon:
        store_galarian_pokemon(galarian_pokemon)
    else:
        print("No Galarian Pokémon data retrieved.")
