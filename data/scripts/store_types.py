import sqlite3

# Connect to the database
conn = sqlite3.connect('data/pokego.db')  # Replace with your database name
cursor = conn.cursor()

# List of Pokémon types, sorted alphabetically
type_names = sorted([
    "Bug", "Dark", "Dragon", "Electric", "Fairy", "Fighting", "Fire", "Flying",
    "Ghost", "Grass", "Ground", "Ice", "Normal", "Poison", "Psychic", "Rock",
    "Steel", "Water"
])

# Insert the types into the table
for type_name in type_names:
    cursor.execute("INSERT INTO types (name) VALUES (?)", (type_name,))

# Commit the transaction
conn.commit()

# Close the connection
conn.close()

print("Types table created and Pokémon types inserted successfully!")
