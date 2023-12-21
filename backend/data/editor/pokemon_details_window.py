import tkinter as tk
from tkinter import ttk
from tkinter import messagebox
from database_manager import DatabaseManager

from frames.pokemon_info_frames import PokemonInfoFrames
from frames.pokemon_moves_frame import PokemonMovesFrame
from frames.pokemon_evolutions_frame import PokemonEvolutionsFrame

class PokemonDetailsWindow:
    
    def __init__(self, parent, pokemon_id, details):
        self.window = tk.Toplevel(parent)
        self.window.title(f"Details of Pokémon ID: {pokemon_id}")
        self.window.state('zoomed')

        self.pokemon_id = pokemon_id
        self.db_manager = DatabaseManager('backend/data/pokego.db')  # Adjust the path as necessary

        self.type_ids = self.db_manager.fetch_type_ids()
        self.existing_move_ids = self.db_manager.fetch_pokemon_moves(pokemon_id)

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

        # Main container frame for info and moves
        main_container = tk.Frame(self.scrollable_frame)
        main_container.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # Container for General and Additional Info Frames
        info_container = tk.Frame(main_container)
        info_container.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        self.info_frames = PokemonInfoFrames(info_container, self.pokemon_data, self.db_manager)
        self.info_frames.create_info_frames()

        # Moves Frame
        self.moves_frame = PokemonMovesFrame(main_container, self.db_manager, self.moves)
        self.moves_frame.create_moves_frame()

        # Evolutions Frame
        self.evolutions_frame = PokemonEvolutionsFrame(self.scrollable_frame, self.db_manager, self.pokemon_id, self.evolutions)
        self.evolutions_frame.create_evolutions_frame()

        # Save Button
        save_button = tk.Button(self.window, text="Save Changes", command=self.save_changes)
        save_button.pack(side="bottom", pady=10)

    def save_changes(self):
        # Retrieve general and additional attributes from info_frames
        general_attributes = self.info_frames.general_attributes
        additional_attributes = self.info_frames.additional_attributes

        # Save general and additional attributes
        updated_data = []
        for attr in general_attributes[1:]:  # Skip 'ID'
            value = self.info_frames.entry_widgets[attr].get().strip()
            if attr in ['Type 1', 'Type 2']:
                # Convert type name to type ID
                value = self.type_ids.get(value, None)
            elif not value:
                # Convert empty string to None
                value = None
            updated_data.append(value)

        updated_data.extend([self.info_frames.entry_widgets[attr].get().strip() or None for attr in additional_attributes])

        # Update the general and additional data in the database
        self.db_manager.update_pokemon_data(self.pokemon_id, updated_data)

        move_data = self.moves_frame.save_moves()
        if move_data:
            self.db_manager.update_pokemon_moves(self.pokemon_id, move_data)

        # Save evolutions
        self.evolutions_frame.save_evolutions()

        # Show a confirmation message
        tk.messagebox.showinfo("Update", "Pokemon data updated successfully")

        # Close the window after saving
        self.window.destroy()