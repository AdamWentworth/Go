import tkinter as tk
from tkinter import ttk

class PokemonShadowFrame(tk.Frame):
    def __init__(self, parent, pokemon_id, shadow_pokemon_data, db_manager):
        super().__init__(parent)
        self.pokemon_id = pokemon_id
        self.shadow_pokemon_data = shadow_pokemon_data
        self.db_manager = db_manager

        self.shadow_attributes = [
            'Shiny Available', 'Apex', 'Date Available', 'Date Shiny Available', 
            'Image URL Shadow', 'Image URL Shiny Shadow'
        ]

        # Initialize the entry widgets dictionary
        self.entry_widgets = {}

        # If shadow_pokemon_data is None, initialize it with default values
        if not self.shadow_pokemon_data:
            self.shadow_pokemon_data = [None] * len(self.shadow_attributes)

        self.create_shadow_frame()

    def create_shadow_frame(self):
        self.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        self._create_shadow_info_frame(self)

    def _create_shadow_info_frame(self, container):
        shadow_frame = tk.LabelFrame(container, text="Shadow Info", padx=10, pady=10)
        shadow_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=5)

        for i, attr in enumerate(self.shadow_attributes):
            tk.Label(shadow_frame, text=f"{attr}:").grid(row=i, column=0, sticky='e')
            entry = tk.Entry(shadow_frame)

            entry_value = self.shadow_pokemon_data[i] if self.shadow_pokemon_data and self.shadow_pokemon_data[i] is not None else ""
            entry.insert(0, str(entry_value))
            entry.grid(row=i, column=1, sticky='w')
            self.entry_widgets[attr] = entry

    def save_shadow_info(self):
        updated_shadow_data = {
            attr: self.entry_widgets[attr].get() for attr in self.shadow_attributes
        }
        # Now, use self.pokemon_id here
        self.db_manager.update_shadow_pokemon_data(self.pokemon_id, updated_shadow_data)
