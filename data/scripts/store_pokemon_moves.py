import sqlite3
import requests

def fetch_pokemon_id(connection, pokemon_name, form):
    cursor = connection.cursor()
    
    if form == "Normal":
        cursor.execute('''
            SELECT pokemon_id 
            FROM pokemon
            WHERE name = ? AND form IS NULL
        ''', (pokemon_name,))
    elif form == "Alola":
        cursor.execute('''
            SELECT pokemon_id 
            FROM pokemon
            WHERE name = ? AND form = "Alolan"
        ''', (pokemon_name,))
    else:
        cursor.execute('''
            SELECT pokemon_id 
            FROM pokemon
            WHERE name = ? AND form = ?
        ''', (pokemon_name, form))

    result = cursor.fetchone()
    if result:
        return result[0]
    else:
        print(f"No matching Pokémon found for: {pokemon_name} with form {form}")
        return None


def fetch_move_id(connection, move_name):
    cursor = connection.cursor()
    cursor.execute('''
        SELECT move_id
        FROM moves
        WHERE name = ?
    ''', (move_name,))
    result = cursor.fetchone()
    if result:
        return result[0]
    else:
        print(f"No matching move found for: {move_name}")
        return None

def store_current_pokemon_moves():
    # Connect to the SQLite database
    connection = sqlite3.connect("data/pokego.db", timeout=30)
    cursor = connection.cursor()
    
    # Fetch the current_pokemon_moves data from the endpoint
    response = requests.get("https://pogoapi.net/api/v1/current_pokemon_moves.json")
    current_pokemon_moves = response.json()

    for pokemon_data in current_pokemon_moves:
        pokemon_id = fetch_pokemon_id(connection, pokemon_data["pokemon_name"], pokemon_data["form"])
        if not pokemon_id:
            continue
        for move_category in ["charged_moves", "fast_moves", "elite_charged_moves", "elite_fast_moves"]:
            for move_name in pokemon_data[move_category]:
                move_id = fetch_move_id(connection, move_name)
                if not move_id:
                    continue
                is_legacy = 1 if "elite" in move_category else 0
                
                # Insert into pokemon_moves
                cursor.execute('''
                    INSERT INTO pokemon_moves (pokemon_id, move_id, legacy)
                    VALUES (?, ?, ?)
                ''', (pokemon_id, move_id, is_legacy))

    # Commit the changes and close the connection
    connection.commit()
    connection.close()

if __name__ == "__main__":
    store_current_pokemon_moves()
