from details_window.ui_setup import create_scrollable_window, bind_scroll_events
import tkinter as tk
from tkinter import messagebox

from database_manager import DatabaseManager
from frames.fusion_info_frames import FusionInfoFrames
from frames.pokemon_moves_frame import PokemonMovesFrame


class FusionDetailsWindow:
    def __init__(self, parent, fusion_id, details, db_manager=None):
        self.fusion_id = int(fusion_id)
        self.db_manager = db_manager if db_manager is not None else DatabaseManager('../pokemon/data/pokego.db')
        self.type_ids = self.db_manager.fetch_type_ids()

        self.fusion_data, self.moves = details
        if self.fusion_data is None:
            messagebox.showerror("Error", f"No fusion row found for fusion_id={self.fusion_id}")
            return

        self.window, self.canvas, self.scrollable_frame = create_scrollable_window(
            parent,
            f"Details of Fusion ID: {self.fusion_id}",
        )
        bind_scroll_events(self.window, self.canvas)

        main_container = tk.Frame(self.scrollable_frame)
        main_container.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        self.info_frames = FusionInfoFrames(main_container, self.fusion_data)
        self.info_frames.create_info_frames()

        self.moves_frame = PokemonMovesFrame(main_container, self.db_manager, self.moves)
        self.moves_frame.create_moves_frame()

        save_button = tk.Button(self.window, text="Save Changes", command=self.save_changes)
        save_button.pack(side="bottom", pady=10)

    def _get_clean_value(self, attr_name):
        value = self.info_frames.entry_widgets[attr_name].get().strip()
        if attr_name in ['Type 1', 'Type 2']:
            if not value:
                return None
            if value.isdigit():
                return int(value)
            return self.type_ids.get(value, None)
        return value or None

    def save_changes(self):
        update_order = [
            "Base Pokemon ID 1",
            "Base Pokemon ID 2",
            "Name",
            "Pokedex Number",
            "Image URL",
            "Image URL Shiny",
            "Sprite URL",
            "Attack",
            "Defense",
            "Stamina",
            "Type 1",
            "Type 2",
            "Generation",
            "Available",
            "Shiny Available",
            "Shiny Rarity",
            "Date Available",
            "Date Shiny Available",
        ]

        updated_data = [self._get_clean_value(attr) for attr in update_order]
        self.db_manager.update_fusion_data(self.fusion_id, updated_data)

        move_data = self.moves_frame.save_moves()
        self.db_manager.update_fusion_moveset(self.fusion_id, move_data)

        messagebox.showinfo("Update", "Fusion data updated successfully")
        self.window.destroy()
