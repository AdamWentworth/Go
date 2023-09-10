import requests
import sqlite3

def fetch_pokemon_generations():
    print("Fetching Pokémon generation data...")

    # Define the endpoint URL
    url = "https://pogoapi.net/api/v1/pokemon_generations.json"

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
    print("Fetched Pokémon generation data successfully!")
    return data

def update_pokemon_generation(gen_data):
    # Connect to the SQLite database
    connection = sqlite3.connect("data/pokego.db", timeout=30)
    cursor = connection.cursor()

    for generation, pokemons in gen_data.items():
        for pokemon in pokemons:
            try:
                cursor.execute('''
                UPDATE pokemon
                SET generation = ?
                WHERE name = ? AND pokedex_number = ?
                ''', (pokemon["generation_number"], pokemon["name"], pokemon["id"]))

                if cursor.rowcount == 0:
                    print(f"No match in database for {pokemon['name']} ({pokemon['id']}).")
                else:
                    print(f"Updated generation for {pokemon['name']} ({pokemon['id']}) to {pokemon['generation_number']}.")

            except sqlite3.Error as e:
                print(f"Database error: {e}")

    # Special handling for Alolan and Galarian forms
    try:
        cursor.execute('''
        UPDATE pokemon
        SET generation = 7
        WHERE form = 'Alolan'
        ''')
        print(f"Updated Alolan forms to Generation 7.")

        cursor.execute('''
        UPDATE pokemon
        SET generation = 8
        WHERE form = 'Galarian'
        ''')
        print(f"Updated Galarian forms to Generation 8.")

    except sqlite3.Error as e:
        print(f"Database error while updating special forms: {e}")

    # Commit the changes and close the connection
    connection.commit()
    connection.close()

if __name__ == "__main__":
    gen_data = fetch_pokemon_generations()
    if gen_data:
        update_pokemon_generation(gen_data)
    else:
        print("No Pokémon generation data retrieved.")
