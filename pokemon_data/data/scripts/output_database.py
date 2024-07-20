import sqlite3

# Connect to the SQLite database
conn = sqlite3.connect('../pokego.db')

# Create a cursor object
cur = conn.cursor()

# Retrieve a list of all tables in the database
cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cur.fetchall()

# Loop through the tables and print their attributes
for table in tables:
    print(f"Table: {table[0]}")
    cur.execute(f"PRAGMA table_info({table[0]});")
    columns = cur.fetchall()
    for column in columns:
        print(f"  Attribute: {column[1]} (Type: {column[2]})")
    print()

# Close the connection
conn.close()
