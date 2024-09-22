# mega_evolution_manager.py

class MegaEvolutionManager:
    def __init__(self, db_conn):
        self.conn = db_conn

    def fetch_mega_pokemon_data(self, pokemon_id):
        cursor = self.conn.get_cursor()
        query = """
            SELECT id, mega_energy_cost, attack, defense, stamina, image_url, image_url_shiny, sprite_url, primal, form, type_1_id, type_2_id
            FROM mega_evolution
            WHERE pokemon_id = ?
        """
        cursor.execute(query, (pokemon_id,))
        return cursor.fetchall()

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
