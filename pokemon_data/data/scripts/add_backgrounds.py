import sqlite3

def main():
    # Connect to the SQLite database (or create it if it doesn't exist)
    conn = sqlite3.connect('../pokego.db')
    cursor = conn.cursor()

    # Disable foreign key checks permanently
    cursor.execute('PRAGMA foreign_keys = OFF')

    # Commit the changes and close the connection
    conn.commit()
    conn.close()

    print("Foreign key checks have been permanently disabled.")

if __name__ == "__main__":
    main()
