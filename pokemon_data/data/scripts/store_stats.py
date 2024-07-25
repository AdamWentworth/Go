import sqlite3
import math

def calculate_cp(attack, defense, stamina, cp_multiplier):
    """Calculate the Combat Power (CP) of a Pokemon with max IVs at each level."""
    return math.floor((attack * math.sqrt(defense) * math.sqrt(stamina) * cp_multiplier ** 2) / 10)

def main():
    # Connect to the SQLite database
    conn = sqlite3.connect('../pokego.db')
    cursor = conn.cursor()
    
    # Drop the existing pokemon_stats table if it exists and recreate it
    cursor.execute('DROP TABLE IF EXISTS pokemon_cp_stats')
    cursor.execute('''
    CREATE TABLE pokemon_cp_stats (
        pokemon_id INTEGER,
        level_id REAL,
        cp INTEGER,
        hp INTEGER,
        PRIMARY KEY (pokemon_id, level_id),
        FOREIGN KEY (pokemon_id) REFERENCES pokemon(pokemon_id),
        FOREIGN KEY (level_id) REFERENCES cp_multipliers(level_id)
    )
    ''')
    
    # Retrieve the CP multipliers
    cursor.execute("SELECT level_id, multiplier FROM cp_multipliers")
    levels = cursor.fetchall()
    
    # Retrieve all Pokémon's base stats
    cursor.execute("SELECT pokemon_id, attack, defense, stamina FROM pokemon")
    all_pokemon = cursor.fetchall()

    # Maximum IV values
    max_iv = 15

    # Iterate over each Pokémon and calculate stats for all levels with max IVs
    for pokemon in all_pokemon:
        pokemon_id, base_attack, base_defense, base_stamina = pokemon
        
        # Handle null or incomplete data gracefully
        if base_attack is None or base_defense is None or base_stamina is None:
            continue
        
        for level_id, cp_multiplier in levels:
            # Calculate stats with max IVs
            attack = base_attack + max_iv
            defense = base_defense + max_iv
            hp = math.floor((base_stamina + max_iv) * cp_multiplier)  # HP calculation for max IVs

            # Calculate CP for max IVs
            cp = calculate_cp(attack, defense, base_stamina + max_iv, cp_multiplier)
            
            # Insert the computed stats into the pokemon_stats table
            cursor.execute('''
            INSERT INTO pokemon_cp_stats (pokemon_id, level_id, cp, hp)
            VALUES (?, ?, ?, ?)
            ''', (pokemon_id, level_id, cp, hp))

    # Commit the changes and close the database connection
    conn.commit()
    conn.close()
    print("Database updated successfully with all Pokémon stats for maximum IVs.")

if __name__ == "__main__":
    main()
