import os
import sqlite3
import re

def get_db_costume_names(database_path, pokemon_id):
    conn = sqlite3.connect(database_path)
    cursor = conn.cursor()

    query = "SELECT costume_name FROM costume_pokemon WHERE pokemon_id=?"
    cursor.execute(query, (pokemon_id,))
    names = [row[0].replace('_', '') for row in cursor.fetchall()]

    conn.close()
    return names

def get_image_costume_names(image_folder_path, pokemon_id):
    pattern = re.compile(rf'^pokemon_{pokemon_id}_(.+?)_default\.png$')
    names = []

    for filename in os.listdir(image_folder_path):
        match = pattern.match(filename)
        if match:
            names.append(match.group(1).replace('_', ''))
            
    return names

if __name__ == "__main__":
    database_path = "D:\Visual-Studio-Code\Go\data\pokego.db"
    image_folder_path = "D:\Visual-Studio-Code\Go\images\costumes"
    pokemon_id = 26

    db_names = set(get_db_costume_names(database_path, pokemon_id))
    img_names = set(get_image_costume_names(image_folder_path, pokemon_id))

    db_only = db_names - img_names
    img_only = img_names - db_names

    print("Names present in database but not in images:", db_only)
    print("Names present in images but not in database:", img_only)
