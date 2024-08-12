import sqlite3

def add_column_to_table(db_path, table_name, column_name, column_type):
    # Connect to the SQLite database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Formulate the SQL command to add a new column
    add_column_sql = f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type};"

    try:
        # Execute the SQL command
        cursor.execute(add_column_sql)
        print(f"Column '{column_name}' added to '{table_name}' successfully.")
    except sqlite3.OperationalError as e:
        print(f"Error occurred: {e}")
    finally:
        # Commit the changes and close the connection
        conn.commit()
        conn.close()

# Parameters
db_path = '../pokego.db'  # Path to your SQLite database file
table_name = 'shadow_pokemon'  # Name of the table
column_name = 'shiny_rarity'  # Name of the new column
column_type = 'TEXT'  # Data type of the new column (you can change it as needed)

# Add the column to the table
add_column_to_table(db_path, table_name, column_name, column_type)
