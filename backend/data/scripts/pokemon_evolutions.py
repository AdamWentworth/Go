import requests
import sqlite3

API_URL = "https://pogoapi.net/api/v1/pokemon_evolutions.json"

response = requests.get(API_URL)

if response.status_code != 200:
    print("Failed to fetch data from the API.")
    exit()

evolutions_data = response.json()

# Connect to the SQLite database
conn = sqlite3.connect("D:\\Visual-Studio-Code\\Go\\backend\data\\pokego.db")
cursor = conn.cursor()

# A set to keep track of already stored items
stored_items = set()

for data in evolutions_data:
    for evolution in data["evolutions"]:
        # Check and store the item if it's not already stored
        if "item_required" in evolution and evolution["item_required"] not in stored_items:
            cursor.execute("INSERT INTO evolution_items (name) VALUES (?)", (evolution["item_required"],))
            stored_items.add(evolution["item_required"])
            print(f"Stored item: {evolution['item_required']}")

        # Fetch the item_id for the current item if it exists
        item_id = None
        if "item_required" in evolution:
            cursor.execute("SELECT item_id FROM evolution_items WHERE name=?", (evolution["item_required"],))
            item_id = cursor.fetchone()[0]

        # Prepare the 'other' data and other fields
        # This needs to be customized based on what exactly you want to store in 'other'
        other_data = ""
        if "lure_required" in evolution:
            other_data += f"Lure Required: {evolution['lure_required']}. "
        if "no_candy_cost_if_traded" in evolution:
            other_data += "No candy cost if traded. "
        if "only_evolves_in_daytime" in evolution:
            other_data += "Evolves only in daytime. "
        if "only_evolves_in_nighttime" in evolution:
            other_data += "Evolves only at nighttime. "
        if "must_be_buddy_to_evolve" in evolution:
            other_data += "Must be buddy to evolve. "
        if "buddy_distance_required" in evolution:
            other_data += f"Buddy Distance Required: {evolution['buddy_distance_required']}. "
        if "gender_required" in evolution:
            other_data += f"Gender Required: {evolution['gender_required']}."

        # Set trade discount if applicable
        trade_discount = 1 if "no_candy_cost_if_traded" in evolution else None

        # Insert into the pokemon_evolutions table
        cursor.execute("""
            INSERT INTO pokemon_evolutions (pokemon_id, evolves_from, evolves_to, candies_needed, trade_discount, item_id, other)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (data["pokemon_id"], data["pokemon_id"], evolution["pokemon_id"], evolution.get("candy_required", None), trade_discount, item_id, other_data))

        print(f"Stored evolution data for {data['pokemon_name']} evolving to {evolution['pokemon_name']}")

conn.commit()
conn.close()