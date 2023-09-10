import sqlite3

def clear_pokemon_moves_table():
    # Connect to the SQLite database
    connection = sqlite3.connect("data/pokego.db", timeout=30)
    cursor = connection.cursor()

    # Delete all records from the pokemon_moves table
    cursor.execute('''
        DELETE FROM pokemon_moves
    ''')

    # Commit the changes and close the connection
    connection.commit()
    connection.close()

    print("All data removed from pokemon_moves table!")

if __name__ == "__main__":
    clear_pokemon_moves_table()
