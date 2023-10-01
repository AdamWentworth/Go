import os
import sqlite3
import requests
from bs4 import BeautifulSoup
from PIL import Image
from io import BytesIO

DATABASE_PATH = "D:\Visual-Studio-Code\Go\data\pokego.db"
BASE_URL = "https://pokemongo.fandom.com/wiki/Pikachu?file=Pikachu_"

def get_costume_names_from_db():
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT costume_name FROM costume_pokemon WHERE pokemon_id=25")
    names = [row[0] for row in cursor.fetchall()]
    conn.close()
    return names

def download_image_from_url(url, save_folder):
    print(f"Accessing URL: {url}")
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'lxml')
    img_div = soup.find('div', class_='media')
    if img_div:
        img_url = img_div.img['src']
        img_name = os.path.basename(img_url).split('/revision')[0]  # extract image name before any revision tags
        print(f"Downloading image from: {img_url}")
        img_response = requests.get(img_url, stream=True)

        # Open the image using Pillow
        image = Image.open(BytesIO(img_response.content))
        
        # Resize the image
        image_resized = image.resize((240, 240))
        
        # Save the resized image in PNG format
        save_path = os.path.join(save_folder, img_name)
        image_resized.save(save_path, "PNG")
        print(f"Saved image to: {save_path}")
    else:
        print(f"No 'media' class found for URL: {url}")

if __name__ == "__main__":
    costume_names = get_costume_names_from_db()
    print(f"Costume names from DB: {costume_names}")
    
    save_folder = 'downloaded_images'
    os.makedirs(save_folder, exist_ok=True)

    for name in costume_names:
        url = BASE_URL + name + "_shiny.png"
        download_image_from_url(url, save_folder)
