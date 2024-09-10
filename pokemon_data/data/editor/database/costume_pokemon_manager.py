# costume_pokemon_manager.py

class CostumePokemonManager:
    def __init__(self, db_conn):
        self.conn = db_conn

    def fetch_pokemon_costumes(self, pokemon_id):
        cursor = self.conn.get_cursor()
        query = """
            SELECT * FROM costume_pokemon WHERE pokemon_id = ?
        """
        cursor.execute(query, (pokemon_id,))
        return cursor.fetchall()

    def update_pokemon_costume(self, costume_id, updated_details):
        cursor = self.conn.get_cursor()
        query = """
            UPDATE costume_pokemon
            SET costume_name = ?, shiny_available = ?, date_available = ?, 
                date_shiny_available = ?, image_url_costume = ?, image_url_shiny_costume = ?
            WHERE costume_id = ?
        """
        
        shiny_index = 1  # Assuming 'shiny_available' is the second item in updated_details
        if updated_details[shiny_index] in [True, 'True', 'true', 1]:
            updated_details[shiny_index] = 1
        elif updated_details[shiny_index] in [False, 'False', 'false', 0]:
            updated_details[shiny_index] = 0
        else:
            updated_details[shiny_index] = None  # Or raise an error if an invalid value is passed
        
        updated_details = [None if detail == '' else detail for detail in updated_details]
        cursor.execute(query, (*updated_details, costume_id))
        self.conn.commit()

    def add_costume(self, pokemon_id, costume_details):
        cursor = self.conn.get_cursor()
        query = """
            INSERT INTO costume_pokemon (pokemon_id, costume_name, shiny_available, date_available, 
                                        date_shiny_available, image_url_costume, image_url_shiny_costume)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """
        values = (pokemon_id,) + tuple(costume_details.values())
        cursor.execute(query, values)
        self.conn.commit()
        return cursor.lastrowid

    def delete_costume(self, costume_id):
        cursor = self.conn.get_cursor()
        cursor.execute("DELETE FROM costume_pokemon WHERE costume_id = ?", (costume_id,))
        self.conn.commit()

    def fetch_costume_options(self, pokemon_id):
        cursor = self.conn.get_cursor()
        query = """
            SELECT costume_id, costume_name FROM costume_pokemon
            WHERE pokemon_id = ?
        """
        cursor.execute(query, (pokemon_id,))
        return ["{}: {}".format(row[0], row[1]) for row in cursor.fetchall()]
