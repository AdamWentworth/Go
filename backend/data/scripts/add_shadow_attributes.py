import sqlite3

def add_columns_to_shadow_pokemon_table(db_path):
    # Connect to the SQLite database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Define the columns to be added with their data types
    new_columns = {
        "date_available": "TEXT",
        "date_shiny_available": "TEXT",
        "image_url_shadow": "TEXT",
        "image_url_shiny_shadow": "TEXT"
    }

    # Iterate over the new columns and add them to the table
    for column_name, data_type in new_columns.items():
        try:
            cursor.execute(f"ALTER TABLE shadow_pokemon ADD COLUMN {column_name} {data_type}")
            print(f"Added column '{column_name}' to shadow_pokemon table.")
        except sqlite3.OperationalError as e:
            # This error typically occurs if the column already exists
            print(f"Error adding column '{column_name}': {e}")

    # Commit the changes and close the connection
    conn.commit()
    conn.close()

# Path to your 'pokego.db' database
db_path = 'backend/data/pokego.db'
add_columns_to_shadow_pokemon_table(db_path)
