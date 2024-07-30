# database_manager.py

import sqlite3

class DatabaseManager:
    def __init__(self, db_path):
        self.conn = sqlite3.connect(db_path)

    def fetch_all_pokemon_sorted(self, sort_by='pokemon_id'):
        cursor = self.conn.cursor()
        query = f"SELECT pokemon_id, name FROM pokemon ORDER BY {sort_by}"
        cursor.execute(query)
        return ["{}: {}".format(row[0], row[1]) for row in cursor.fetchall()]
    
    def fetch_type_ids(self):
        cursor = self.conn.cursor()
        cursor.execute("SELECT type_id, name FROM types")
        return {name: type_id for type_id, name in cursor.fetchall()}
    
    def fetch_moves(self, is_fast):
        cursor = self.conn.cursor()
        cursor.execute("SELECT move_id, name FROM moves WHERE is_fast = ?", (is_fast,))
        return {name: move_id for move_id, name in cursor.fetchall()}
    
    def fetch_pokemon_moves(self, pokemon_id):
        cursor = self.conn.cursor()
        cursor.execute("SELECT move_id FROM pokemon_moves WHERE pokemon_id = ?", (pokemon_id,))
        return [row[0] for row in cursor.fetchall()]
    
    def build_evolution_map(self):
        cursor = self.conn.cursor()
        cursor.execute("SELECT pokemon_id, evolves_to FROM pokemon_evolutions")
        evolutions = cursor.fetchall()

        evolution_map = {}

        # First pass: Ensure all relevant keys exist in the evolutionMap
        for evo in evolutions:
            from_id, to_id = evo
            if from_id not in evolution_map:
                evolution_map[from_id] = {'evolves_to': [], 'evolves_from': []}
            if to_id and to_id not in evolution_map:
                evolution_map[to_id] = {'evolves_to': [], 'evolves_from': []}

        # Second pass: Assign the evolution data
        for evo in evolutions:
            from_id, to_id = evo
            if to_id:
                evolution_map[from_id]['evolves_to'].append(to_id)
                evolution_map[to_id]['evolves_from'].append(from_id)

        return evolution_map

    def fetch_pokemon_details(self, pokemon_id):
        cursor = self.conn.cursor()
        
        # Ensure pokemon_id is an integer for key consistency in the evolution map
        pokemon_id = int(pokemon_id)

        # Fetch the general Pokémon data
        cursor.execute("SELECT * FROM pokemon WHERE pokemon_id = ?", (pokemon_id,))
        pokemon_data = list(cursor.fetchone())

        # Replace type IDs with type names in pokemon_data
        for index in (9, 10):  # Assuming type_1_id is at index 9 and type_2_id is at index 10
            type_id = pokemon_data[index]
            if type_id:  # If there's a type ID, fetch the corresponding type name
                cursor.execute("SELECT name FROM types WHERE type_id = ?", (type_id,))
                type_name = cursor.fetchone()
                if type_name:
                    pokemon_data[index] = type_name[0]
                else:
                    pokemon_data[index] = None  # Or some placeholder if there's no type with the given ID

        # Fetch move details along with legacy status
        cursor.execute("""
            SELECT m.name, t.name, m.is_fast, pm.legacy FROM moves m
            INNER JOIN pokemon_moves pm ON m.move_id = pm.move_id
            INNER JOIN types t ON m.type_id = t.type_id
            WHERE pm.pokemon_id = ?
        """, (pokemon_id,))
        moves = cursor.fetchall()

        # Fetch evolution data
        evolution_map = self.build_evolution_map()

        # Get evolution data for the specified pokemon_id
        pokemon_evolutions = evolution_map.get(pokemon_id, {'evolves_to': [], 'evolves_from': []})

        # Fetch names for the evolves_to list
        evolves_to_with_names = []
        for evolve_to_id in pokemon_evolutions['evolves_to']:
            cursor.execute("SELECT name FROM pokemon WHERE pokemon_id = ?", (evolve_to_id,))
            to_name = cursor.fetchone()
            if to_name:
                evolves_to_with_names.append((evolve_to_id, to_name[0]))
        pokemon_evolutions['evolves_to'] = evolves_to_with_names

        # Fetch names for the evolves_from list
        evolves_from_with_names = []
        for evolve_from_id in pokemon_evolutions['evolves_from']:
            cursor.execute("SELECT name FROM pokemon WHERE pokemon_id = ?", (evolve_from_id,))
            from_name = cursor.fetchone()
            if from_name:
                evolves_from_with_names.append((evolve_from_id, from_name[0]))
        pokemon_evolutions['evolves_from'] = evolves_from_with_names

        return pokemon_data, moves, pokemon_evolutions

    def update_pokemon_data(self, pokemon_id, data):
        cursor = self.conn.cursor()
        update_query = """
        UPDATE pokemon
        SET name=?, pokedex_number=?, image_url=?, image_url_shiny=?, sprite_url=?,
        attack=?, defense=?, stamina=?, type_1_id=?, type_2_id=?, 
        gender_rate=?, rarity=?, form=?, generation=?, available=?,
        shiny_available=?, shiny_rarity=?, date_available=?, date_shiny_available=?
        WHERE pokemon_id=?
        """
        # Ensure that data has 19 items and pokemon_id is the 20th item
        parameters = tuple(data) + (pokemon_id,)
        cursor.execute(update_query, parameters)
        self.conn.commit()

    def update_pokemon_moves(self, pokemon_id, move_data):
        cursor = self.conn.cursor()

        # Fetch current moves to check for existence
        cursor.execute("SELECT move_id, legacy FROM pokemon_moves WHERE pokemon_id = ?", (pokemon_id,))
        current_moves = {move_id: legacy for move_id, legacy in cursor.fetchall()}

        # Set to track which moves are processed
        processed_moves = set()

        for move_id, is_legacy in move_data:
            # Process each move
            if move_id in current_moves:
                # Update existing move
                if current_moves[move_id] != is_legacy:  # Update only if legacy status has changed
                    cursor.execute("""
                        UPDATE pokemon_moves
                        SET legacy = ?
                        WHERE pokemon_id = ? AND move_id = ?
                    """, (is_legacy, pokemon_id, move_id))
            else:
                # Insert new move
                cursor.execute("""
                    INSERT INTO pokemon_moves (pokemon_id, move_id, legacy)
                    VALUES (?, ?, ?)
                """, (pokemon_id, move_id, is_legacy))

            processed_moves.add(move_id)

        # Delete moves that are no longer present
        for move_id in current_moves:
            if move_id not in processed_moves:
                cursor.execute("DELETE FROM pokemon_moves WHERE pokemon_id = ? AND move_id = ?", (pokemon_id, move_id))

        self.conn.commit()

    def add_evolves_to(self, pokemon_id, evolves_to_id):
        cursor = self.conn.cursor()
        cursor.execute("""
            INSERT INTO pokemon_evolutions (pokemon_id, evolves_to)
            VALUES (?, ?)
        """, (pokemon_id, evolves_to_id))
        self.conn.commit()

        # Fetch the last inserted ID (new evolution ID)
        new_evolution_id = cursor.lastrowid
        return new_evolution_id

    def remove_evolves_to(self, pokemon_id, evolves_to_id):
        cursor = self.conn.cursor()
        cursor.execute("""
            DELETE FROM pokemon_evolutions 
            WHERE pokemon_id = ? AND evolves_to = ?
        """, (pokemon_id, evolves_to_id))
        self.conn.commit()
    
    def fetch_evolution_details(self, pokemon_id):
        cursor = self.conn.cursor()
        query = """
            SELECT evolution_id, evolves_to, candies_needed, trade_discount, item_id, other
            FROM pokemon_evolutions
            WHERE pokemon_id = ?
        """
        cursor.execute(query, (pokemon_id,))
        return cursor.fetchall()

    def update_evolution_details(self, evolution_id, evolves_to_id, candies_needed, trade_discount, item_id, other):
        cursor = self.conn.cursor()
        query = """
            UPDATE pokemon_evolutions
            SET evolves_to = ?, candies_needed = ?, trade_discount = ?, item_id = ?, other = ?
            WHERE evolution_id = ?
        """
        parameters = (evolves_to_id, candies_needed, trade_discount, item_id, other, evolution_id)
        cursor.execute(query, parameters)
        self.conn.commit()

    def fetch_evolution_details_for_evolves_to(self, pokemon_id, evolves_to_id):
        cursor = self.conn.cursor()
        query = """
            SELECT evolution_id, evolves_to, candies_needed, trade_discount, item_id, other
            FROM pokemon_evolutions
            WHERE pokemon_id = ? AND evolves_to = ?
        """
        cursor.execute(query, (pokemon_id, evolves_to_id))
        return cursor.fetchall()
    
    def update_evolution_details(self, evolution_id, updated_data):
        cursor = self.conn.cursor()
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
        cursor = self.conn.cursor()
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
        cursor = self.conn.cursor()
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
        cursor = self.conn.cursor()
        query = """
            SELECT * FROM costume_pokemon WHERE pokemon_id = ?
        """
        cursor.execute(query, (pokemon_id,))
        return cursor.fetchall()

    def update_pokemon_costume(self, costume_id, updated_details):
        cursor = self.conn.cursor()
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
        cursor = self.conn.cursor()
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
        cursor = self.conn.cursor()
        cursor.execute("DELETE FROM costume_pokemon WHERE costume_id = ?", (costume_id,))
        self.conn.commit()

    def fetch_shadow_costume_data(self, pokemon_id):
        cursor = self.conn.cursor()
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
        cursor = self.conn.cursor()
        # Select only shadows related to the specific Pokémon
        cursor.execute("""
            SELECT id FROM shadow_pokemon
            WHERE pokemon_id = ?
        """, (pokemon_id,))
        return [str(row[0]) for row in cursor.fetchall()]

    def fetch_costume_options(self, pokemon_id):
        cursor = self.conn.cursor()
        # Select only costumes related to the specific Pokémon
        cursor.execute("""
            SELECT costume_id, costume_name FROM costume_pokemon
            WHERE pokemon_id = ?
        """, (pokemon_id,))
        return ["{}: {}".format(row[0], row[1]) for row in cursor.fetchall()]
    
    def save_shadow_costume(self, shadow_id, costume_id, date_available, date_shiny_available, image_url_shadow_costume, image_url_shiny_shadow_costume):
        cursor = self.conn.cursor()
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
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT id, mega_energy_cost, attack, defense, stamina, image_url, image_url_shiny, sprite_url, primal, form, type_1_id, type_2_id
            FROM mega_evolution
            WHERE pokemon_id = ?
        """, (pokemon_id,))
        results = cursor.fetchall()
        return results

    def update_mega_evolution_data(self, mega_data_list):
        cursor = self.conn.cursor()
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
        cursor = self.conn.cursor()
        insert_query = """
            INSERT INTO mega_evolution (pokemon_id, mega_energy_cost, attack, defense, stamina, image_url, image_url_shiny, sprite_url, primal, form, type_1_id, type_2_id)
            VALUES (?, 0, 0, 0, 0, '', '', '', 'None', '', NULL, NULL)
        """
        cursor.execute(insert_query, (pokemon_id,))
        self.conn.commit()
        return cursor.lastrowid