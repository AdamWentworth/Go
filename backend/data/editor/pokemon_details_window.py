import tkinter as tk
from tkinter import ttk

class PokemonDetailsWindow:
    def __init__(self, parent, pokemon_id, details):
        self.window = tk.Toplevel(parent)
        self.window.title(f"Details of Pokémon ID: {pokemon_id}")
        self.window.state('zoomed')

        # Scrollable container setup
        self.canvas = tk.Canvas(self.window)
        self.scrollable_frame = ttk.Frame(self.canvas)

        self.scrollbar = ttk.Scrollbar(self.window, orient="vertical", command=self.canvas.yview)
        self.canvas.configure(yscrollcommand=self.scrollbar.set)
        self.scrollbar.pack(side="right", fill="y")
        self.canvas.pack(side="left", fill="both", expand=True)
        self.canvas.create_window((0, 0), window=self.scrollable_frame, anchor="nw")

        self.scrollable_frame.bind("<Configure>", lambda e: self.canvas.configure(scrollregion=self.canvas.bbox("all")))

        # Assuming details is a tuple of (pokemon_data, moves, evolutions)
        self.pokemon_data, self.moves, self.evolutions = details

        self.create_info_frames()
        self.create_moves_frame()
        self.create_evolutions_frame()

    def create_info_frames(self):
        # Info container frame
        info_container = tk.Frame(self.scrollable_frame)
        info_container.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # General info frame on the left
        general_frame = tk.LabelFrame(info_container, text="General Info", padx=10, pady=10)
        general_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=5)

        general_attributes = [
            'ID', 'Name', 'Pokedex Number', 'Image URL', 'Image URL Shiny', 'Sprite URL',
            'Attack', 'Defense', 'Stamina', 'Type 1', 'Type 2'
        ]

        for i, attr in enumerate(general_attributes):
            tk.Label(general_frame, text=f"{attr}:").grid(row=i, column=0, sticky='e')
            tk.Label(general_frame, text=self.pokemon_data[i]).grid(row=i, column=1, sticky='w')

        # Additional info frame on the right
        additional_frame = tk.LabelFrame(info_container, text="Additional Info", padx=10, pady=10)
        additional_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=5)

        additional_attributes = [
            'Gender Rate', 'Rarity', 'Form', 'Generation', 'Available',
            'Shiny Available', 'Shiny Rarity', 'Date Available', 'Date Shiny Available'
        ]

        offset = 11
        for i, attr in enumerate(additional_attributes):
            tk.Label(additional_frame, text=f"{attr}:").grid(row=i, column=0, sticky='e')
            tk.Label(additional_frame, text=self.pokemon_data[offset + i]).grid(row=i, column=1, sticky='w')

    def create_moves_frame(self):
        frame = tk.LabelFrame(self.window, text="Moves", padx=10, pady=10)
        frame.pack(padx=10, pady=10, fill='x')

        # Separate moves into fast and charged
        fast_moves_frame = tk.Frame(frame)
        charged_moves_frame = tk.Frame(frame)
        fast_moves_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        charged_moves_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)

        tk.Label(fast_moves_frame, text="Fast Moves").pack(anchor='w')
        tk.Label(charged_moves_frame, text="Charged Moves").pack(anchor='w')

        for move_name, move_type, is_fast in self.moves:
            move_info = f"{move_name} (Type: {move_type})"
            parent_frame = fast_moves_frame if is_fast else charged_moves_frame
            tk.Label(parent_frame, text=move_info).pack(anchor='w')

    def create_evolutions_frame(self):
        evolutions_frame = tk.LabelFrame(self.window, text="Evolutions", padx=10, pady=10)
        evolutions_frame.pack(padx=10, pady=10, fill='x')

        # Display 'evolves from' data
        evolves_from_label = tk.Label(evolutions_frame, text="Evolves From:")
        evolves_from_label.pack(anchor='w')
        for from_id, from_name in self.evolutions['evolves_from']:
            from_info = f"{from_name} (ID: {from_id})"
            tk.Label(evolutions_frame, text=from_info).pack(anchor='w')

        # Separator
        ttk.Separator(evolutions_frame, orient='horizontal').pack(fill='x', pady=5)

        # Display 'evolves to' data
        evolves_to_label = tk.Label(evolutions_frame, text="Evolves To:")
        evolves_to_label.pack(anchor='w')
        for to_id, to_name in self.evolutions['evolves_to']:
            to_info = f"{to_name} (ID: {to_id})"
            tk.Label(evolutions_frame, text=to_info).pack(anchor='w')