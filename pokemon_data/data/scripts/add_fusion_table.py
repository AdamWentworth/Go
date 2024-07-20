import sqlite3
from sqlite3 import Error

def create_connection(db_file):
    """Create a database connection to a SQLite database."""
    conn = None
    try:
        conn = sqlite3.connect(db_file)
        print("Connection established. SQLite version:", sqlite3.version)
    except Error as e:
        print(e)
    return conn

def insert_fusion_pokemon(conn, fusion_pokemon_data):
    """
    Insert a new row into the fusion_pokemon table.
    fusion_pokemon_data should be a tuple containing:
    (fusion_id, pokemon_id, base_pokemon_id1, base_pokemon_id2, name, pokedex_number, image_url, image_url_shiny, 
     sprite_url, attack, defense, stamina, type_1_id, type_2_id, generation, available, shiny_available, shiny_rarity, 
     date_available, date_shiny_available)
    """
    sql = '''
    INSERT INTO fusion_pokemon
    (fusion_id, pokemon_id, base_pokemon_id1, base_pokemon_id2, name, pokedex_number, image_url, image_url_shiny, 
    sprite_url, attack, defense, stamina, type_1_id, type_2_id, generation, available, shiny_available, shiny_rarity, 
    date_available, date_shiny_available)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    '''
    try:
        c = conn.cursor()
        c.execute(sql, fusion_pokemon_data)
        conn.commit()
        print("Fusion Pokémon inserted successfully.")
    except Error as e:
        print(e)

def main():
    database = "../pokego.db"
    conn = create_connection(database)
    
    # Example data - replace with actual values
    fusion_pokemon_data = (
        1,  # fusion_id (auto-increment if you remove this in SQL schema)
        2270,  # pokemon_id (as an example of a linked entry in the pokemon table)
        2270,  # base_pokemon_id1
        2271,  # base_pokemon_id2
        "Example Fusion Name",  # name
        999,  # pokedex_number
        "http://example.com/image.png",  # image_url
        "http://example.com/image_shiny.png",  # image_url_shiny
        "http://example.com/sprite.png",  # sprite_url
        300,  # attack
        300,  # defense
        200,  # stamina
        10,  # type_1_id
        20,  # type_2_id
        7,  # generation
        True,  # available
        False,  # shiny_available
        0.01,  # shiny_rarity
        "2021-01-01",  # date_available
        None  # date_shiny_available (None if not available)
    )
    
    if conn is not None:
        insert_fusion_pokemon(conn, fusion_pokemon_data)
        conn.close()
    else:
        print("Error! Cannot create the database connection.")

if __name__ == '__main__':
    main()
