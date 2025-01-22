import sqlite3

# Connect to SQLite database
conn = sqlite3.connect("../pokego.db")  # Change to your database file
cursor = conn.cursor()

# Fetch all pokemon_ids where dynamax or gigantamax is True
cursor.execute("""
    SELECT pokemon_id, dynamax, gigantamax FROM pokemon
    WHERE dynamax = 1 OR gigantamax = 1;
""")
pokemon_data = cursor.fetchall()

# Insert records into max_pokemon
for pokemon_id, dynamax, gigantamax in pokemon_data:
    # Insert only one record, combining Dynamax and Gigantamax
    cursor.execute("""
        INSERT INTO max_pokemon (pokemon_id, dynamax, gigantamax)
        VALUES (?, ?, ?);
    """, (pokemon_id, dynamax, gigantamax))

# Commit and close connection
conn.commit()
conn.close()

print("Records successfully inserted into max_pokemon!")
