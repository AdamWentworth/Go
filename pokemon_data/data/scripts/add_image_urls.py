import sqlite3

def update_pokemon_table(db_path):
    # Connect to the SQLite database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Fetch all Pokemon entries
    cursor.execute("SELECT pokemon_id FROM pokemon")
    pokemon_entries = cursor.fetchall()

    # Iterate through each Pokemon entry and update image paths
    for (pokemon_id,) in pokemon_entries:
        regular_image_path = f"/images/default/pokemon_{pokemon_id}.png"
        shiny_image_path = f"/images/shiny/shiny_pokemon_{pokemon_id}.png"

        # Update the database entry
        cursor.execute("UPDATE pokemon SET image_url = ?, image_url_shiny = ? WHERE pokemon_id = ?", 
                       (regular_image_path, shiny_image_path, pokemon_id))

    # Commit changes and close the connection
    conn.commit()
    conn.close()

# Path to your 'pokego.db' database
db_path = 'backend/data/pokego.db'
update_pokemon_table(db_path)
