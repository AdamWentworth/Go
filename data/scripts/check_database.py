import os
import sqlite3

def get_db_entries(database_path):
    conn = sqlite3.connect(database_path)
    cursor = conn.cursor()
    
    query = "SELECT pokemon_id, costume_name FROM costume_pokemon"
    cursor.execute(query)
    
    # Create a list of formatted strings based on db values
    db_entries = [f"pokemon_{row[0]}{row[1]}_default.png" for row in cursor.fetchall()]
    
    conn.close()
    return db_entries

def get_image_files(image_folder_path):
    return [filename for filename in os.listdir(image_folder_path) if filename.endswith('_default.png')]

def compare_lists(db_entries, image_files):
    matches = [file for file in image_files if file in db_entries]
    no_matches = [file for file in image_files if file not in db_entries]
    
    return matches, no_matches

if __name__ == "__main__":
    database_path = "D:\Visual-Studio-Code\Go\data\pokego.db"
    image_folder_path = "D:\Visual-Studio-Code\Go\images\costumes"
    
    db_entries = get_db_entries(database_path)
    image_files = get_image_files(image_folder_path)
    
    matches, no_matches = compare_lists(db_entries, image_files)

    print("Matches:")
    for match in matches:
        print(match)
    print("\nNo Matches:")
    for no_match in no_matches:
        print(no_match)
