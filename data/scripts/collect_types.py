import requests
import sqlite3

def fetch_pokemon_types():
    print("Starting to fetch Pokémon types...")

    # Define the endpoint URL
    url = "https://pogoapi.net/api/v1/pokemon_types.json"

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

    print(f"Fetched data for {len(data)} Pokémon types successfully!")
    return data

# ... [rest of the script remains the same]

def update_pokemon_types_in_db(pokemon_types):
    # Connect to the SQLite database
    connection = sqlite3.connect("data/pokego.db", timeout=30)
    cursor = connection.cursor()

    for pokemon in pokemon_types:
        type_1 = pokemon["type"][0]
        type_2 = pokemon["type"][1] if len(pokemon["type"]) > 1 else None
        form_name = pokemon.get("form", "Normal")  # Default to "Normal" if "form" is not present

        # Handling for the Alola exception
        if form_name == "Alola":
            form_name = "Alolan"

        try:
            cursor.execute("SELECT type_id FROM types WHERE name = ?", (type_1,))
            type_1_id = cursor.fetchone()[0]

            if type_2:
                cursor.execute("SELECT type_id FROM types WHERE name = ?", (type_2,))
                type_2_id = cursor.fetchone()[0]
            else:
                type_2_id = None

            cursor.execute('''
            UPDATE pokemon
            SET type_1_id = ?, type_2_id = ?
            WHERE name = ? AND pokedex_number = ? AND form = ?
            ''', (type_1_id, type_2_id, pokemon["pokemon_name"], pokemon["pokemon_id"], form_name))

            if cursor.rowcount == 0:
                print(f"No match in database for {pokemon['pokemon_name']} ({pokemon['pokemon_id']}) with form {form_name}.")
            else:
                print(f"Updated types for {pokemon['pokemon_name']} ({pokemon['pokemon_id']}) with form {form_name}.")

        except sqlite3.Error as e:
            print(f"Database error: {e}")

    # Commit the changes and close the connection
    connection.commit()
    connection.close()

if __name__ == "__main__":
    pokemon_types = fetch_pokemon_types()
    if pokemon_types:
        update_pokemon_types_in_db(pokemon_types)
    else:
        print("No Pokémon types retrieved.")

