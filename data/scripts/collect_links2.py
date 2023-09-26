import os
from io import BytesIO

import requests
from bs4 import BeautifulSoup
from PIL import Image

BASE_URL = "https://bulbapedia.bulbagarden.net/wiki/{name}_(Pok%C3%A9mon)"

def fetch_go_images(url):
    response = requests.get(url)
    if response.status_code != 200:
        print("Error: Unable to fetch the page.")
        return []

    soup = BeautifulSoup(response.text, 'html.parser')
    images = []

    for a in soup.find_all('a', href=True, class_='image'):
        if "File:GO" in a['href'] and ".png" in a['href']:
            images.append(a['href'])

    return images

def save_links_to_file(links, filename="image_links.txt"):
    with open(filename, 'a') as file:
        for link in links:
            file.write("https://bulbapedia.bulbagarden.net" + link + "\n")
        print(f"Saved {len(links)} links to {filename}")

def download_images_from_links(file="image_links.txt"):
    if not os.path.exists("costumes"):
        os.mkdir("costumes")
    
    with open(file, 'r') as f:
        links = f.readlines()

    for link in links:
        link = link.strip()
        response = requests.get(link)
        if response.status_code != 200:
            print(f"Error: Unable to fetch the page for {link}.")
            continue

        soup = BeautifulSoup(response.text, 'html.parser')
        img_tag = soup.find('img', width='256', height='256')
        if not img_tag or 'src' not in img_tag.attrs:
            print(f"Couldn't find 256px image for {link}. Skipping.")
            continue

        img_link = "https:" + img_tag['src']

        response = requests.get(img_link)
        if response.status_code != 200:
            print(f"Error: Unable to fetch the image at {img_link}.")
            continue
        
        img = Image.open(BytesIO(response.content))
        img = img.resize((240, 240))

        number = link.split("GO")[-1].split(".")[0].lstrip('0')
        costume_name = link.split(number)[-1].split(".")[0]
        if not costume_name:
            costume_name = "default"
        img_filename = f"pokemon_{number}_{costume_name}.png"
        img_path = os.path.join("costumes", img_filename)
        img.save(img_path)
        print(f"Saved {img_path}")
        
if __name__ == "__main__":
    # Ensure the file starts empty
    if os.path.exists("image_links.txt"):
        os.remove("image_links.txt")

    # Load pokemon names
    with open("unique_pokemon_with_costumes.txt", 'r') as file:
        pokemon_names = file.readlines()

    for pokemon in pokemon_names:
        pokemon = pokemon.strip()
        print(f"Fetching images for {pokemon}...")
        url = BASE_URL.format(name=pokemon)
        go_images = fetch_go_images(url)
        save_links_to_file(go_images)

    download_images_from_links()
