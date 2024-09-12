import sqlite3

# Connect to the SQLite database
conn = sqlite3.connect('../pokego.db')
cursor = conn.cursor()

# Add two new columns to the shadow_costume_pokemon table
try:
    # Add the column image_url_female_shadow_costume if it doesn't exist
    cursor.execute("""
        ALTER TABLE shadow_costume_pokemon
        ADD COLUMN image_url_female_shadow_costume TEXT;
    """)
    print("Added column: image_url_female_shadow_costume")
except sqlite3.OperationalError:
    print("Column image_url_female_shadow_costume already exists.")

try:
    # Add the column image_url_female_shiny_shadow_costume if it doesn't exist
    cursor.execute("""
        ALTER TABLE shadow_costume_pokemon
        ADD COLUMN image_url_female_shiny_shadow_costume TEXT;
    """)
    print("Added column: image_url_female_shiny_shadow_costume")
except sqlite3.OperationalError:
    print("Column image_url_female_shiny_shadow_costume already exists.")

# Commit the changes and close the connection
conn.commit()
conn.close()

print("Database updated successfully.")
