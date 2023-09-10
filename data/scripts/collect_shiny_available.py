import sqlite3

def update_shiny_based_on_availability():
    # Connect to the SQLite database
    connection = sqlite3.connect("data/pokego.db", timeout=30)
    cursor = connection.cursor()

    try:
        cursor.execute('''
            UPDATE pokemon
            SET shiny_available = 0
            WHERE available = 0
        ''')

        print(f"Updated {cursor.rowcount} Pokémon(s) where shiny_available is set to FALSE based on availability status.")

    except sqlite3.Error as e:
        print(f"Database error: {e}")

    # Commit the changes and close the connection
    connection.commit()
    connection.close()

if __name__ == "__main__":
    update_shiny_based_on_availability()
