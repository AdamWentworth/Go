import sqlite3
from sqlite3 import Error

def create_connection(db_file):
    """Create a database connection to a SQLite database."""
    conn = None
    try:
        conn = sqlite3.connect(db_file)
        print("Connection established. SQLite version:", sqlite3.version)
    except Error as e:
        print(e)
    return conn

def modify_pokemon_backgrounds_table(conn):
    """
    Modify the pokemon_backgrounds table to include a nullable costume_id that references the costume_pokemon table.
    """
    try:
        c = conn.cursor()
        
        # Add costume_id column to pokemon_backgrounds table
        c.execute("ALTER TABLE pokemon_backgrounds ADD COLUMN costume_id INTEGER")

        # Create a foreign key constraint (optional, depending on SQLite version)
        c.execute("PRAGMA foreign_keys=off;")
        c.execute("BEGIN TRANSACTION;")
        c.execute("""
        CREATE TABLE pokemon_backgrounds_new (
            pokemon_id INTEGER,
            background_id INTEGER,
            costume_id INTEGER,
            FOREIGN KEY (costume_id) REFERENCES costume_pokemon(costume_id)
        );
        """)
        c.execute("""
        INSERT INTO pokemon_backgrounds_new (pokemon_id, background_id, costume_id)
        SELECT pokemon_id, background_id, costume_id FROM pokemon_backgrounds;
        """)
        c.execute("DROP TABLE pokemon_backgrounds;")
        c.execute("ALTER TABLE pokemon_backgrounds_new RENAME TO pokemon_backgrounds;")
        c.execute("COMMIT;")
        c.execute("PRAGMA foreign_keys=on;")
        
        conn.commit()
        print("pokemon_backgrounds table modified successfully.")
    except Error as e:
        print(e)

def main():
    database = "../pokego.db"
    conn = create_connection(database)
    
    if conn is not None:
        modify_pokemon_backgrounds_table(conn)
        conn.close()
    else:
        print("Error! Cannot create the database connection.")

if __name__ == '__main__':
    main()
