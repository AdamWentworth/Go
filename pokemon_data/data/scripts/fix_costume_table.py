import sqlite3

# Connect to the SQLite database
db_path = 'backend/data/pokego.db'  # Update this to your database file
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Step 1: Create a new table with the desired schema
cursor.execute("""
CREATE TABLE IF NOT EXISTS new_costume_pokemon (
    costume_id INTEGER PRIMARY KEY AUTOINCREMENT,
    pokemon_id INTEGER,
    costume_name TEXT,
    shiny_available INTEGER,
    date_available TEXT,
    date_shiny_available TEXT,
    image_url_costume TEXT,
    image_url_shiny_costume TEXT
)
""")

# Step 2: Copy all data from the old table to the new table
cursor.execute("""
INSERT INTO new_costume_pokemon (pokemon_id, costume_name, shiny_available, date_available,
                                 date_shiny_available, image_url_costume, image_url_shiny_costume)
SELECT pokemon_id, costume_name, shiny_available, date_available, 
       date_shiny_available, image_url_costume, image_url_shiny_costume
FROM costume_pokemon
""")

# Step 3: Delete the old table
cursor.execute("DROP TABLE costume_pokemon")

# Step 4: Rename the new table to the original name
cursor.execute("ALTER TABLE new_costume_pokemon RENAME TO costume_pokemon")

# Commit changes and close the connection
conn.commit()
conn.close()

print("Table rebuild completed successfully.")
