import sqlite3

# Connect to the SQLite database
db_path = '../pokego.db'  # Path to your SQLite database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Step 1: Fetch all pokemon_ids where female_unique is 1 from the pokemon table
cursor.execute("SELECT pokemon_id FROM pokemon WHERE female_unique = 1")
female_pokemon_ids = cursor.fetchall()

# Populate the female_pokemon table with these pokemon_ids
for pokemon_id_tuple in female_pokemon_ids:
    pokemon_id = pokemon_id_tuple[0]
    
    # Insert into female_pokemon if the pokemon_id does not already exist
    cursor.execute("""
        INSERT OR IGNORE INTO female_pokemon (pokemon_id, image_url, shiny_image_url, shadow_image_url, shiny_shadow_image_url)
        VALUES (?, NULL, NULL, NULL, NULL)
    """, (pokemon_id,))

# Commit changes after insertion
conn.commit()

# Step 2: Check which pokemon_ids from female_unique=1 also exist in costume_pokemon
cursor.execute("""
    SELECT DISTINCT cp.pokemon_id 
    FROM costume_pokemon cp
    JOIN pokemon p ON cp.pokemon_id = p.pokemon_id
    WHERE p.female_unique = 1
""")
matching_costume_pokemon_ids = cursor.fetchall()

# Print the pokemon_ids that have at least one matching costume_id in costume_pokemon
if matching_costume_pokemon_ids:
    print("List of pokemon_ids with at least one matching costume in costume_pokemon:")
    for pokemon_id_tuple in matching_costume_pokemon_ids:
        print(pokemon_id_tuple[0])
else:
    print("No pokemon_ids with matching costume entries in the costume_pokemon table.")

# Close the connection
conn.close()
