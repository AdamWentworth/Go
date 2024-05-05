import sqlite3

# Connect to the SQLite database
db_path = 'D:\\Visual-Studio-Code\\Go\\backend\\data\\pokego.db'  # Replace with the actual path to your database file
connection = sqlite3.connect(db_path)
cursor = connection.cursor()

try:
    # Execute an SQL UPDATE statement to set NULL shiny_available values to 0
    update_query = "UPDATE shadow_pokemon SET shiny_available = 0 WHERE shiny_available IS NULL"
    cursor.execute(update_query)
    connection.commit()
    print("Update completed successfully.")
except sqlite3.Error as e:
    print(f"Error updating the database: {e}")
finally:
    # Close the database connection
    connection.close()
