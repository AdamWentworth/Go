import sqlite3

# Define the SQLite database file
DATABASE_FILE = '../pokego.db'

def create_connection(db_file):
    """Create a database connection to the SQLite database specified by db_file."""
    conn = None
    try:
        conn = sqlite3.connect(db_file)
        return conn
    except sqlite3.Error as e:
        print(f"Error creating connection: {e}")
    return conn

def fetch_raid_bosses(conn):
    """Fetch data from raid_bosses table."""
    try:
        cur = conn.cursor()
        cur.execute('SELECT id, pokemon_id, name, form FROM raid_bosses')
        return cur.fetchall()
    except sqlite3.Error as e:
        print(f"Error fetching raid_bosses data: {e}")
        return []

def fetch_pokemon(conn, name, form):
    """Fetch the correct pokemon_id from pokemon table based on name and form."""
    try:
        cur = conn.cursor()
        # Convert form values for the comparison
        if form.lower() == 'normal':
            form = None
        elif form.lower() == 'alola':
            form = 'Alolan'
        cur.execute('SELECT pokemon_id FROM pokemon WHERE name = ? AND form IS ?', (name, form))
        return cur.fetchone()
    except sqlite3.Error as e:
        print(f"Error fetching pokemon data for {name} ({form}): {e}")
        return None

def compare_data(conn, raid_bosses):
    """Compare raid_bosses data with pokemon data and print inconsistencies."""
    inconsistencies = []
    for raid_boss in raid_bosses:
        raid_boss_id, raid_boss_pokemon_id, raid_boss_name, raid_boss_form = raid_boss
        correct_pokemon = fetch_pokemon(conn, raid_boss_name, raid_boss_form)
        if correct_pokemon:
            correct_pokemon_id = correct_pokemon[0]
            if raid_boss_pokemon_id != correct_pokemon_id:
                inconsistencies.append((raid_boss_id, raid_boss_pokemon_id, raid_boss_name, raid_boss_form, correct_pokemon_id))
        else:
            print(f"No matching pokemon found for {raid_boss_name} ({raid_boss_form})")
    
    return inconsistencies

def main():
    # Create a database connection
    conn = create_connection(DATABASE_FILE)
    if conn is None:
        print("Error! Cannot create the database connection.")
        return

    # Fetch raid bosses data
    raid_bosses = fetch_raid_bosses(conn)
    if not raid_bosses:
        print("No raid bosses data fetched or an error occurred.")
        return

    # Compare data and find inconsistencies
    inconsistencies = compare_data(conn, raid_bosses)

    # Print inconsistencies
    if inconsistencies:
        print("Inconsistencies found:")
        for inconsistency in inconsistencies:
            raid_boss_id, raid_boss_pokemon_id, raid_boss_name, raid_boss_form, correct_pokemon_id = inconsistency
            print(f"Raid Boss ID: {raid_boss_id}")
            print(f"  Raid Boss Pokemon ID: {raid_boss_pokemon_id} | Correct Pokemon ID: {correct_pokemon_id}")
            print(f"  Raid Boss Name: {raid_boss_name}")
            print(f"  Raid Boss Form: {raid_boss_form}")
            print()
    else:
        print("No inconsistencies found.")

if __name__ == '__main__':
    main()
