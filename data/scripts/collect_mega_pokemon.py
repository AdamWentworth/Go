import sqlite3
import requests

def fetch_pokemon_id(connection, pokemon_name):
    cursor = connection.cursor()
    cursor.execute('''
        SELECT pokemon_id
        FROM pokemon
        WHERE name = ?
    ''', (pokemon_name,))
    result = cursor.fetchone()
    return result[0] if result else None

def update_mega_energy_cost():
    # Connect to the SQLite database
    connection = sqlite3.connect("data/pokego.db", timeout=30)
    cursor = connection.cursor()
    
    # Fetch the mega_pokemon data from the endpoint
    response = requests.get("https://pogoapi.net/api/v1/mega_pokemon.json")
    mega_pokemon_data = response.json()

    for mega in mega_pokemon_data:
        pokemon_id = fetch_pokemon_id(connection, mega["pokemon_name"])
        if pokemon_id:
            first_time_energy = mega["first_time_mega_energy_required"]
            
            # Update mega_energy_cost in mega_evolution table
            cursor.execute('''
                UPDATE mega_evolution
                SET mega_energy_cost = ?
                WHERE pokemon_id = ?
            ''', (first_time_energy, pokemon_id))

    # Commit the changes and close the connection
    connection.commit()
    connection.close()

if __name__ == "__main__":
    update_mega_energy_cost()
