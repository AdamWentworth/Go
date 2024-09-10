import sqlite3

# Connect to the SQLite database
db_path = '../pokego.db'  # Path to your SQLite database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check if the 'female_unique' column already exists
cursor.execute("PRAGMA table_info(pokemon)")
columns = cursor.fetchall()

# Check if 'female_unique' is already in the table
column_names = [col[1] for col in columns]
if 'female_unique' not in column_names:
    # Add the 'female_unique' column to the 'pokemon' table
    cursor.execute("ALTER TABLE pokemon ADD COLUMN female_unique INTEGER DEFAULT 0")
    print("'female_unique' column added successfully.")
else:
    print("'female_unique' column already exists.")

# Commit changes and close the connection
conn.commit()
conn.close()
