import sqlite3

def generate_all_combinations():
    """ Generate all possible combinations of level IDs and IVs. """
    levels = [1 + 0.5 * i for i in range(102)]  # Levels from 1 to 51
    ivs = range(16)  # IVs from 0 to 15
    for level in levels:
        for attack_iv in ivs:
            for defense_iv in ivs:
                for stamina_iv in ivs:
                    yield (level, attack_iv, defense_iv, stamina_iv)

def check_missing_combinations(pokemon_id, cursor):
    """ Check and print missing combinations for the specified Pokémon ID. """
    all_combinations = set(generate_all_combinations())
    cursor.execute("""
    SELECT level_id, attack_iv, defense_iv, stamina_iv FROM pokemon_stats
    WHERE pokemon_id = ?
    """, (pokemon_id,))
    existing_combinations = set(cursor.fetchall())
    missing_combinations = all_combinations - existing_combinations
    
    if missing_combinations:
        print(f"Found {len(missing_combinations)} missing combinations.")
        print("Sample missing combinations:", list(missing_combinations)[:5])  # Print first 5 missing combinations
    else:
        print("No missing combinations found.")

def main():
    conn = sqlite3.connect('../pokego.db')
    cursor = conn.cursor()
    pokemon_id = 149  # Change this ID as needed for different Pokémon
    check_missing_combinations(pokemon_id, cursor)
    conn.close()

if __name__ == "__main__":
    main()
