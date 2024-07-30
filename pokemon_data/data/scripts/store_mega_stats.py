import sqlite3
import math

def calculate_cp(attack, defense, stamina, cp_multiplier):
    """Calculate the Combat Power (CP) of a Pokemon with max IVs at each level."""
    return math.floor((attack * math.sqrt(defense) * math.sqrt(stamina) * cp_multiplier ** 2) / 10)

def main():
    # Connect to the SQLite database
    conn = sqlite3.connect('../pokego.db')
    cursor = conn.cursor()
    
    # Drop the existing mega_cp_stats table if it exists and recreate it
    cursor.execute('DROP TABLE IF EXISTS mega_cp_stats')
    cursor.execute('''
    CREATE TABLE mega_cp_stats (
        mega_id INTEGER,
        level_id REAL,
        cp INTEGER,
        hp INTEGER,
        PRIMARY KEY (mega_id, level_id),
        FOREIGN KEY (mega_id) REFERENCES mega_evolution(id),
        FOREIGN KEY (level_id) REFERENCES cp_multipliers(level_id)
    )
    ''')
    
    # Retrieve the CP multipliers
    cursor.execute("SELECT level_id, multiplier FROM cp_multipliers")
    levels = cursor.fetchall()
    
    # Retrieve all Mega Evolution's base stats
    cursor.execute("SELECT id, attack, defense, stamina FROM mega_evolution")
    all_mega = cursor.fetchall()

    # Maximum IV values
    max_iv = 15

    # Iterate over each Mega Evolution and calculate stats for all levels with max IVs
    for mega in all_mega:
        mega_id, base_attack, base_defense, base_stamina = mega
        
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
            
            # Insert the computed stats into the mega_cp_stats table
            cursor.execute('''
            INSERT INTO mega_cp_stats (mega_id, level_id, cp, hp)
            VALUES (?, ?, ?, ?)
            ''', (mega_id, level_id, cp, hp))

    # Commit the changes and close the database connection
    conn.commit()
    conn.close()
    print("Database updated successfully with all Mega Evolution stats for maximum IVs.")

if __name__ == "__main__":
    main()
