import sqlite3

# Connect to the SQLite database
db_path = "../pokego.db"  # Update this if needed
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Fetch column names
cursor.execute("PRAGMA table_info(pokemon_sizes);")
columns = [col[1] for col in cursor.fetchall()]

# Fetch a single row
cursor.execute("SELECT * FROM pokemon_sizes LIMIT 1;")
row = cursor.fetchone()

# Close the database connection
conn.close()

# Print the row with column names
if row:
    print("Pokemon Size Data:")
    for col_name, value in zip(columns, row):
        print(f"{col_name}: {value}")
else:
    print("No data found in the pokemon_sizes table.")
