import sqlite3

# Define the SQLite database files
SOURCE_DATABASE_FILE = '../pokego - Copy.db'
DESTINATION_DATABASE_FILE = '../pokego.db'

def create_connection(db_file):
    """ Create a database connection to the SQLite database specified by db_file """
    conn = None
    try:
        conn = sqlite3.connect(db_file)
        return conn
    except sqlite3.Error as e:
        print(f"Error creating connection: {e}")
    return conn

def copy_data_from_backup(source_conn, dest_conn):
    """ Copy data from the mega_evolution table in the backup database to the new table """
    try:
        source_cur = source_conn.cursor()
        dest_cur = dest_conn.cursor()
        
        # Fetch data from the backup database's mega_evolution table
        source_cur.execute("SELECT id, pokemon_id, mega_energy_cost, attack, defense, stamina, image_url, image_url_shiny, sprite_url, primal FROM mega_evolution;")
        rows = source_cur.fetchall()
        
        # Insert data into the new mega_evolution table
        dest_cur.executemany("""
            INSERT INTO mega_evolution (id, pokemon_id, mega_energy_cost, attack, defense, stamina, image_url, image_url_shiny, sprite_url, primal)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, rows)
        
        dest_conn.commit()
        print("Data copied successfully from backup.")
    except sqlite3.Error as e:
        print(f"Error copying data: {e}")

def main():
    # Create connections to both databases
    source_conn = create_connection(SOURCE_DATABASE_FILE)
    dest_conn = create_connection(DESTINATION_DATABASE_FILE)
    
    if source_conn is None or dest_conn is None:
        print("Error! Cannot create the database connections.")
        return

    with source_conn, dest_conn:
        copy_data_from_backup(source_conn, dest_conn)

if __name__ == '__main__':
    main()
