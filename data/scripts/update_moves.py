import sqlite3

def update_moves_is_fast():
    # Connect to the SQLite database
    connection = sqlite3.connect("data/pokego.db", timeout=30)
    cursor = connection.cursor()

    # Add the is_fast column
    try:
        cursor.execute("ALTER TABLE moves ADD COLUMN is_fast INTEGER DEFAULT 0")
    except sqlite3.OperationalError:
        # Column likely already exists, so we'll continue
        pass

    # Update the is_fast values
    cursor.execute("UPDATE moves SET is_fast = 1 WHERE raid_energy > 0")
    cursor.execute("UPDATE moves SET is_fast = 0 WHERE raid_energy <= 0")

    # Commit the changes and close the connection
    connection.commit()
    connection.close()

if __name__ == "__main__":
    update_moves_is_fast()
