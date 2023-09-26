import sqlite3


def get_unique_pokemon_with_costumes(db_path):
    # Connect to the SQLite database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Retrieve unique pokemon_id's from the costume_pokemon table
    cursor.execute("""
        SELECT DISTINCT pokemon_id 
        FROM costume_pokemon
    """)
    pokemon_ids = [row[0] for row in cursor.fetchall()]

    # Retrieve associated Pokemon names for the ids
    query = f"""
        SELECT DISTINCT name 
        FROM pokemon 
        WHERE pokemon_id IN ({','.join(['?']*len(pokemon_ids))})
    """
    cursor.execute(query, pokemon_ids)
    names = [row[0] for row in cursor.fetchall()]

    # Close the database connection
    conn.close()

    return names

def save_to_file(names, filename):
    with open(filename, 'w') as f:
        for name in names:
            f.write(name + "\n")

if __name__ == "__main__":
    # Path to the SQLite database
    db_path = "data/pokego.db"
    # Get unique Pokemon names associated with costumes
    unique_names = get_unique_pokemon_with_costumes(db_path)
    # Save the names to a file
    save_to_file(unique_names, "unique_pokemon_with_costumes.txt")
    print(f"Saved {len(unique_names)} unique Pokemon names with costumes to 'unique_pokemon_with_costumes.txt'")
