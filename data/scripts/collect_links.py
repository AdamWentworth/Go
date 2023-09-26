import requests
from bs4 import BeautifulSoup

BASE_URL = "https://bulbapedia.bulbagarden.net"
EVENT_POKEMON_URL = "/wiki/Event_Pok%C3%A9mon_(GO)"
OUTPUT_FILE = "embedded_links.txt"

def get_soup(url):
    response = requests.get(url)
    return BeautifulSoup(response.content, 'html.parser')

soup = get_soup(BASE_URL + EVENT_POKEMON_URL)

# Extract all embedded links
embedded_links = {a['href'] for a in soup.find_all('a', href=True)}

# Save to file
with open(OUTPUT_FILE, 'w') as file:
    for link in embedded_links:
        file.write(link + '\n')

print(f"Saved {len(embedded_links)} unique embedded links to {OUTPUT_FILE}.")
