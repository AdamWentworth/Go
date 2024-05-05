import sqlite3

def get_hierarchy(database_path):
    # Connect to the SQLite database
    connection = sqlite3.connect(database_path)
    cursor = connection.cursor()

    # Get the list of tables in the database
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()

    hierarchy = {}

    for table in tables:
        table_name = table[0]
        hierarchy[table_name] = []

        # Get columns for the table
        cursor.execute(f"PRAGMA table_info({table_name});")
        columns = cursor.fetchall()

        for column in columns:
            column_name = column[1]
            hierarchy[table_name].append(column_name)

    connection.close()

    return hierarchy

if __name__ == '__main__':
    database_path = input("Enter the path to the SQLite database: ")
    hierarchy = get_hierarchy(database_path)
    
    for table, columns in hierarchy.items():
        print(f"Table: {table}")
        for column in columns:
            print(f"  - {column}")

