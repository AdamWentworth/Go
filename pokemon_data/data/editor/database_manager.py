# database_manager.py

from database.db_utils import DatabaseConnection
from database.pokemon_manager import PokemonManager
from database.shadow_pokemon_manager import ShadowPokemonManager
from database.costume_pokemon_manager import CostumePokemonManager
from database.evolution_manager import EvolutionManager
from database.mega_evolution_manager import MegaEvolutionManager
from database.female_pokemon_manager import FemalePokemonManager

class DatabaseManager:
    def __init__(self, db_path):
        self.conn = DatabaseConnection(db_path)
        self.pokemon_manager = PokemonManager(self.conn)
        self.shadow_pokemon_manager = ShadowPokemonManager(self.conn)
        self.costume_pokemon_manager = CostumePokemonManager(self.conn)
        self.evolution_manager = EvolutionManager(self.conn)
        self.mega_evolution_manager = MegaEvolutionManager(self.conn)
        self.female_pokemon_manager = FemalePokemonManager(self.conn)

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

    # Evolution-related methods
    def add_evolves_to(self, pokemon_id, evolves_to_id):
        return self.evolution_manager.add_evolves_to(pokemon_id, evolves_to_id)

    def remove_evolves_to(self, pokemon_id, evolves_to_id):
        return self.evolution_manager.remove_evolves_to(pokemon_id, evolves_to_id)

    def fetch_evolution_details(self, pokemon_id):
        return self.evolution_manager.fetch_evolution_details(pokemon_id)

    def update_evolution_details(self, evolution_id, evolves_to_id, candies_needed, trade_discount, item_id, other):
        return self.evolution_manager.update_evolution_details(evolution_id, evolves_to_id, candies_needed, trade_discount, item_id, other)

    def fetch_evolution_details_for_evolves_to(self, pokemon_id, evolves_to_id):
        return self.evolution_manager.fetch_evolution_details_for_evolves_to(pokemon_id, evolves_to_id)
    
    # Costume-related methods
    def fetch_pokemon_costumes(self, pokemon_id):
        return self.costume_pokemon_manager.fetch_pokemon_costumes(pokemon_id)

    def update_pokemon_costume(self, costume_id, updated_details):
        return self.costume_pokemon_manager.update_pokemon_costume(costume_id, updated_details)

    def add_costume(self, pokemon_id, costume_details):
        return self.costume_pokemon_manager.add_costume(pokemon_id, costume_details)

    def delete_costume(self, costume_id):
        return self.costume_pokemon_manager.delete_costume(costume_id)
    
    def fetch_costume_options(self, pokemon_id):
        return self.costume_pokemon_manager.fetch_costume_options(pokemon_id)

    # Shadow Pokémon-related methods
    def fetch_shadow_pokemon_data(self, pokemon_id):
        return self.shadow_pokemon_manager.fetch_shadow_pokemon_data(pokemon_id)

    def update_shadow_pokemon_data(self, pokemon_id, shadow_data):
        return self.shadow_pokemon_manager.update_shadow_pokemon_data(pokemon_id, shadow_data)

    def fetch_shadow_costume_data(self, pokemon_id):
        return self.shadow_pokemon_manager.fetch_shadow_costume_data(pokemon_id)
        
    def fetch_shadow_options(self, pokemon_id):
        return self.shadow_pokemon_manager.fetch_shadow_options(pokemon_id)
    
    def save_shadow_costume(self, shadow_id, costume_id, date_available, date_shiny_available, image_url_shadow_costume, image_url_shiny_shadow_costume):
        return self.shadow_pokemon_manager.save_shadow_costume(shadow_id, costume_id, date_available, date_shiny_available, image_url_shadow_costume, image_url_shiny_shadow_costume)

    # Mega Evolution-related methods
    def fetch_mega_pokemon_data(self, pokemon_id):
        return self.mega_evolution_manager.fetch_mega_pokemon_data(pokemon_id)

    def update_mega_evolution_data(self, mega_data_list):
        return self.mega_evolution_manager.update_mega_evolution_data(mega_data_list)

    def add_mega_evolution(self, pokemon_id):
        return self.mega_evolution_manager.add_mega_evolution(pokemon_id)
    
    # Female Pokémon-related methods
    def fetch_female_pokemon(self):
        return self.female_pokemon_manager.fetch_female_pokemon()

    def fetch_female_pokemon_image_data(self, pokemon_id):
        return self.female_pokemon_manager.fetch_female_pokemon_image_data(pokemon_id)

    def update_female_pokemon_images(self, pokemon_id, image_data):
        return self.female_pokemon_manager.update_female_pokemon_images(pokemon_id, image_data)