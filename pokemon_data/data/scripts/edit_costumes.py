import os
import re
import sqlite3

def get_image_costume_data(image_folder_path):
    pattern = re.compile(r'^pokemon_(\d+)_(.+?)_default\.png$')
    costume_data = {}

    for filename in os.listdir(image_folder_path):
        match = pattern.match(filename)
        if match:
            pokemon_id = int(match.group(1))
            costume_name = match.group(2)

            if pokemon_id not in costume_data:
                costume_data[pokemon_id] = []
            costume_data[pokemon_id].append(costume_name)
    return costume_data

def update_db(database_path, costume_data):
    conn = sqlite3.connect(database_path)
    cursor = conn.cursor()

    for pokemon_id, costume_names in costume_data.items():
        cursor.execute("SELECT costume_name FROM costume_pokemon WHERE pokemon_id=?", (pokemon_id,))
        db_costume_names = [row[0] for row in cursor.fetchall()]

        if len(db_costume_names) != len(costume_names):
            print(f"Discrepancy for pokemon_id {pokemon_id}: DB has {db_costume_names}, images have {costume_names}")
            continue

        for db_name, img_name in zip(db_costume_names, costume_names):
            if db_name != img_name:
                cursor.execute("UPDATE costume_pokemon SET costume_name=? WHERE pokemon_id=? AND costume_name=?", (img_name, pokemon_id, db_name))

    conn.commit()
    conn.close()

if __name__ == "__main__":
    database_path = "D:\Visual-Studio-Code\Go\data\pokego.db"
    image_folder_path = "D:\Visual-Studio-Code\Go\images\costumes"
    
    costume_data = get_image_costume_data(image_folder_path)
    update_db(database_path, costume_data)
