import tkinter as tk
from tkinter import ttk
from database_manager import DatabaseManager
from pokemon_details_window import PokemonDetailsWindow

class PokemonDatabaseApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Pokémon Database Editor")
        self.root.state('zoomed') 
        self.db_manager = DatabaseManager('backend/data/pokego.db')
        self.create_widgets()
        self.load_pokemon_list()
        self.sort_options = ['pokemon_id', 'name', 'pokedex_number', 'generation', 'date_available', 'date_shiny_available']
        self.create_sort_dropdown()

    def create_widgets(self):
        self.scrollbar = ttk.Scrollbar(self.root)
        self.scrollbar.pack(side=tk.RIGHT, fill=tk.Y)

        self.pokemon_listbox = tk.Listbox(self.root, yscrollcommand=self.scrollbar.set)
        self.pokemon_listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        self.scrollbar.config(command=self.pokemon_listbox.yview)
        self.pokemon_listbox.bind('<<ListboxSelect>>', self.on_pokemon_select)

    def create_sort_dropdown(self):
        self.sort_var = tk.StringVar()
        self.sort_dropdown = ttk.Combobox(self.root, textvariable=self.sort_var, values=self.sort_options)
        self.sort_dropdown.pack()
        self.sort_dropdown.set('pokemon_id')
        self.sort_dropdown.bind("<<ComboboxSelected>>", self.on_sort_selection_changed)

    def on_sort_selection_changed(self, event):
        sort_by = self.sort_var.get()
        self.load_pokemon_list_sorted(sort_by)

    def load_pokemon_list(self):
    # Default sort by 'pokemon_id'
        self.load_pokemon_list_sorted('pokemon_id')

    def load_pokemon_list_sorted(self, sort_by='pokemon_id'):
        self.pokemon_listbox.delete(0, tk.END)
        pokemon_entries = self.db_manager.fetch_all_pokemon_sorted(sort_by)
        for entry in pokemon_entries:
            self.pokemon_listbox.insert(tk.END, entry)
    
    def on_pokemon_select(self, event):
        index = self.pokemon_listbox.curselection()
        if index:
            pokemon_id = self.pokemon_listbox.get(index).split(':')[0]
            self.show_pokemon_details(pokemon_id)
    
    def show_pokemon_details(self, pokemon_id):
        details = self.db_manager.fetch_pokemon_details(pokemon_id)
        PokemonDetailsWindow(self.root, pokemon_id, details)
