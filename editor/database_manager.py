# database_manager.py

from database.db_utils import DatabaseConnection
from database.pokemon_manager import PokemonManager
from database.shadow_pokemon_manager import ShadowPokemonManager
from database.costume_pokemon_manager import CostumePokemonManager
from database.evolution_manager import EvolutionManager
from database.mega_evolution_manager import MegaEvolutionManager
from database.fusion_pokemon_manager import FusionPokemonManager
from database.female_pokemon_manager import FemalePokemonManager
from database.max_pokemon_manager   import MaxPokemonManager
from database.size_pokemon_manager  import SizePokemonManager
from database.background_pokemon_manager import BackgroundPokemonManager
from database.move_manager import MoveManager

class DatabaseManager:
    def __init__(self, db_target):
        self.conn = DatabaseConnection(db_target)
        self.pokemon_manager = PokemonManager(self.conn)
        self.shadow_pokemon_manager = ShadowPokemonManager(self.conn)
        self.costume_pokemon_manager = CostumePokemonManager(self.conn)
        self.evolution_manager = EvolutionManager(self.conn)
        self.mega_evolution_manager = MegaEvolutionManager(self.conn)
        self.fusion_pokemon_manager = FusionPokemonManager(self.conn)
        self.female_pokemon_manager = FemalePokemonManager(self.conn)
        self.max_pokemon_manager   = MaxPokemonManager(self.conn)
        self.size_pokemon_manager  = SizePokemonManager(self.conn)
        self.background_pokemon_manager = BackgroundPokemonManager(self.conn)
        self.move_manager = MoveManager(self.conn)

    def fetch_all_pokemon_sorted(self, sort_by='pokemon_id'):
        return self.pokemon_manager.fetch_all_pokemon_sorted(sort_by)

    def fetch_all_fusions_sorted(self, sort_by='fusion_id'):
        return self.fusion_pokemon_manager.fetch_all_fusions_sorted(sort_by)

    def fetch_all_moves_sorted(self, sort_by='move_id'):
        return self.move_manager.fetch_all_moves_sorted(sort_by)
    
    def fetch_type_ids(self):
        cursor = self.conn.get_cursor()
        cursor.execute("SELECT type_id, name FROM types")
        return {name: type_id for type_id, name in cursor.fetchall()}
    
    def fetch_moves(self, is_fast):
        cursor = self.conn.get_cursor()
        cursor.execute(
            "SELECT move_id, name FROM moves WHERE is_fast = ?",
            (self.conn.bool_value(is_fast),),
        )
        return {name: move_id for move_id, name in cursor.fetchall()}
    
    def fetch_pokemon_moves(self, pokemon_id):
        return self.pokemon_manager.fetch_pokemon_moves(pokemon_id)

    def fetch_pokemon_details(self, pokemon_id):
        return self.pokemon_manager.fetch_pokemon_details(pokemon_id)    

    def fetch_pokemon_name(self, pokemon_id):
        return self.pokemon_manager.fetch_pokemon_name(pokemon_id)

    def fetch_fusion_details(self, fusion_id):
        return self.fusion_pokemon_manager.fetch_fusion_details(fusion_id)

    def fetch_move_details(self, move_id):
        return self.move_manager.fetch_move_details(move_id)
    
    def update_pokemon_data(self, pokemon_id, data):
        return self.pokemon_manager.update_pokemon_data(pokemon_id, data)

    def update_pokemon_moves(self, pokemon_id, move_data):
        return self.pokemon_manager.update_pokemon_moves(pokemon_id, move_data)

    def fetch_fusion_moves(self, fusion_id):
        return self.fusion_pokemon_manager.fetch_fusion_moves(fusion_id)

    def update_fusion_data(self, fusion_id, data):
        return self.fusion_pokemon_manager.update_fusion_data(fusion_id, data)

    def update_fusion_moveset(self, fusion_id, move_data):
        return self.fusion_pokemon_manager.update_fusion_moveset(fusion_id, move_data)

    def add_move(self, move_id, data):
        return self.move_manager.add_move(move_id, data)

    def update_move(self, move_id, data):
        return self.move_manager.update_move(move_id, data)

    def delete_move(self, move_id):
        return self.move_manager.delete_move(move_id)

    def count_move_usage(self, move_id):
        return self.move_manager.count_move_usage(move_id)

    def fetch_fusion_background_rule_rows(self, fusion_id):
        return self.fusion_pokemon_manager.fetch_fusion_background_rule_rows(fusion_id)

    def add_fusion_background_rule(
        self,
        fusion_id,
        member1_background_id,
        member2_background_id,
        combo_background_id,
        is_active=1,
        notes=None,
    ):
        return self.fusion_pokemon_manager.add_fusion_background_rule(
            fusion_id,
            member1_background_id,
            member2_background_id,
            combo_background_id,
            is_active,
            notes,
        )

    def update_fusion_background_rule(
        self,
        rule_id,
        member1_background_id,
        member2_background_id,
        combo_background_id,
        is_active=1,
        notes=None,
    ):
        return self.fusion_pokemon_manager.update_fusion_background_rule(
            rule_id,
            member1_background_id,
            member2_background_id,
            combo_background_id,
            is_active,
            notes,
        )

    def delete_fusion_background_rule(self, rule_id):
        return self.fusion_pokemon_manager.delete_fusion_background_rule(rule_id)

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
    
    # Max Pokémon-related methods
    def fetch_max_pokemon(self, pokemon_id):
        return self.max_pokemon_manager.fetch_max_pokemon(pokemon_id)

    def insert_max_pokemon(self, pokemon_id):
        return self.max_pokemon_manager.insert_max_pokemon(pokemon_id)

    def update_max_pokemon(self, pokemon_id, data_tuple):
        # data_tuple = (dyn, giga, dyn_dt, giga_dt, g_img, sg_img, move_name, move_type_id)
        return self.max_pokemon_manager.update_max_pokemon(pokemon_id, *data_tuple)

    # Pokémon size helpers
    def fetch_size_data(self, pokemon_id):
        return self.size_pokemon_manager.fetch_size_data(pokemon_id)

    def update_size_data(self, pokemon_id, data_tuple):
        return self.size_pokemon_manager.upsert_size_data(pokemon_id, data_tuple)
    
    # Background-related methods
    def fetch_all_backgrounds(self):
        return self.background_pokemon_manager.fetch_all_backgrounds()

    def fetch_pokemon_background_rows(self, pokemon_id):
        return self.background_pokemon_manager.fetch_pokemon_background_rows(pokemon_id)

    def add_background(self, name, location, image_url, date_value):
        return self.background_pokemon_manager.add_background(
            name,
            location,
            image_url,
            date_value,
        )

    def update_background(self, background_id, name, location, image_url, date_value):
        return self.background_pokemon_manager.update_background(
            background_id,
            name,
            location,
            image_url,
            date_value,
        )

    def delete_background(self, background_id):
        return self.background_pokemon_manager.delete_background(background_id)

    def count_background_usage(self, background_id):
        return self.background_pokemon_manager.count_background_usage(background_id)

    def add_pokemon_background_link(self, pokemon_id, background_id, costume_id):
        return self.background_pokemon_manager.add_pokemon_background_link(
            pokemon_id,
            background_id,
            costume_id,
        )

    def update_pokemon_background_link(self, link_row_id, background_id, costume_id):
        return self.background_pokemon_manager.update_pokemon_background_link(
            link_row_id,
            background_id,
            costume_id,
        )

    def delete_pokemon_background_link(self, link_row_id):
        return self.background_pokemon_manager.delete_pokemon_background_link(link_row_id)

    # Female Pokémon-related methods
    def fetch_female_pokemon(self):
        return self.female_pokemon_manager.fetch_female_pokemon()

    def fetch_female_pokemon_image_data(self, pokemon_id):
        return self.female_pokemon_manager.fetch_female_pokemon_image_data(pokemon_id)

    def update_female_pokemon_images(self, pokemon_id, image_data):
        return self.female_pokemon_manager.update_female_pokemon_images(pokemon_id, image_data)
