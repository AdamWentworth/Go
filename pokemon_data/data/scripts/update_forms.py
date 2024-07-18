import sqlite3
import os
import re

# Paths to image directories
IMAGE_DIRS = {
    'default': 'A:/Visual-Studio-Code/Go/frontend/public/images/default',
    'shiny': 'A:/Visual-Studio-Code/Go/frontend/public/images/shiny',
    'shadow': 'A:/Visual-Studio-Code/Go/frontend/public/images/shadow',
    'shiny_shadow': 'A:/Visual-Studio-Code/Go/frontend/public/images/shiny_shadow'
}

def update_pokemon_ids_and_images(conn):
    cursor = conn.cursor()

    # Find all pokemon_ids >= 1011
    cursor.execute("SELECT pokemon_id FROM pokemon WHERE pokemon_id >= 1011")
    pokemon_ids = cursor.fetchall()

    for (old_id,) in pokemon_ids:
        new_id = old_id + 1000

        # Update pokemon_id in the pokemon table
        cursor.execute("""
            UPDATE pokemon
            SET pokemon_id = ?, image_url = ?, image_url_shiny = ?
            WHERE pokemon_id = ?
        """, (new_id, f'/images/default/pokemon_{new_id}.png', f'/images/shiny/shiny_pokemon_{new_id}.png', old_id))

        # Update pokemon_id in the shadow_pokemon table
        cursor.execute("""
            UPDATE shadow_pokemon
            SET pokemon_id = ?, image_url_shadow = ?, image_url_shiny_shadow = ?
            WHERE pokemon_id = ?
        """, (new_id, f'/images/shadow/shadow_pokemon_{new_id}.png', f'/images/shiny_shadow/shiny_shadow_pokemon_{new_id}.png', old_id))

        # Update foreign keys in pokemon_evolutions table
        cursor.execute("""
            UPDATE pokemon_evolutions
            SET pokemon_id = ?
            WHERE pokemon_id = ?
        """, (new_id, old_id))
        cursor.execute("""
            UPDATE pokemon_evolutions
            SET evolves_to = ?
            WHERE evolves_to = ?
        """, (new_id, old_id))
        cursor.execute("""
            UPDATE pokemon_evolutions
            SET evolution_id = ?
            WHERE evolution_id = ?
        """, (new_id, old_id))

        # Update foreign keys in pokemon_moves table
        cursor.execute("""
            UPDATE pokemon_moves
            SET pokemon_id = ?
            WHERE pokemon_id = ?
        """, (new_id, old_id))

        # Rename image files
        rename_image_files(old_id, new_id)

    conn.commit()

def rename_image_files(old_id, new_id):
    for folder, path in IMAGE_DIRS.items():
        for filename in os.listdir(path):
            if re.match(f".*_{old_id}\.png$", filename):
                new_filename = filename.replace(f'_{old_id}.png', f'_{new_id}.png')
                os.rename(os.path.join(path, filename), os.path.join(path, new_filename))

def main():
    # Connect to the SQLite database
    conn = sqlite3.connect('../pokego.db')
    
    # Disable foreign key checks temporarily
    conn.execute('PRAGMA foreign_keys = OFF')

    # Perform the updates
    update_pokemon_ids_and_images(conn)

    # Enable foreign key checks again
    conn.execute('PRAGMA foreign_keys = ON')

    # Close the connection
    conn.close()

    print("Pokemon IDs, foreign keys, and images have been updated successfully.")

if __name__ == "__main__":
    main()
