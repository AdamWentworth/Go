import sqlite3

# Define the SQLite database file
DATABASE_FILE = '../pokego.db'

def create_connection(db_file):
    """ Create a database connection to the SQLite database specified by db_file """
    conn = None
    try:
        conn = sqlite3.connect(db_file)
        return conn
    except sqlite3.Error as e:
        print(f"Error creating connection: {e}")
    return conn

def add_form_column_to_mega_evolution(cur):
    """ Add the form column to the mega_evolution table """
    try:
        cur.execute("ALTER TABLE mega_evolution ADD COLUMN form TEXT")
        print("Added 'form' column to mega_evolution table.")
    except sqlite3.Error as e:
        print(f"Error adding 'form' column to mega_evolution table: {e}")

def main():
    # Create a database connection
    conn = create_connection(DATABASE_FILE)
    if conn is None:
        print("Error! Cannot create the database connection.")
        return

    with conn:
        cur = conn.cursor()
        add_form_column_to_mega_evolution(cur)

if __name__ == '__main__':
    main()
