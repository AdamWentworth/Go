import os
import requests
from bs4 import BeautifulSoup

URL = "https://bulbapedia.bulbagarden.net/wiki/Event_Pok%C3%A9mon_(GO)"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

response = requests.get(URL, headers=HEADERS)
soup = BeautifulSoup(response.content, "html.parser")

# Create a directory to save the images
if not os.path.exists("bulbapedia_images"):
    os.mkdir("bulbapedia_images")

for img_tag in soup.find_all("img"):
    img_url = img_tag["src"]
    if not img_url.startswith("http"):
        img_url = "https:" + img_url
    img_name = os.path.join("bulbapedia_images", os.path.basename(img_url))
    with open(img_name, "wb") as img_file:
        img_file.write(requests.get(img_url).content)

print("Images downloaded successfully!")
