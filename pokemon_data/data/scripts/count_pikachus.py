import os
import sqlite3
import re

def count_db_entries(database_path, pokemon_id):
    conn = sqlite3.connect(database_path)
    cursor = conn.cursor()

    query = "SELECT COUNT(*) FROM costume_pokemon WHERE pokemon_id=?"
    cursor.execute(query, (pokemon_id,))
    count = cursor.fetchone()[0]

    conn.close()
    return count

def count_image_files(image_folder_path, pokemon_id):
    pattern = re.compile(rf'^pokemon_{pokemon_id}_.+_default\.png$')
    count = 0

    for filename in os.listdir(image_folder_path):
        if pattern.match(filename):
            count += 1

    return count

if __name__ == "__main__":
    database_path = "D:\Visual-Studio-Code\Go\data\pokego.db"
    image_folder_path = "D:\Visual-Studio-Code\Go\images\costumes"
    pokemon_id = 25

    db_count = count_db_entries(database_path, pokemon_id)
    img_count = count_image_files(image_folder_path, pokemon_id)

    print(f"Number of entries in the database for pokemon_id {pokemon_id}: {db_count}")
    print(f"Number of images in the folder for pokemon_id {pokemon_id}: {img_count}")

    if db_count != img_count:
        print(f"Discrepancy: There's a difference of {abs(db_count - img_count)} between the database entries and image files.")
