import os
import re
import sqlite3
import requests
from PIL import Image
from io import BytesIO

def get_pokemon_id_from_db(database_path, pokemon_name):
    conn = sqlite3.connect(database_path)
    cursor = conn.cursor()
    cursor.execute("SELECT pokemon_id FROM pokemon WHERE name=?", (pokemon_name,))
    pokemon_id = cursor.fetchone()
    conn.close()
    
    if pokemon_id:
        return pokemon_id[0]
    else:
        return None

def download_image(url, save_folder):
    # Extracting species and costume name from the URL
    match = re.search(r'/images/.+?/.+?/(.+?)\.png', url)
    if not match:
        print(f"Could not extract species and costume name from URL: {url}")
        return
    
    species_costume_name = match.group(1)
    
    # Extracting species name (assuming the costume name and '_shiny' follows the species name)
    species_name_match = re.search(r'^([A-Za-z]+)_', species_costume_name)
    if not species_name_match:
        print(f"Could not extract species name from: {species_costume_name}")
        return
    
    species_name = species_name_match.group(1)
    
    # Get pokemon_id from the database
    database_path = "D:/Visual-Studio-Code/Go/data/pokego.db"
    pokemon_id = get_pokemon_id_from_db(database_path, species_name)
    if not pokemon_id:
        print(f"Could not find pokemon_id for species: {species_name}")
        return
    
    # Removing the species name from the species_costume_name
    costume_name = species_costume_name.replace(f"{species_name}_", "", 1)

    # Construct the save path
    filename = f"pokemon_{pokemon_id}_{costume_name}_default.png"
    save_path = os.path.join(save_folder, filename)
    
    # Fetch and save the image
    response = requests.get(url, stream=True)
    response.raise_for_status()  # Raise an exception for HTTP errors
    
    image = Image.open(BytesIO(response.content))
    image_resized = image.resize((240, 240))
    image_resized.save(save_path, "PNG")
    print(f"Image downloaded, resized, and saved to {save_path}")

if __name__ == "__main__":
    image_url = "https://static.wikia.nocookie.net/pokemongo/images/1/1c/Gourgeist_super_halloween.png/revision/latest?cb=20221023171033"
    save_folder = "D:/Visual-Studio-Code/Go/images/costumes"
    
    download_image(image_url, save_folder)
