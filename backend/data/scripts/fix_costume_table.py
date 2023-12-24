import sqlite3

def recreate_costume_pokemon_table(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS new_costume_pokemon (
        costume_id INTEGER,
        pokemon_id INTEGER,
        costume_name TEXT,
        shiny_available INTEGER,
        date_available TEXT,
        date_shiny_available TEXT,
        image_url_costume TEXT,
        image_url_shiny_costume TEXT
    )
    ''')

    cursor.execute('''
    INSERT INTO new_costume_pokemon (costume_id, pokemon_id, costume_name, shiny_available, date_available, date_shiny_available, image_url_costume, image_url_shiny_costume)
    SELECT costume_id, pokemon_id, costume_name, shiny_available, date_available, date_shiny_available, image_url_shadow, image_url_shiny_shadow FROM costume_pokemon
    ''')

    cursor.execute('DROP TABLE costume_pokemon')

    cursor.execute('ALTER TABLE new_costume_pokemon RENAME TO costume_pokemon')

    conn.commit()
    conn.close()

db_path = 'backend/data/pokego.db'  # Update with the actual path to your database
recreate_costume_pokemon_table(db_path)
