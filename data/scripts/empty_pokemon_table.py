import sqlite3

def clear_pokemon_table():
    # Connect to the SQLite database
    connection = sqlite3.connect("data/pokego.db")
    cursor = connection.cursor()

    # Delete all rows from the pokemon table
    cursor.execute("DELETE FROM pokemon")

    # Commit the changes and close the connection
    connection.commit()
    connection.close()
    print("Pokémon table cleared successfully!")

if __name__ == "__main__":
    clear_pokemon_table()
