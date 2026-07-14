# pokemon_database_app.py

import tkinter as tk
from tkinter import ttk

from database_manager import DatabaseManager
from details_window.ui_setup import maximize_window
from fusion_details_window import FusionDetailsWindow
from move_details_window import MoveDetailsWindow
from pokemon_details_window import PokemonDetailsWindow


class PokemonDatabaseApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Pokémon Database Editor")
        maximize_window(self.root)
        self.db_manager = DatabaseManager('../pokemon/data/pokego.db')

        self.entity_options = {
            'Pokemon': 'pokemon',
            'Fusion': 'fusion',
            'Moves': 'moves',
        }
        self.sort_options_by_entity = {
            'pokemon': [
                'pokemon_id',
                'name',
                'pokedex_number',
                'generation',
                'date_available',
                'date_shiny_available',
            ],
            'fusion': [
                'fusion_id',
                'name',
                'base_pokemon_id1',
                'base_pokemon_id2',
                'pokedex_number',
                'generation',
                'date_available',
                'date_shiny_available',
            ],
            'moves': [
                'move_id',
                'name',
                'type_id',
                'is_fast',
                'fusion_id',
                'raid_power',
                'pvp_power',
            ],
        }
        self.current_entity_type = 'pokemon'

        self.create_widgets()
        self.create_filter_controls()
        self.load_pokemon_list()

    def create_widgets(self):
        self.scrollbar = ttk.Scrollbar(self.root)
        self.scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        self.pokemon_listbox = tk.Listbox(self.root, yscrollcommand=self.scrollbar.set)
        self.pokemon_listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        self.scrollbar.config(command=self.pokemon_listbox.yview)
        self.pokemon_listbox.bind('<<ListboxSelect>>', self.on_pokemon_select)

    def create_filter_controls(self):
        controls = tk.Frame(self.root)
        controls.pack(fill=tk.X, padx=10, pady=(8, 0))

        tk.Label(controls, text='Entity:').pack(side=tk.LEFT, padx=(0, 4))
        self.entity_var = tk.StringVar(value='Pokemon')
        self.entity_dropdown = ttk.Combobox(
            controls,
            textvariable=self.entity_var,
            values=list(self.entity_options.keys()),
            state='readonly',
            width=14,
        )
        self.entity_dropdown.pack(side=tk.LEFT, padx=(0, 16))
        self.entity_dropdown.bind('<<ComboboxSelected>>', self.on_entity_selection_changed)

        tk.Label(controls, text='Sort By:').pack(side=tk.LEFT, padx=(0, 4))
        self.sort_var = tk.StringVar()
        self.sort_dropdown = ttk.Combobox(
            controls,
            textvariable=self.sort_var,
            state='readonly',
            width=24,
        )
        self.sort_dropdown.pack(side=tk.LEFT)
        self.sort_dropdown.bind('<<ComboboxSelected>>', self.on_sort_selection_changed)

        self.add_button = tk.Button(
            controls,
            text='Add Move',
            command=self.on_add_button_clicked,
            state=tk.DISABLED,
            width=12,
        )
        self.add_button.pack(side=tk.RIGHT)

        self.update_sort_dropdown()
        self.update_add_button_state()

    def update_sort_dropdown(self):
        options = self.sort_options_by_entity[self.current_entity_type]
        self.sort_dropdown['values'] = options
        if self.sort_var.get() not in options:
            self.sort_var.set(options[0])

    def on_entity_selection_changed(self, event):
        self.current_entity_type = self.entity_options[self.entity_var.get()]
        self.update_sort_dropdown()
        self.update_add_button_state()
        self.load_pokemon_list_sorted(self.sort_var.get())

    def on_sort_selection_changed(self, event):
        sort_by = self.sort_var.get()
        self.load_pokemon_list_sorted(sort_by)

    def load_pokemon_list(self):
        self.load_pokemon_list_sorted(self.sort_var.get())

    def load_pokemon_list_sorted(self, sort_by=None):
        if sort_by is None:
            sort_by = self.sort_var.get()

        self.pokemon_listbox.delete(0, tk.END)
        if self.current_entity_type == 'fusion':
            entries = self.db_manager.fetch_all_fusions_sorted(sort_by)
        elif self.current_entity_type == 'moves':
            entries = self.db_manager.fetch_all_moves_sorted(sort_by)
        else:
            entries = self.db_manager.fetch_all_pokemon_sorted(sort_by)

        for entry in entries:
            self.pokemon_listbox.insert(tk.END, entry)

    def update_add_button_state(self):
        self.add_button.config(
            state=tk.NORMAL if self.current_entity_type == 'moves' else tk.DISABLED
        )

    def on_add_button_clicked(self):
        if self.current_entity_type != 'moves':
            return
        self.show_move_details(None)

    def on_pokemon_select(self, event):
        index = self.pokemon_listbox.curselection()
        if not index:
            return

        selected_id = self.pokemon_listbox.get(index).split(':', 1)[0].strip()
        if self.current_entity_type == 'fusion':
            self.show_fusion_details(selected_id)
        elif self.current_entity_type == 'moves':
            self.show_move_details(selected_id)
        else:
            self.show_pokemon_details(selected_id)

    def show_pokemon_details(self, pokemon_id):
        details = self.db_manager.fetch_pokemon_details(pokemon_id)
        PokemonDetailsWindow(self.root, pokemon_id, details, db_manager=self.db_manager)

    def show_fusion_details(self, fusion_id):
        details = self.db_manager.fetch_fusion_details(fusion_id)
        FusionDetailsWindow(self.root, fusion_id, details, db_manager=self.db_manager)

    def show_move_details(self, move_id):
        details = None
        if move_id is not None:
            details = self.db_manager.fetch_move_details(move_id)
        MoveDetailsWindow(
            self.root,
            move_id,
            details,
            db_manager=self.db_manager,
            on_commit=lambda: self.load_pokemon_list_sorted(self.sort_var.get()),
        )
