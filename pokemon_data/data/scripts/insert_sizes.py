import sqlite3
import requests

# API URL
API_URL = "https://pogoapi.net/api/v1/pokemon_height_weight_scale.json"

# SQLite Database
DB_PATH = "../pokego.db"

def fetch_pokemon_data():
    """Fetch Pokémon size data from API."""
    try:
        response = requests.get(API_URL)
        response.raise_for_status()  # Raises HTTPError for bad responses
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")
        return []

def process_pokemon_data(data):
    """Process and filter the API data to keep only one entry per pokemon_id."""
    unique_pokemon = {}

    for entry in data:
        pokemon_id = entry["pokemon_id"]
        if pokemon_id not in unique_pokemon:
            unique_pokemon[pokemon_id] = {
                "pokemon_id": pokemon_id,
                "pokedex_height": entry["pokedex_height"],
                "pokedex_weight": entry["pokedex_weight"],
                "height_standard_deviation": entry["height_standard_deviation"],
                "weight_standard_deviation": entry["weight_standard_deviation"],
            }

    return list(unique_pokemon.values())

def compute_thresholds(pokemon):
    """Compute height and weight thresholds for a Pokémon entry."""
    h_std = pokemon["height_standard_deviation"]
    w_std = pokemon["weight_standard_deviation"]
    h_mean = pokemon["pokedex_height"]
    w_mean = pokemon["pokedex_weight"]

    return {
        "height_xxs_threshold": h_mean - 2 * h_std,
        "height_xs_threshold": h_mean - h_std,
        "height_xl_threshold": h_mean + h_std,
        "height_xxl_threshold": h_mean + 2 * h_std,
        "weight_xxs_threshold": w_mean - 2 * w_std,
        "weight_xs_threshold": w_mean - w_std,
        "weight_xl_threshold": w_mean + w_std,
        "weight_xxl_threshold": w_mean + 2 * w_std,
    }

def insert_into_database(data):
    """Insert processed Pokémon size data into SQLite database."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Ensure table exists without generated columns
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pokemon_sizes (
            pokemon_id INTEGER PRIMARY KEY,
            pokedex_height REAL NOT NULL,
            pokedex_weight REAL NOT NULL,
            height_standard_deviation REAL NOT NULL,
            weight_standard_deviation REAL NOT NULL,
            height_xxs_threshold REAL NOT NULL,
            height_xs_threshold REAL NOT NULL,
            height_xl_threshold REAL NOT NULL,
            height_xxl_threshold REAL NOT NULL,
            weight_xxs_threshold REAL NOT NULL,
            weight_xs_threshold REAL NOT NULL,
            weight_xl_threshold REAL NOT NULL,
            weight_xxl_threshold REAL NOT NULL,
            FOREIGN KEY (pokemon_id) REFERENCES pokemon (pokemon_id) ON DELETE CASCADE
        )
    """)

    for pokemon in data:
        thresholds = compute_thresholds(pokemon)

        cursor.execute("""
            INSERT INTO pokemon_sizes (
                pokemon_id, pokedex_height, pokedex_weight,
                height_standard_deviation, weight_standard_deviation,
                height_xxs_threshold, height_xs_threshold, height_xl_threshold, height_xxl_threshold,
                weight_xxs_threshold, weight_xs_threshold, weight_xl_threshold, weight_xxl_threshold
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(pokemon_id) DO UPDATE SET
                pokedex_height = excluded.pokedex_height,
                pokedex_weight = excluded.pokedex_weight,
                height_standard_deviation = excluded.height_standard_deviation,
                weight_standard_deviation = excluded.weight_standard_deviation,
                height_xxs_threshold = excluded.height_xxs_threshold,
                height_xs_threshold = excluded.height_xs_threshold,
                height_xl_threshold = excluded.height_xl_threshold,
                height_xxl_threshold = excluded.height_xxl_threshold,
                weight_xxs_threshold = excluded.weight_xxs_threshold,
                weight_xs_threshold = excluded.weight_xs_threshold,
                weight_xl_threshold = excluded.weight_xl_threshold,
                weight_xxl_threshold = excluded.weight_xxl_threshold
        """, (
            pokemon["pokemon_id"], pokemon["pokedex_height"], pokemon["pokedex_weight"],
            pokemon["height_standard_deviation"], pokemon["weight_standard_deviation"],
            thresholds["height_xxs_threshold"], thresholds["height_xs_threshold"], 
            thresholds["height_xl_threshold"], thresholds["height_xxl_threshold"],
            thresholds["weight_xxs_threshold"], thresholds["weight_xs_threshold"], 
            thresholds["weight_xl_threshold"], thresholds["weight_xxl_threshold"]
        ))

    conn.commit()
    conn.close()

def main():
    """Main function to run the data pipeline."""
    print("Fetching Pokémon data...")
    data = fetch_pokemon_data()
    
    if not data:
        print("No data fetched. Exiting.")
        return

    print("Processing and filtering data...")
    processed_data = process_pokemon_data(data)

    print(f"Inserting {len(processed_data)} Pokémon entries into the database...")
    insert_into_database(processed_data)

    print("Done! Pokémon size data updated.")

if __name__ == "__main__":
    main()
