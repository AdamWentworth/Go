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
    """
    Process the API data to select only one entry per pokemon_id.
    If a Pokémon has multiple entries, prefer the one with form "Normal".
    Only entries with form "Normal" are returned.
    """
    unique_pokemon = {}
    for entry in data:
        pid = entry["pokemon_id"]
        current_form = entry.get("form", "Normal")
        if pid not in unique_pokemon:
            unique_pokemon[pid] = entry
        else:
            # If an entry already exists but is not "Normal" and the current one is,
            # override the stored entry.
            existing_form = unique_pokemon[pid].get("form", "Normal")
            if current_form == "Normal" and existing_form != "Normal":
                unique_pokemon[pid] = entry

    # Filter to include only those entries whose form is "Normal"
    processed = []
    for entry in unique_pokemon.values():
        if entry.get("form", "Normal") == "Normal":
            processed.append({
                "pokemon_id": entry["pokemon_id"],
                "pokedex_height": entry["pokedex_height"],
                "pokedex_weight": entry["pokedex_weight"],
                "height_standard_deviation": entry["height_standard_deviation"],
                "weight_standard_deviation": entry["weight_standard_deviation"],
                "form": entry.get("form", "Normal")
            })
    return processed

def compute_thresholds(pokemon):
    """
    Compute height and weight thresholds for a Pokémon entry using doubled standard deviations.
    
    The doubled standard deviations are used as follows:
      - new_h_std = height_standard_deviation * 2
      - new_w_std = weight_standard_deviation * 2
      
    Then the thresholds are:
      - XXS: mean - 2 * (new_std)
      - XS:  mean - (new_std)
      - XL:  mean + (new_std)
      - XXL: mean + 2 * (new_std)
    """
    # Double the original standard deviations
    new_h_std = pokemon["height_standard_deviation"] * 2
    new_w_std = pokemon["weight_standard_deviation"] * 2
    h_mean = pokemon["pokedex_height"]
    w_mean = pokemon["pokedex_weight"]

    return {
        "height_xxs_threshold": h_mean - 2 * new_h_std,
        "height_xs_threshold": h_mean - new_h_std,
        "height_xl_threshold": h_mean + new_h_std,
        "height_xxl_threshold": h_mean + 2 * new_h_std,
        "weight_xxs_threshold": w_mean - 2 * new_w_std,
        "weight_xs_threshold": w_mean - new_w_std,
        "weight_xl_threshold": w_mean + new_w_std,
        "weight_xxl_threshold": w_mean + 2 * new_w_std,
    }

def update_database_with_normal_forms(data):
    """
    Update the pokemon_sizes table with entries having form 'Normal'.
    
    For each entry, the thresholds are computed using doubled standard deviations,
    and the doubled standard deviations are stored in the database.
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Ensure the table exists.
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

    # Process each Normal-form entry:
    # - First, compute the doubled standard deviations.
    # - Next, compute thresholds using the doubled standard deviations.
    # - Then insert (or update) the database with these values.
    for pokemon in data:
        # Calculate the doubled standard deviations
        doubled_height_std = pokemon["height_standard_deviation"] * 2
        doubled_weight_std = pokemon["weight_standard_deviation"] * 2

        # Compute thresholds using the doubled values.
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
            pokemon["pokemon_id"],
            pokemon["pokedex_height"],
            pokemon["pokedex_weight"],
            # Store the doubled standard deviations
            doubled_height_std,
            doubled_weight_std,
            thresholds["height_xxs_threshold"],
            thresholds["height_xs_threshold"],
            thresholds["height_xl_threshold"],
            thresholds["height_xxl_threshold"],
            thresholds["weight_xxs_threshold"],
            thresholds["weight_xs_threshold"],
            thresholds["weight_xl_threshold"],
            thresholds["weight_xxl_threshold"]
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

    print("Processing and filtering data (preferring Normal forms)...")
    processed_data = process_pokemon_data(data)

    print("Updating entries with form 'Normal' using doubled standard deviations for thresholds...")
    update_database_with_normal_forms(processed_data)

    print("Done! Database updated.")

if __name__ == "__main__":
    main()
