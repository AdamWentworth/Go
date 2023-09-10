import sqlite3
import requests

def fetch_type_id(connection, type_name):
    """Fetch the type_id based on the type_name from the types table."""
    cursor = connection.cursor()
    cursor.execute('''
        SELECT type_id
        FROM types
        WHERE name = ?
    ''', (type_name,))
    return cursor.fetchone()[0]

def store_charged_moves():
    # Connect to the SQLite database
    connection = sqlite3.connect("data/pokego.db", timeout=30)
    cursor = connection.cursor()
    
    # Fetch the charged_moves data from the endpoint
    response = requests.get("https://pogoapi.net/api/v1/charged_moves.json")
    charged_moves = response.json()

    for move in charged_moves:
        type_id = fetch_type_id(connection, move["type"])
        try:
            # Inserting new fields like stamina_loss_scaler, duration, critical_chance, etc.
            cursor.execute('''
                INSERT INTO moves (name, type_id, raid_power, raid_energy, raid_cooldown)
                VALUES (?, ?, ?, ?, ?)
            ''', (move["name"], type_id, move["power"], move["energy_delta"], move["duration"]))
        except sqlite3.Error as e:
            print(f"Database error while inserting {move['name']}: {e}")

    # Commit the changes and close the connection
    connection.commit()
    connection.close()

if __name__ == "__main__":
    store_charged_moves()
