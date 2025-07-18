# frames/pokemon_info_frames.py
import tkinter as tk
from tkinter import ttk


class PokemonInfoFrames:
    def __init__(self, parent, pokemon_data, db_manager):
        self.parent = parent
        self.pokemon_data = pokemon_data
        self.db_manager = db_manager
        self.entry_widgets = {}

        self.general_attributes = [
            "ID",
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
        ]

        self.additional_attributes = [
            "Gender Rate",
            "Rarity",
            "Form",
            "Generation",
            "Available",
            "Shiny Available",
            "Shiny Rarity",
            "Date Available",
            "Date Shiny Available",
        ]

    # ──────────────────────────────────────────────────────────────
    def create_info_frames(self):
        info_container = tk.Frame(self.parent)
        info_container.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        self._create_general_info_frame(info_container)
        self._create_additional_info_frame(info_container)

    # ──────────────────────────────────────────────────────────────
    def _create_general_info_frame(self, container):
        frame = tk.LabelFrame(container, text="General Info", padx=10, pady=10)
        frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=5)

        frame.columnconfigure(1, weight=1)  # entry column flexes

        for i, attr in enumerate(self.general_attributes):
            tk.Label(frame, text=f"{attr}:").grid(row=i, column=0, sticky="e", padx=(0, 4))
            entry = tk.Entry(frame)
            val = self.pokemon_data[i] if self.pokemon_data[i] is not None else ""
            entry.insert(0, str(val))
            entry.grid(row=i, column=1, sticky="ew", pady=1)  # stretch horizontally
            self.entry_widgets[attr] = entry

    # ──────────────────────────────────────────────────────────────
    def _create_additional_info_frame(self, container):
        frame = tk.LabelFrame(container, text="Additional Info", padx=10, pady=10)
        frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=5)

        frame.columnconfigure(1, weight=1)  # entry column flexes

        offset = len(self.general_attributes)
        for i, attr in enumerate(self.additional_attributes):
            tk.Label(frame, text=f"{attr}:").grid(row=i, column=0, sticky="e", padx=(0, 4))
            entry = tk.Entry(frame)
            val = self.pokemon_data[offset + i] if self.pokemon_data[offset + i] is not None else ""
            entry.insert(0, str(val))
            entry.grid(row=i, column=1, sticky="ew", pady=1)  # stretch horizontally
            self.entry_widgets[attr] = entry
