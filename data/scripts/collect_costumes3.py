import os

import requests
from bs4 import BeautifulSoup

BASE_URL = "https://bulbapedia.bulbagarden.net"
EVENT_POKEMON_URL = "/wiki/Event_Pokémon_(GO)"
COSTUMES_DIR = "costumes"

# Ensure the costumes directory exists
if not os.path.exists(COSTUMES_DIR):
    os.makedirs(COSTUMES_DIR)

def get_soup(url):
    response = requests.get(url)
    return BeautifulSoup(response.content, 'html.parser')

def download_image(url, filename):
    response = requests.get(url, stream=True)
    with open(filename, 'wb') as file:
        for chunk in response.iter_content(chunk_size=8192):
            file.write(chunk)

soup = get_soup(BASE_URL + EVENT_POKEMON_URL)
pokemon_links = [a['href'] for a in soup.select('a[title$="(Pokémon)"]')]

print(f"Found {len(pokemon_links)} Pokémon links.")

for link in pokemon_links:
    print(f"Processing {link}...")
    pokemon_soup = get_soup(BASE_URL + link)
    costumes_section = pokemon_soup.find('span', {'id': 'Costumes_in_Pokémon_GO'})
    if costumes_section:
        image_links = [img['src'] for img in costumes_section.find_next('table').select('img')]
        print(f"Found {len(image_links)} costume images for {link}.")
        for img_link in image_links:
            img_page_soup = get_soup(BASE_URL + img_link)
            img_256px_link_element = img_page_soup.find('a', text='256px')
            if img_256px_link_element:
                img_256px_link = img_256px_link_element['href']
                filename = os.path.join(COSTUMES_DIR, img_256px_link.split('/')[-1])
                print(f"Downloading image from {img_256px_link} to {filename}...")
                download_image(img_256px_link, filename)
            else:
                print(f"No 256px image found for {img_link}.")
    else:
        print(f"No costumes section found for {link}.")

print("Download complete!")
