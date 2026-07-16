# pokemon_details_window.py
import os
import tkinter as tk

from database_manager import DatabaseManager
from config import catalog_database_target
from details_window.ui_setup import create_scrollable_window, bind_scroll_events
from frames.pokemon_background_frame import PokemonBackgroundFrame
from frames.pokemon_costume_image_frame import PokemonCostumeImageFrame
from frames.pokemon_evolutions_frame import PokemonEvolutionsFrame
from frames.pokemon_female_image_frame import PokemonFemaleImageFrame
from frames.pokemon_image_frame import PokemonImageFrame
from frames.pokemon_info_frames import PokemonInfoFrames
from frames.pokemon_max_frame import PokemonMaxFrame
from frames.pokemon_mega_frame import PokemonMegaFrame
from frames.pokemon_moves_frame import PokemonMovesFrame
from frames.pokemon_shadow_costume_frame import PokemonShadowCostumeFrame
from frames.pokemon_shadow_frame import PokemonShadowFrame
from frames.pokemon_shadow_image_frames import PokemonShadowImageFrame, PokemonShinyShadowImageFrame
from frames.pokemon_shiny_image_frame import PokemonShinyImageFrame
from utils.image_cache import LocalImagePreviewCache


class PokemonDetailsWindow:
    def __init__(self, parent, pokemon_id, details, db_manager=None):
        self.pokemon_id = pokemon_id
        self.db_manager = db_manager if db_manager is not None else DatabaseManager(catalog_database_target())

        self.shadow_pokemon_data = self.db_manager.fetch_shadow_pokemon_data(pokemon_id)
        self.max_pokemon_row = self.db_manager.fetch_max_pokemon(pokemon_id)
        self.size_data = self.db_manager.fetch_size_data(pokemon_id)
        self.type_ids = self.db_manager.fetch_type_ids()
        self.existing_move_ids = self.db_manager.fetch_pokemon_moves(pokemon_id)

        script_directory = os.path.dirname(os.path.realpath(__file__))
        assets_directory = os.path.normpath(os.path.join(script_directory, "../assets"))
        self.relative_path_to_images = assets_directory
        self.preview_cache = LocalImagePreviewCache()

        self.window, self.canvas, self.scrollable_frame = create_scrollable_window(
            parent,
            f"Details of Pokemon ID: {pokemon_id}",
        )
        bind_scroll_events(self.window, self.canvas)

        self.pokemon_data, self.moves, self.evolutions = details

        main_container = tk.Frame(self.scrollable_frame)
        main_container.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        self.create_info_and_moves_frames(main_container)
        self.create_evolution_and_images_row(main_container)
        self.create_female_image_frame(main_container)
        self.create_size_frame(main_container)
        self.create_shadow_row(main_container)
        self.create_max_frame(main_container)
        self.create_mega_frames(main_container)
        self.create_costume_frame(main_container)
        self.create_background_frame(main_container)
        self.create_shadow_costume_frames(main_container)

        save_button = tk.Button(self.window, text="Save Changes", command=self.save_changes)
        save_button.pack(side="bottom", pady=10)

    def create_info_and_moves_frames(self, parent):
        top_container = tk.Frame(parent)
        top_container.pack(side=tk.TOP, fill=tk.BOTH, expand=True)

        info_container = tk.Frame(top_container)
        info_container.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        self.info_frames = PokemonInfoFrames(info_container, self.pokemon_data, self.db_manager)
        self.info_frames.create_info_frames()

        self.moves_frame = PokemonMovesFrame(top_container, self.db_manager, self.moves)
        self.moves_frame.create_moves_frame()

    def create_size_frame(self, parent):
        size_container = tk.Frame(parent)
        size_container.pack(side=tk.TOP, fill=tk.BOTH, expand=True)

        from frames.pokemon_size_frame import PokemonSizeFrame

        self.size_frame = PokemonSizeFrame(
            size_container,
            self.pokemon_id,
            self.size_data,
        )
        self.size_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=10, pady=10)

    def create_evolutions_and_shadow_frames(self, parent):
        second_container = tk.Frame(parent)
        second_container.pack(side=tk.TOP, fill=tk.BOTH, expand=True)

        self.evolutions_frame = PokemonEvolutionsFrame(second_container, self.db_manager, self.pokemon_id, self.evolutions)
        self.evolutions_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        self.shadow_frame = PokemonShadowFrame(second_container, self.pokemon_id, self.shadow_pokemon_data, self.db_manager)
        self.shadow_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

    def create_image_frames(self, parent):
        image_frames_container = tk.Frame(parent)
        image_frames_container.pack(side=tk.TOP, fill=tk.BOTH, expand=True)

        image_url = self.pokemon_data[3]
        self.image_frame = PokemonImageFrame(image_frames_container, image_url, self.pokemon_id, self)
        self.image_frame.frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        shiny_image_url = self.pokemon_data[4]
        self.shiny_image_frame = PokemonShinyImageFrame(image_frames_container, shiny_image_url, self.pokemon_id, self)
        self.shiny_image_frame.frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        shadow_image_url = self.shadow_pokemon_data[4] if len(self.shadow_pokemon_data) > 4 else None
        shiny_shadow_image_url = self.shadow_pokemon_data[5] if len(self.shadow_pokemon_data) > 5 else None

        self.shadow_image_frame = PokemonShadowImageFrame(image_frames_container, shadow_image_url, self.pokemon_id, self)
        self.shadow_image_frame.frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        self.shiny_shadow_image_frame = PokemonShinyShadowImageFrame(
            image_frames_container,
            shiny_shadow_image_url,
            self.pokemon_id,
            self,
        )
        self.shiny_shadow_image_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

    def create_mega_frames(self, parent):
        mega_container = tk.LabelFrame(parent, text="Mega Evolution Info", padx=10, pady=10)
        mega_container.pack(side=tk.TOP, fill=tk.BOTH, expand=True)

        mega_evolutions = self.db_manager.fetch_mega_pokemon_data(self.pokemon_id)
        self.mega_frames = []
        for mega_data in mega_evolutions:
            mega_evolution_id = mega_data[0]
            mega_frame = PokemonMegaFrame(mega_container, mega_evolution_id, self.pokemon_id, mega_data[1:], self)
            mega_frame.frame.pack(side=tk.TOP, fill=tk.BOTH, expand=True)
            self.mega_frames.append(mega_frame)

        self.btn_add_mega = tk.Button(mega_container, text="Add Mega Evolution", command=self.add_mega_evolution)
        self.btn_add_mega.pack(side=tk.BOTTOM, pady=10)

    def create_shadow_costume_frames(self, parent):
        shadow_costume_container = tk.Frame(parent)
        shadow_costume_container.pack(side=tk.TOP, fill=tk.BOTH, expand=True)

        self.shadow_costume_frame = PokemonShadowCostumeFrame(shadow_costume_container, self.db_manager, self.pokemon_id)
        self.shadow_costume_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

    def create_costume_frame(self, parent):
        self.costume_frame = PokemonCostumeImageFrame(parent, self.pokemon_id, self)
        self.costume_frame.pack(side=tk.TOP, fill=tk.BOTH, expand=True)

    def create_background_frame(self, parent):
        container = tk.Frame(parent)
        container.pack(side=tk.TOP, fill=tk.BOTH, expand=True)
        self.background_frame = PokemonBackgroundFrame(
            container,
            self.pokemon_id,
            self.db_manager,
            self,
        )
        self.background_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=10, pady=10)

    def _on_mousewheel(self, event):
        self.canvas.yview_scroll(int(-1 * (event.delta / 120)), "units")

    def _on_shift_mousewheel(self, event):
        self.canvas.xview_scroll(int(-1 * (event.delta / 120)), "units")

    def react_to_image_update(self):
        self.window.lift()
        self.window.title(f"Details Updated - Pokemon ID: {self.pokemon_id}")

    def set_catalog_image_url(self, field_name, image_url):
        """Keep an added image path in sync with the pending catalog edit."""
        entry = self.info_frames.entry_widgets[field_name]
        entry.delete(0, tk.END)
        entry.insert(0, image_url)

        data_index = {"Image URL": 3, "Image URL Shiny": 4}[field_name]
        self.pokemon_data[data_index] = image_url

    def capture_scroll_position(self):
        if not hasattr(self, "canvas") or self.canvas is None:
            return 0.0, 0.0
        try:
            x_fraction = self.canvas.xview()[0]
            y_fraction = self.canvas.yview()[0]
            return x_fraction, y_fraction
        except Exception:
            return 0.0, 0.0

    def restore_scroll_position(self, position):
        if not hasattr(self, "canvas") or self.canvas is None:
            return

        x_fraction, y_fraction = position

        def _restore():
            try:
                if hasattr(self.window, "update_idletasks"):
                    self.window.update_idletasks()
                self.canvas.xview_moveto(x_fraction)
                self.canvas.yview_moveto(y_fraction)
            except Exception:
                return

        if hasattr(self.window, "after_idle"):
            self.window.after_idle(_restore)
        else:
            _restore()

    def preserve_scroll_position(self, callback):
        position = self.capture_scroll_position()
        result = callback()
        self.restore_scroll_position(position)
        return result

    def add_mega_evolution(self):
        new_mega_id = self.db_manager.add_mega_evolution(self.pokemon_id)

        new_mega_frame = PokemonMegaFrame(
            self.scrollable_frame,
            new_mega_id,
            self.pokemon_id,
            (0, 0, 0, 0, "", "", "", "None", "", None, None),
            self,
        )
        new_mega_frame.frame.pack(side=tk.TOP, fill=tk.BOTH, expand=True)
        self.mega_frames.append(new_mega_frame)

    def create_female_image_frame(self, parent):
        if isinstance(self.pokemon_id, str):
            self.pokemon_id = int(self.pokemon_id)

        female_data = self.db_manager.fetch_female_pokemon_image_data(self.pokemon_id)
        if not any(female_data.values()):
            return

        female_image_url = female_data["image_url"] or "placeholder.png"
        shiny_female_image_url = female_data["shiny_image_url"] or "placeholder.png"
        shadow_female_image_url = female_data["shadow_image_url"] or "placeholder.png"
        shiny_shadow_female_image_url = female_data["shiny_shadow_image_url"] or "placeholder.png"

        self.female_image_frame = PokemonFemaleImageFrame(
            parent,
            female_image_url,
            shiny_female_image_url,
            shadow_female_image_url,
            shiny_shadow_female_image_url,
            self.pokemon_id,
            self,
        )
        self.female_image_frame.frame.pack(side=tk.TOP, fill=tk.BOTH, expand=True)

    def create_max_frame(self, parent):
        max_container = tk.Frame(parent)
        max_container.pack(side=tk.TOP, fill=tk.BOTH, expand=True)
        self.max_frame = PokemonMaxFrame(
            max_container,
            self.pokemon_id,
            self.max_pokemon_row,
            self.db_manager,
            self,
        )
        self.max_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=10, pady=10)

    def create_evolution_and_images_row(self, parent):
        row1 = tk.Frame(parent)
        row1.pack(side=tk.TOP, fill=tk.BOTH, expand=True)

        self.evolutions_frame = PokemonEvolutionsFrame(row1, self.db_manager, self.pokemon_id, self.evolutions)
        self.evolutions_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        img_url = self.pokemon_data[3]
        self.image_frame = PokemonImageFrame(row1, img_url, self.pokemon_id, self)
        self.image_frame.frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        shiny_url = self.pokemon_data[4]
        self.shiny_image_frame = PokemonShinyImageFrame(row1, shiny_url, self.pokemon_id, self)
        self.shiny_image_frame.frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

    def create_shadow_row(self, parent):
        row2 = tk.Frame(parent)
        row2.pack(side=tk.TOP, fill=tk.BOTH, expand=True)

        self.shadow_frame = PokemonShadowFrame(row2, self.pokemon_id, self.shadow_pokemon_data, self.db_manager)
        self.shadow_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        shadow_url = self.shadow_pokemon_data[4] if len(self.shadow_pokemon_data) > 4 else None
        self.shadow_image_frame = PokemonShadowImageFrame(row2, shadow_url, self.pokemon_id, self)
        self.shadow_image_frame.frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        shiny_shadow_url = self.shadow_pokemon_data[5] if len(self.shadow_pokemon_data) > 5 else None
        self.shiny_shadow_image_frame = PokemonShinyShadowImageFrame(row2, shiny_shadow_url, self.pokemon_id, self)
        self.shiny_shadow_image_frame.frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

    def save_changes(self):
        general_attributes = self.info_frames.general_attributes
        additional_attributes = self.info_frames.additional_attributes

        updated_data = []
        for attr in general_attributes[1:]:
            value = self.info_frames.entry_widgets[attr].get().strip()
            if attr in ["Type 1", "Type 2"]:
                value = self.type_ids.get(value, None)
            elif not value:
                value = None
            updated_data.append(value)

        updated_data.extend([self.info_frames.entry_widgets[attr].get().strip() or None for attr in additional_attributes])

        self.db_manager.update_pokemon_data(self.pokemon_id, updated_data)

        move_data = self.moves_frame.save_moves()
        if move_data:
            self.db_manager.update_pokemon_moves(self.pokemon_id, move_data)

        self.evolutions_frame.save_evolutions()

        shadow_data = self.shadow_frame.save_shadow_info()
        if shadow_data:
            self.db_manager.update_shadow_pokemon_data(self.pokemon_id, shadow_data)

        self.shadow_frame.save_shadow_info()

        mega_data_list = [mega_frame.get_mega_data() for mega_frame in self.mega_frames]
        self.db_manager.update_mega_evolution_data(mega_data_list)

        if hasattr(self, "max_frame"):
            max_data = self.max_frame.get_data()
            if max_data is not None:
                self.db_manager.update_max_pokemon(self.pokemon_id, max_data)

        if hasattr(self, "size_frame"):
            size_tuple = self.size_frame.get_data()
            self.db_manager.update_size_data(self.pokemon_id, size_tuple)
        elif hasattr(self, "max_frame"):
            max_data = self.max_frame.get_data()
            self.db_manager.update_max_pokemon(self.pokemon_id, max_data)

        tk.messagebox.showinfo("Update", "Pokemon data updated successfully")
        self.window.destroy()
