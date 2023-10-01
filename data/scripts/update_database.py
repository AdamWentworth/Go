import os
import sqlite3
import re

# Constants for paths
COSTUMES_FOLDER = "D:/Visual-Studio-Code/Go/images/costumes"
DATABASE_PATH = "D:/Visual-Studio-Code/Go/data/pokego.db"

def extract_pokemon_info(filename):
    """Extracts the pokemon_id and costume_name from the filename."""
    match = re.match(r'pokemon_(\d+)_(.+)_default\.png', filename)
    if match:
        pokemon_id = int(match.group(1))
        costume_name = match.group(2)
        return pokemon_id, costume_name
    return None, None

def main():
    # Connect to the database
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    # List files in the costumes folder
    costume_files = os.listdir(COSTUMES_FOLDER)

    # Dictionary to hold pokemon_id and their respective costume names
    pokemon_costumes = {}

    for costume_file in costume_files:
        pokemon_id, costume_name = extract_pokemon_info(costume_file)
        if pokemon_id and costume_name:
            pokemon_costumes.setdefault(pokemon_id, []).append(costume_name)

    for pokemon_id, new_costumes in pokemon_costumes.items():
        
        cursor.execute("SELECT rowid, costume_name FROM costume_pokemon WHERE pokemon_id=?", (pokemon_id,))
        rows = cursor.fetchall()
        
        if len(rows) != len(new_costumes):
            print(f"Discrepancy for pokemon_id {pokemon_id}: DB has {len(rows)} entries, folder has {len(new_costumes)} files.")
            continue
        
        for idx, (rowid, _) in enumerate(rows):
            cursor.execute("UPDATE costume_pokemon SET costume_name=? WHERE rowid=?", (new_costumes[idx], rowid))
            print(f"Updated row {rowid} with costume_name {new_costumes[idx]} for pokemon_id {pokemon_id}")


    conn.commit()
    conn.close()

if __name__ == "__main__":
    main()
