import sqlite3
import re

def insert_costume_data(connection, pokemon_id, costume_name):
    cursor = connection.cursor()
    cursor.execute('''
        INSERT INTO costume_pokemon (pokemon_id, costume_name)
        VALUES (?, ?)
    ''', (pokemon_id, costume_name))
    connection.commit()

def main():
    # Connect to the SQLite database
    connection = sqlite3.connect("data/pokego.db", timeout=30)
    
    # Open and read the costumes.txt file
    with open("costumes.txt", "r") as file:
        for line in file:
            # Extract the pokemon_name, pokemon_id, and costume_name from each line
            match = re.match(r"No match in database for (\w+) \((\d+)\) with form (\w+).", line)
            if match:
                pokemon_name, pokemon_id, costume_name = match.groups()
                insert_costume_data(connection, pokemon_id, costume_name)
    
    # Close the connection
    connection.close()

if __name__ == "__main__":
    main()
