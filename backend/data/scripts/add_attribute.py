import requests
import sqlite3

# Send GET request to the API and fetch data
api_url = "https://pogoapi.net/api/v1/community_days.json"
try:
    response = requests.get(api_url)
    data = response.json()
except requests.RequestException as e:
    print(f"Error fetching data from API: {str(e)}")
    data = []

# Connect to SQLite3 database
conn = sqlite3.connect('D:\\Visual-Studio-Code\\Go\\backend\\data\\pokego.db')
cursor = conn.cursor()

try:
    # Loop through API data and update the shiny_rarity attribute in the database
    for event in data:
        boosted_pokemon = event['boosted_pokemon']
        for pokemon in boosted_pokemon:
            try:
                # Update shiny_rarity attribute in the database
                cursor.execute(
                    "UPDATE pokemon SET shiny_rarity = ? WHERE name = ?",
                    ("community_day", pokemon)
                )
            except sqlite3.Error as e:
                print(f"Database error: {str(e)}")
    
    # Commit changes to the database
    conn.commit()
    print("Database updated successfully.")

except sqlite3.Error as e:
    print(f"Database error: {str(e)}")

finally:
    # Close the database connection
    conn.close()
