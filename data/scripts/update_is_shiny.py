import sqlite3

DATABASE_PATH = "D:/Visual-Studio-Code/Go/data/pokego.db"

def main():
    # Connect to the database
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    # Update is_shiny value for all rows
    cursor.execute("UPDATE costume_pokemon SET shiny_available = 1")
    conn.commit()

    print("Updated is_shiny value for all rows to 1.")

    # Close the database connection
    conn.close()

if __name__ == "__main__":
    main()
