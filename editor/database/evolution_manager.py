# evolution_manager.py

class EvolutionManager:
    def __init__(self, db_conn):
        self.conn = db_conn

    def add_evolves_to(self, pokemon_id, evolves_to_id):
        cursor = self.conn.get_cursor()
        cursor.execute("""
            INSERT INTO pokemon_evolutions (pokemon_id, evolves_to)
            VALUES (?, ?)
        """, (pokemon_id, evolves_to_id))
        self.conn.commit()
        return cursor.lastrowid

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
