import requests
import sqlite3

def fetch_pokemon_data():
    print("Starting to fetch Pokémon data...")

    # Define the endpoint URL
    url = "https://pogoapi.net/api/v1/pokemon_names.json"

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

    # Extract the entire data line for each Pokémon, ordered by the key values
    pokemon_data = [data[str(key)] for key in sorted(map(int, data.keys()))]

    print(f"Fetched data for {len(pokemon_data)} Pokémon successfully!")
    return pokemon_data

def store_pokemon_data(pokemons):
    # Connect to the SQLite database
    connection = sqlite3.connect("data/pokego.db")
    cursor = connection.cursor()

    # Insert the Pokémon data
    for pokemon in pokemons:
        cursor.execute(
            "INSERT INTO pokemon (name, pokedex_number) VALUES (?, ?)",
            (pokemon['name'], pokemon['id'])
        )

    # Commit the changes and close the connection
    connection.commit()
    connection.close()
    print("Pokémon data stored successfully!")

if __name__ == "__main__":
    pokemons = fetch_pokemon_data()
    if pokemons:
        store_pokemon_data(pokemons)
    else:
        print("No Pokémon data retrieved.")
