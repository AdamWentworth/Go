import requests
import sqlite3

def fetch_pokemon_gender():
    print("Fetching Pokémon gender ratios...")

    # Define the endpoint URL
    url = "https://pogoapi.net/api/v1/pokemon_genders.json"

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
        return {}

    # Load the response JSON data
    data = response.json()
    print("Fetched Pokémon gender ratios successfully!")
    return data

def update_pokemon_gender_ratio(gender_data):
    # Connect to the SQLite database
    connection = sqlite3.connect("data/pokego.db", timeout=30)
    cursor = connection.cursor()

    for ratio_group, pokemons in gender_data.items():
        for pokemon in pokemons:
            # Calculate the gender ratio
            gender = pokemon["gender"]
            if "male_percent" in gender:
                male_ratio = float(gender["male_percent"]) * 100
            else:
                male_ratio = 0
            if "female_percent" in gender:
                female_ratio = float(gender["female_percent"]) * 100
            else:
                female_ratio = 0
            if "genderless_percent" in gender:
                genderless_ratio = float(gender["genderless_percent"]) * 100
            else:
                genderless_ratio = 0

            gender_ratio_str = f"{int(male_ratio)}M_{int(female_ratio)}F_{int(genderless_ratio)}GL"

            try:
                cursor.execute('''
                UPDATE pokemon
                SET gender_rate = ?
                WHERE name = ? AND pokedex_number = ?
                ''', (gender_ratio_str, pokemon["pokemon_name"], pokemon["pokemon_id"]))

                if cursor.rowcount == 0:
                    print(f"No match in database for {pokemon['pokemon_name']} ({pokemon['pokemon_id']}).")
                else:
                    print(f"Updated gender ratio for {pokemon['pokemon_name']} ({pokemon['pokemon_id']}).")

            except sqlite3.Error as e:
                print(f"Database error: {e}")

    # Commit the changes and close the connection
    connection.commit()
    connection.close()

if __name__ == "__main__":
    gender_data = fetch_pokemon_gender()
    if gender_data:
        update_pokemon_gender_ratio(gender_data)
    else:
        print("No Pokémon gender data retrieved.")
