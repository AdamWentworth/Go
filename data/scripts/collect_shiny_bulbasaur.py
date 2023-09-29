import os

import requests
from bs4 import BeautifulSoup


def download_image(link, save_directory="."):
    response = requests.get(link, stream=True)
    filename = os.path.join(save_directory, link.split("/")[-1].split("?")[0])
    
    with open(filename, 'wb') as file:
        for chunk in response.iter_content(chunk_size=8192):
            file.write(chunk)
    
    print(f"Downloaded {filename}")

def download_shiny_images_from_url(base_url, save_directory="."):
    response = requests.get(base_url)
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Extract all links that lead to an image (those with "?file=" in them)
    image_links = [a['href'] for a in soup.find_all('a', href=True) if '?file=' in a['href']]

    # Filter out those links which do not have "shiny" in them
    shiny_links = [link for link in image_links if 'shiny' in link]

    for link in shiny_links:
        full_url = f"https://pokemongo.fandom.com{link}"
        response = requests.get(full_url)
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract the direct .png link using the "media" div structure you shared
        media_div = soup.find('div', class_='media')
        if media_div:
            img_tag = media_div.find('img')
            if img_tag and img_tag['src'].endswith('.png'):
                download_image(img_tag['src'], save_directory)

# Main
if __name__ == "__main__":
    url = "https://pokemongo.fandom.com/wiki/Bulbasaur"
    save_directory = "downloaded_images"
    
    if not os.path.exists(save_directory):
        os.makedirs(save_directory)

    download_shiny_images_from_url(url, save_directory)
