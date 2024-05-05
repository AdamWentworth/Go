import sqlite3

def proof_database(db_path):
    # Connect to the SQLite database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Check for NULL in attack, defense, or stamina
    cursor.execute("""
        SELECT pokemon_id
        FROM pokemon
        WHERE attack IS NULL OR defense IS NULL OR stamina IS NULL
    """)
    null_stats_pokemon = cursor.fetchall()
    print("Pokemon with NULL in attack, defense, or stamina:", null_stats_pokemon)

    # Check available and date_available, and shiny_available with date_shiny_available
    cursor.execute("""
        SELECT pokemon_id
        FROM pokemon
        WHERE (available = 0 AND date_available IS NOT NULL) 
        OR (available = 1 AND date_available IS NULL)
        OR (shiny_available = 0 AND date_shiny_available IS NOT NULL)
        OR (shiny_available = 1 AND date_shiny_available IS NULL)
    """)
    inconsistent_availability_pokemon = cursor.fetchall()
    print("Pokemon with inconsistent availability data:", inconsistent_availability_pokemon)

    # Check for pokemon_ids not in pokemon_moves
    cursor.execute("""
        SELECT DISTINCT pokemon_id
        FROM pokemon
        WHERE pokemon_id NOT IN (SELECT DISTINCT pokemon_id FROM pokemon_moves)
        AND pokemon_id BETWEEN 1 AND 1332
    """)
    missing_moves_pokemon = cursor.fetchall()
    print("Pokemon missing in pokemon_moves table:", missing_moves_pokemon)

    # Close the connection
    conn.close()

# Replace 'your_database_path.db' with the path to your database file
proof_database('backend/data/pokego.db')
