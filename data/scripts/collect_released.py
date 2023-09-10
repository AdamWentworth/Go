import requests
import sqlite3

def fetch_released_pokemon():
    print("Starting to fetch released Pokémon data...")

    # Define the endpoint URL
    url = "https://pogoapi.net/api/v1/released_pokemon.json"

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

    # Extract the names of the released Pokémon from the API response
    released_pokemon_names = [entry['name'] for entry in data.values()]

    print(f"Fetched data for {len(released_pokemon_names)} released Pokémon successfully!")
    return released_pokemon_names

def update_database(released_pokemon_names):
    # Connect to the SQLite database
    connection = sqlite3.connect("data/pokego.db")
    cursor = connection.cursor()

    # Fetch all Pokémon names from the database
    cursor.execute("SELECT name FROM pokemon")
    db_pokemon_names = [row[0] for row in cursor.fetchall()]

    # Update the "available" attribute for each Pokémon in the database
    for name in db_pokemon_names:
        if name in released_pokemon_names:
            cursor.execute("UPDATE pokemon SET available = ? WHERE name = ?", (True, name))
        else:
            cursor.execute("UPDATE pokemon SET available = ? WHERE name = ?", (False, name))

    # Commit the changes and close the connection
    connection.commit()
    connection.close()
    print("Database updated successfully!")

if __name__ == "__main__":
    released_pokemon_names = fetch_released_pokemon()
    if released_pokemon_names:
        update_database(released_pokemon_names)
    else:
        print("No released Pokémon data retrieved.")
