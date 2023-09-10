import sqlite3

def update_available_attribute():
    # Connect to the SQLite database
    connection = sqlite3.connect("data/pokego.db")
    cursor = connection.cursor()

    # Update the available attribute for Alolan and Galarian Pokémon
    cursor.execute('''
    UPDATE pokemon
    SET available = 1
    WHERE form IN ("Alolan", "Galarian");
    ''')

    # Commit the changes and close the connection
    connection.commit()
    connection.close()

    print("Updated the 'available' attribute for Alolan and Galarian Pokémon.")

if __name__ == "__main__":
    update_available_attribute()
