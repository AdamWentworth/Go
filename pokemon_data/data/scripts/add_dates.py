import sqlite3

def update_pokemon_id(db_path):
    # Connect to the SQLite database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # SQL command to disable foreign key constraint check
    disable_fk_constraint = "PRAGMA foreign_keys = OFF;"

    # SQL command to update the pokemon_id from 1064 to 413
    update_id = """
    UPDATE pokemon
    SET pokemon_id = 980
    WHERE pokemon_id = 1304;
    """

    # SQL command to re-enable foreign key constraint check
    enable_fk_constraint = "PRAGMA foreign_keys = ON;"

    # Execute the commands
    try:
        cursor.execute(disable_fk_constraint)
        cursor.execute(update_id)
        cursor.execute(enable_fk_constraint)
        conn.commit()
        print("pokemon_id updated successfully from 1064 to 413.")
    except sqlite3.Error as e:
        print(f"An error occurred: {e}")

    # Close the connection
    conn.close()

# Replace 'pokego.db' with the path to your database file
update_pokemon_id('backend/data/pokego.db')
