# pokemon_info_frames.py
import tkinter as tk
from tkinter import ttk

class PokemonInfoFrames:
    def __init__(self, parent, pokemon_data, db_manager):
        self.parent = parent
        self.pokemon_data = pokemon_data
        self.db_manager = db_manager
        self.entry_widgets = {}

        self.general_attributes = [
            'ID', 'Name', 'Pokedex Number', 'Image URL', 'Image URL Shiny', 'Sprite URL',
            'Attack', 'Defense', 'Stamina', 'Type 1', 'Type 2'
        ]

        self.additional_attributes = [
            'Gender Rate', 'Rarity', 'Form', 'Generation', 'Available',
            'Shiny Available', 'Shiny Rarity', 'Date Available', 'Date Shiny Available'
        ]

    def create_info_frames(self):
        # Info container frame
        info_container = tk.Frame(self.parent)
        info_container.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # General info frame
        self._create_general_info_frame(info_container)

        # Additional info frame
        self._create_additional_info_frame(info_container)

    def _create_general_info_frame(self, container):
        general_frame = tk.LabelFrame(container, text="General Info", padx=10, pady=10)
        general_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=5)

        for i, attr in enumerate(self.general_attributes):
            tk.Label(general_frame, text=f"{attr}:").grid(row=i, column=0, sticky='e')
            entry = tk.Entry(general_frame)
            entry_value = self.pokemon_data[i] if self.pokemon_data[i] is not None else ""
            entry.insert(0, str(entry_value))
            entry.grid(row=i, column=1, sticky='w')
            self.entry_widgets[attr] = entry

    def _create_additional_info_frame(self, container):
        additional_frame = tk.LabelFrame(container, text="Additional Info", padx=10, pady=10)
        additional_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=5)

        offset = len(self.general_attributes)
        for i, attr in enumerate(self.additional_attributes):
            tk.Label(additional_frame, text=f"{attr}:").grid(row=i, column=0, sticky='e')
            entry = tk.Entry(additional_frame)
            entry_value = self.pokemon_data[offset + i] if self.pokemon_data[offset + i] is not None else ""
            entry.insert(0, str(entry_value))
            entry.grid(row=i, column=1, sticky='w')
            self.entry_widgets[attr] = entry

    # You can add other methods related to Pokemon information frames if needed.
