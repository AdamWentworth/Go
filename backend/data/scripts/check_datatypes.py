import sqlite3

# Replace this with the path to your actual database file
DATABASE_PATH = 'backend/data/pokego.db'

def get_table_info(table_name):
    # Connect to the SQLite database
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()

    # Use PRAGMA table_info() to get the details of the table structure
    cursor.execute(f"PRAGMA table_info({table_name});")
    columns_info = cursor.fetchall()

    # Close the database connection
    conn.close()

    return columns_info

def print_table_info(table_name):
    # Retrieve the table information
    columns_info = get_table_info(table_name)

    # Print out details of each column
    print(f"Column Details for '{table_name}':")
    for col in columns_info:
        cid, name, data_type, notnull, dflt_value, pk = col
        print(f"  Column ID: {cid}")
        print(f"    Name: {name}")
        print(f"    Data Type: {data_type}")
        print(f"    Not Null: {notnull}")
        print(f"    Default Value: {dflt_value}")
        print(f"    Primary Key: {pk}\n")

# Replace 'costume_pokemon' with your actual table name
print_table_info('costume_pokemon')
