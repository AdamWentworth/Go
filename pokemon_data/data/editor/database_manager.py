# database_manager.py

from database.db_utils import DatabaseConnection
from database.pokemon_manager import PokemonManager

class DatabaseManager:
    def __init__(self, db_path):
        self.conn = DatabaseConnection(db_path)
        self.pokemon_manager = PokemonManager(self.conn)
    def fetch_all_pokemon_sorted(self, sort_by='pokemon_id'):
        return self.pokemon_manager.fetch_all_pokemon_sorted(sort_by)
    
    def fetch_type_ids(self):
        cursor = self.conn.get_cursor()
        cursor.execute("SELECT type_id, name FROM types")
        return {name: type_id for type_id, name in cursor.fetchall()}
    
    def fetch_moves(self, is_fast):
        cursor = self.conn.get_cursor()
        cursor.execute("SELECT move_id, name FROM moves WHERE is_fast = ?", (is_fast,))
        return {name: move_id for move_id, name in cursor.fetchall()}
    
    def fetch_pokemon_moves(self, pokemon_id):
        return self.pokemon_manager.fetch_pokemon_moves(pokemon_id)

    def fetch_pokemon_details(self, pokemon_id):
        return self.pokemon_manager.fetch_pokemon_details(pokemon_id)    
    
    def update_pokemon_data(self, pokemon_id, data):
        return self.pokemon_manager.update_pokemon_data(pokemon_id, data)

    def update_pokemon_moves(self, pokemon_id, move_data):
        return self.pokemon_manager.update_pokemon_moves(pokemon_id, move_data)

    def add_evolves_to(self, pokemon_id, evolves_to_id):
        cursor = self.conn.get_cursor()
        cursor.execute("""
            INSERT INTO pokemon_evolutions (pokemon_id, evolves_to)
            VALUES (?, ?)
        """, (pokemon_id, evolves_to_id))
        self.conn.commit()

        # Fetch the last inserted ID (new evolution ID)
        new_evolution_id = cursor.lastrowid
        return new_evolution_id

    def remove_evolves_to(self, pokemon_id, evolves_to_id):
        cursor = self.conn.get_cursor()
        cursor.execute("""
            DELETE FROM pokemon_evolutions 
            WHERE pokemon_id = ? AND evolves_to = ?
        """, (pokemon_id, evolves_to_id))
        self.conn.commit()
    
    def fetch_evolution_details(self, pokemon_id):
        cursor = self.conn.get_cursor()
        query = """
            SELECT evolution_id, evolves_to, candies_needed, trade_discount, item_id, other
            FROM pokemon_evolutions
            WHERE pokemon_id = ?
        """
        cursor.execute(query, (pokemon_id,))
        return cursor.fetchall()

    def update_evolution_details(self, evolution_id, evolves_to_id, candies_needed, trade_discount, item_id, other):
        cursor = self.conn.get_cursor()
        query = """
            UPDATE pokemon_evolutions
            SET evolves_to = ?, candies_needed = ?, trade_discount = ?, item_id = ?, other = ?
            WHERE evolution_id = ?
        """
        parameters = (evolves_to_id, candies_needed, trade_discount, item_id, other, evolution_id)
        cursor.execute(query, parameters)
        self.conn.commit()

    def fetch_evolution_details_for_evolves_to(self, pokemon_id, evolves_to_id):
        cursor = self.conn.get_cursor()
        query = """
            SELECT evolution_id, evolves_to, candies_needed, trade_discount, item_id, other
            FROM pokemon_evolutions
            WHERE pokemon_id = ? AND evolves_to = ?
        """
        cursor.execute(query, (pokemon_id, evolves_to_id))
        return cursor.fetchall()
    
    def update_evolution_details(self, evolution_id, updated_data):
        cursor = self.conn.get_cursor()
        update_query = """
        UPDATE pokemon_evolutions
        SET evolves_to = ?, candies_needed = ?, trade_discount = ?, item_id = ?, other = ?
        WHERE evolution_id = ?
        """
        parameters = (
            updated_data.get("Evolves To"),
            updated_data.get("Candies Needed"),
            updated_data.get("Trade Discount"),
            updated_data.get("Item ID"),
            updated_data.get("Other"),
            evolution_id
        )
        cursor.execute(update_query, parameters)
        self.conn.commit()

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
            # Return a list of None values, one for each shadow attribute
            num_shadow_attributes = 6  # Update if the number of attributes changes
            return [None] * num_shadow_attributes

    def update_shadow_pokemon_data(self, pokemon_id, shadow_data):
    # First, check if the pokemon_id exists in the shadow_pokemon table
        cursor = self.conn.get_cursor()
        cursor.execute("SELECT COUNT(*) FROM shadow_pokemon WHERE pokemon_id = ?", (pokemon_id,))
        exists = cursor.fetchone()[0] > 0

        # Determine the appropriate SQL statement: insert if new, otherwise update
        if exists:
            update_query = """
            UPDATE shadow_pokemon
            SET shiny_available = ?, apex = ?, date_available = ?, 
                date_shiny_available = ?, image_url_shadow = ?, image_url_shiny_shadow = ?
            WHERE pokemon_id = ?
            """
        else:
            update_query = """
            INSERT INTO shadow_pokemon (shiny_available, apex, date_available, 
                date_shiny_available, image_url_shadow, image_url_shiny_shadow, pokemon_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """

        # Prepare parameters, converting empty strings to None
        parameters = (
            None if shadow_data.get('Shiny Available') == '' else shadow_data.get('Shiny Available'),
            None if shadow_data.get('Apex') == '' else shadow_data.get('Apex'),
            None if shadow_data.get('Date Available') == '' else shadow_data.get('Date Available'),
            None if shadow_data.get('Date Shiny Available') == '' else shadow_data.get('Date Shiny Available'),
            None if shadow_data.get('Image URL Shadow') == '' else shadow_data.get('Image URL Shadow'),
            None if shadow_data.get('Image URL Shiny Shadow') == '' else shadow_data.get('Image URL Shiny Shadow'),
            pokemon_id
        )

        cursor.execute(update_query, parameters)
        self.conn.commit()

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

        # Convert 'shiny_available' to 1 or 0
        shiny_index = 1  # Assuming 'shiny_available' is the second item in updated_details
        if updated_details[shiny_index] in [True, 'True', 'true', 1]:
            updated_details[shiny_index] = 1
        elif updated_details[shiny_index] in [False, 'False', 'false', 0]:
            updated_details[shiny_index] = 0
        else:
            updated_details[shiny_index] = None  # Or raise an error if an invalid value is passed

        # Convert empty strings to None
        updated_details = [None if detail == '' else detail for detail in updated_details]

        cursor.execute(query, (*updated_details, costume_id))
        self.conn.commit()

    def add_costume(self, pokemon_id, costume_details):
        print(f"add_costume in database_manager called for pokemon_id: {pokemon_id}")
        cursor = self.conn.get_cursor()
        query = """
            INSERT INTO costume_pokemon (pokemon_id, costume_name, shiny_available, date_available, 
                                        date_shiny_available, image_url_costume, image_url_shiny_costume)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """
        values = (pokemon_id,) + tuple(costume_details.values())
        cursor.execute(query, values)
        self.conn.commit()
        last_id = cursor.lastrowid  # Correct placement to capture the last inserted ID
        print(f"Costume added with costume_id: {last_id}")  # Corrected debug print
        return last_id

    def delete_costume(self, costume_id):
        cursor = self.conn.get_cursor()
        cursor.execute("DELETE FROM costume_pokemon WHERE costume_id = ?", (costume_id,))
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
        result = cursor.fetchall()
        if result:
            return [{
                'shadow_id': row[1], 
                'costume_id': row[2],
                'date_available': row[3],
                'date_shiny_available': row[4],
                'image_url_shadow_costume': row[5],
                'image_url_shiny_shadow_costume': row[6]
            } for row in result]
        else:
            return None
        
    def fetch_shadow_options(self, pokemon_id):
        cursor = self.conn.get_cursor()
        # Select only shadows related to the specific Pokémon
        cursor.execute("""
            SELECT id FROM shadow_pokemon
            WHERE pokemon_id = ?
        """, (pokemon_id,))
        return [str(row[0]) for row in cursor.fetchall()]

    def fetch_costume_options(self, pokemon_id):
        cursor = self.conn.get_cursor()
        # Select only costumes related to the specific Pokémon
        cursor.execute("""
            SELECT costume_id, costume_name FROM costume_pokemon
            WHERE pokemon_id = ?
        """, (pokemon_id,))
        return ["{}: {}".format(row[0], row[1]) for row in cursor.fetchall()]
    
    def save_shadow_costume(self, shadow_id, costume_id, date_available, date_shiny_available, image_url_shadow_costume, image_url_shiny_shadow_costume):
        cursor = self.conn.get_cursor()
        cursor.execute("""
            SELECT id FROM shadow_costume_pokemon WHERE shadow_id=? AND costume_id=?
        """, (shadow_id, costume_id))
        record = cursor.fetchone()

        if record:
            # Update existing record
            cursor.execute("""
                UPDATE shadow_costume_pokemon
                SET date_available=?, date_shiny_available=?, image_url_shadow_costume=?, image_url_shiny_shadow_costume=?
                WHERE id=?
            """, (date_available, date_shiny_available, image_url_shadow_costume, image_url_shiny_shadow_costume, record[0]))
        else:
            # Insert new record
            cursor.execute("""
                INSERT INTO shadow_costume_pokemon (shadow_id, costume_id, date_available, date_shiny_available, image_url_shadow_costume, image_url_shiny_shadow_costume)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (shadow_id, costume_id, date_available, date_shiny_available, image_url_shadow_costume, image_url_shiny_shadow_costume))

        self.conn.commit()

    def fetch_mega_pokemon_data(self, pokemon_id):
        cursor = self.conn.get_cursor()
        cursor.execute("""
            SELECT id, mega_energy_cost, attack, defense, stamina, image_url, image_url_shiny, sprite_url, primal, form, type_1_id, type_2_id
            FROM mega_evolution
            WHERE pokemon_id = ?
        """, (pokemon_id,))
        results = cursor.fetchall()
        return results

    def update_mega_evolution_data(self, mega_data_list):
        cursor = self.conn.get_cursor()
        for data in mega_data_list:
            update_query = """
            UPDATE mega_evolution
            SET mega_energy_cost = ?, attack = ?, defense = ?, stamina = ?, image_url = ?, image_url_shiny = ?, sprite_url = ?, primal = ?, form = ?, type_1_id = ?, type_2_id = ?
            WHERE id = ?
            """
            parameters = [None if value == '' else value for value in data[:-1]] + [data[-1]]  # data[-1] is the mega_evolution_id
            cursor.execute(update_query, parameters)
        self.conn.commit()

    def add_mega_evolution(self, pokemon_id):
        cursor = self.conn.get_cursor()
        insert_query = """
            INSERT INTO mega_evolution (pokemon_id, mega_energy_cost, attack, defense, stamina, image_url, image_url_shiny, sprite_url, primal, form, type_1_id, type_2_id)
            VALUES (?, 0, 0, 0, 0, '', '', '', 'None', '', NULL, NULL)
        """
        cursor.execute(insert_query, (pokemon_id,))
        self.conn.commit()
        return cursor.lastrowid