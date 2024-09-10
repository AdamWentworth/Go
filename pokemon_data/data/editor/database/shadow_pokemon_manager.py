# shadow_pokemon_manager.py

class ShadowPokemonManager:
    def __init__(self, db_conn):
        self.conn = db_conn

    def fetch_shadow_pokemon_data(self, pokemon_id):
        cursor = self.conn.get_cursor()
        cursor.execute("""
            SELECT shiny_available, apex, date_available, date_shiny_available, 
                   image_url_shadow, image_url_shiny_shadow
            FROM shadow_pokemon 
            WHERE pokemon_id = ?
        """, (pokemon_id,))
        result = cursor.fetchone()

        if result:
            return result
        else:
            return [None] * 6  # Return list of None if no shadow data is found

    def update_shadow_pokemon_data(self, pokemon_id, shadow_data):
        cursor = self.conn.get_cursor()
        cursor.execute("SELECT COUNT(*) FROM shadow_pokemon WHERE pokemon_id = ?", (pokemon_id,))
        exists = cursor.fetchone()[0] > 0

        if exists:
            update_query = """
                UPDATE shadow_pokemon
                SET shiny_available = ?, apex = ?, date_available = ?, 
                    date_shiny_available = ?, image_url_shadow = ?, image_url_shiny_shadow = ?
                WHERE pokemon_id = ?
            """
        else:
            update_query = """
                INSERT INTO shadow_pokemon (shiny_available, apex, date_available, date_shiny_available,
                    image_url_shadow, image_url_shiny_shadow, pokemon_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """
        
        parameters = (
            shadow_data.get('Shiny Available'),
            shadow_data.get('Apex'),
            shadow_data.get('Date Available'),
            shadow_data.get('Date Shiny Available'),
            shadow_data.get('Image URL Shadow'),
            shadow_data.get('Image URL Shiny Shadow'),
            pokemon_id
        )

        cursor.execute(update_query, parameters)
        self.conn.commit()

    def fetch_shadow_costume_data(self, pokemon_id):
        cursor = self.conn.get_cursor()
        query = """
            SELECT sc.shadow_id, sp.id, cp.costume_id, sc.date_available, sc.date_shiny_available, 
                   sc.image_url_shadow_costume, sc.image_url_shiny_shadow_costume
            FROM shadow_costume_pokemon sc
            JOIN shadow_pokemon sp ON sc.shadow_id = sp.id
            JOIN costume_pokemon cp ON sc.costume_id = cp.costume_id
            WHERE sp.pokemon_id = ? OR cp.pokemon_id = ?
        """
        cursor.execute(query, (pokemon_id, pokemon_id))
        return cursor.fetchall()

    def save_shadow_costume(self, shadow_id, costume_id, date_available, date_shiny_available, image_url_shadow_costume, image_url_shiny_shadow_costume):
        cursor = self.conn.get_cursor()
        cursor.execute("""
            SELECT id FROM shadow_costume_pokemon WHERE shadow_id=? AND costume_id=?
        """, (shadow_id, costume_id))
        record = cursor.fetchone()

        if record:
            update_query = """
                UPDATE shadow_costume_pokemon
                SET date_available=?, date_shiny_available=?, image_url_shadow_costume=?, image_url_shiny_shadow_costume=?
                WHERE id=?
            """
            cursor.execute(update_query, (date_available, date_shiny_available, image_url_shadow_costume, image_url_shiny_shadow_costume, record[0]))
        else:
            insert_query = """
                INSERT INTO shadow_costume_pokemon (shadow_id, costume_id, date_available, date_shiny_available, 
                                                    image_url_shadow_costume, image_url_shiny_shadow_costume)
                VALUES (?, ?, ?, ?, ?, ?)
            """
            cursor.execute(insert_query, (shadow_id, costume_id, date_available, date_shiny_available, image_url_shadow_costume, image_url_shiny_shadow_costume))

        self.conn.commit()

    def fetch_shadow_options(self, pokemon_id):
        cursor = self.conn.get_cursor()
        cursor.execute("""
            SELECT id FROM shadow_pokemon
            WHERE pokemon_id = ?
        """, (pokemon_id,))
        return [str(row[0]) for row in cursor.fetchall()]
