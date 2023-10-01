import sqlite3

DATABASE_PATH = "D:/Visual-Studio-Code/Go/data/pokego.db"

def main():
    # Connect to the database
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    # Add 'friendship_level' column to 'collection' table
    try:
        cursor.execute("ALTER TABLE collection ADD COLUMN friendship_level TEXT")
        conn.commit()
        print("Added 'friendship_level' column to 'collection' table.")
    except sqlite3.OperationalError as e:
        # This will catch if the column already exists, among other errors.
        print(f"An error occurred: {e}")

    # Close the database connection
    conn.close()

if __name__ == "__main__":
    main()
