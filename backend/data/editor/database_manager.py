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

        # Fetch the moves with the is_fast attribute from the moves table
        cursor.execute("""
            SELECT m.name, t.name, m.is_fast FROM moves m
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
        cursor.execute(update_query, (*data, pokemon_id))
        self.conn.commit()