import sqlite3

def update_image_paths_in_shadow_pokemon_table(db_path):
    # Connect to the SQLite database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Fetch all relevant Pokemon entries
    cursor.execute("SELECT pokemon_id, shiny_available, apex FROM shadow_pokemon")
    pokemon_entries = cursor.fetchall()

    # Iterate through each Pokemon entry and update image paths
    for pokemon_id, shadow_shiny_available, shadow_apex in pokemon_entries:
        shadowImagePath = None
        shinyShadowImagePath = None

        # Check if Pokemon exists in shadow_pokemon table
        if shadow_shiny_available is not None or shadow_apex is not None:
            shadowImagePath = f"/images/shadow/shadow_pokemon_{pokemon_id}.png"
            shinyShadowImagePath = f"/images/shiny_shadow/shiny_shadow_pokemon_{pokemon_id}.png"

        # Update the database entry
        cursor.execute("""
            UPDATE shadow_pokemon 
            SET image_url_shadow = ?, image_url_shiny_shadow = ? 
            WHERE pokemon_id = ?
        """, (shadowImagePath, shinyShadowImagePath, pokemon_id))

    # Commit changes and close the connection
    conn.commit()
    conn.close()

# Path to your 'pokego.db' database
db_path = 'backend/data/pokego.db'
update_image_paths_in_shadow_pokemon_table(db_path)
