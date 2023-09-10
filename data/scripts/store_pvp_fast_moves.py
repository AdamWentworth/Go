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

def store_pvp_fast_moves():
    # Connect to the SQLite database
    connection = sqlite3.connect("data/pokego.db", timeout=30)
    cursor = connection.cursor()
    
    # Fetch the pvp_fast_moves data from the endpoint
    response = requests.get("https://pogoapi.net/api/v1/pvp_fast_moves.json")
    pvp_fast_moves = response.json()

    for move in pvp_fast_moves:
        type_id = fetch_type_id(connection, move["type"])

        # Check if the move already exists in the table
        cursor.execute('''
            SELECT COUNT(*)
            FROM moves
            WHERE name = ?
        ''', (move["name"],))
        move_exists = cursor.fetchone()[0] > 0

        try:
            if move_exists:
                # Update the existing record
                cursor.execute('''
                    UPDATE moves
                    SET pvp_power = ?, pvp_energy = ?, pvp_turns = ?
                    WHERE name = ?
                ''', (move["power"], move["energy_delta"], move["turn_duration"], move["name"]))
            else:
                # Insert a new record
                cursor.execute('''
                    INSERT INTO moves (name, type_id, pvp_power, pvp_energy, pvp_turns)
                    VALUES (?, ?, ?, ?, ?)
                ''', (move["name"], type_id, move["power"], move["energy_delta"], move["turn_duration"]))
        except sqlite3.Error as e:
            print(f"Database error while processing {move['name']}: {e}")

    # Commit the changes and close the connection
    connection.commit()
    connection.close()

if __name__ == "__main__":
    store_pvp_fast_moves()
