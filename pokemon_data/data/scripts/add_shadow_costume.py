import sqlite3

def create_table():
    # Connect to the SQLite database
    conn = sqlite3.connect('./data/pokego.db')
    # Create a cursor object
    cur = conn.cursor()

    # SQL command to create the new table
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS shadow_costume_pokemon (
        id INTEGER PRIMARY KEY,
        shadow_id INTEGER,
        costume_id INTEGER,
        FOREIGN KEY (shadow_id) REFERENCES shadow_pokemon(id),
        FOREIGN KEY (costume_id) REFERENCES costume_pokemon(costume_id)
    );
    """

    # Execute the SQL command to create the table
    cur.execute(create_table_sql)
    print("Table 'shadow_costume_pokemon' created successfully.")

    # Commit the changes to the database
    conn.commit()

    # Close the connection
    conn.close()

# Call the function to create the table
create_table()
