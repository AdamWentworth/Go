import sqlite3

# Connect to the SQLite database
conn = sqlite3.connect('backend/data/pokego.db')  # replace 'your_database.db' with the path to your database file
cursor = conn.cursor()

try:
    # Disable foreign key constraint enforcement
    cursor.execute("PRAGMA foreign_keys = OFF;")
    
    # Delete the row where pokemon_id is 2 from costume_pokemon table
    delete_query = "DELETE FROM costume_pokemon WHERE pokemon_id = 2;"
    cursor.execute(delete_query)
    
    # Commit the changes
    conn.commit()
    
    # Re-enable foreign key constraint enforcement
    cursor.execute("PRAGMA foreign_keys = ON;")
    
    print("Row deleted successfully.")
except sqlite3.Error as error:
    print("Error while deleting the row:", error)
finally:
    # Closing the connection
    if conn:
        conn.close()

