# frames/pokemon_shadow_frame.py
import tkinter as tk
from tkinter import ttk


class PokemonShadowFrame(tk.Frame):
    def __init__(self, parent, pokemon_id, shadow_pokemon_data, db_manager):
        super().__init__(parent)

        self.pid = int(pokemon_id)
        self.db  = db_manager
        self.shadow_data = shadow_pokemon_data or [None] * 6

        self.attributes = (
            "Shiny Available", "Apex",
            "Date Available", "Date Shiny Available",
            "Image URL Shadow", "Image URL Shiny Shadow",
        )
        self.entry_widgets = {}

        self._build()

    # ──────────────────────────────────────────────────────────────
    def _build(self):
        outer = tk.LabelFrame(self, text="Shadow Info", padx=10, pady=10)
        outer.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        # make the entry column stretchy
        outer.columnconfigure(1, weight=1)

        for i, (label, value) in enumerate(zip(self.attributes, self.shadow_data)):
            tk.Label(outer, text=f"{label}:").grid(row=i, column=0, sticky="e", padx=(0, 4), pady=2)

            ent = tk.Entry(outer)
            ent.insert(0, "" if value is None else str(value))
            ent.grid(row=i, column=1, sticky="ew", pady=2)   # ← fills width
            self.entry_widgets[label] = ent

    # ──────────────────────────────────────────────────────────────
    def save_shadow_info(self):
        data = {lbl: self.entry_widgets[lbl].get().strip() for lbl in self.attributes}
        self.db.update_shadow_pokemon_data(self.pid, data)
