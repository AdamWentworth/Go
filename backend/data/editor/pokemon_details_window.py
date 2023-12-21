import tkinter as tk
from tkinter import ttk
from tkinter import messagebox
from database_manager import DatabaseManager

class PokemonDetailsWindow:

    general_attributes = [
            'ID', 'Name', 'Pokedex Number', 'Image URL', 'Image URL Shiny', 'Sprite URL',
            'Attack', 'Defense', 'Stamina', 'Type 1', 'Type 2'
        ]
    
    additional_attributes = [
            'Gender Rate', 'Rarity', 'Form', 'Generation', 'Available',
            'Shiny Available', 'Shiny Rarity', 'Date Available', 'Date Shiny Available'
        ]
    
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

        self.create_info_frames()
        self.create_moves_frame()
        self.create_evolutions_frame()

        self.move_counter = 0

    def create_info_frames(self):
        # Info container frame
        info_container = tk.Frame(self.scrollable_frame)
        info_container.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # General info frame on the left
        general_frame = tk.LabelFrame(info_container, text="General Info", padx=10, pady=10)
        general_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=5)

        self.entry_widgets = {}  # Store entry widgets for easy access

        for i, attr in enumerate(self.general_attributes):
            tk.Label(general_frame, text=f"{attr}:").grid(row=i, column=0, sticky='e')
            entry = tk.Entry(general_frame)
            entry_value = self.pokemon_data[i] if self.pokemon_data[i] is not None else ""
            entry.insert(0, str(entry_value))
            entry.grid(row=i, column=1, sticky='w')
            self.entry_widgets[attr] = entry

        # Additional info frame on the right
        additional_frame = tk.LabelFrame(info_container, text="Additional Info", padx=10, pady=10)
        additional_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=5)

        offset = 11
        for i, attr in enumerate(self.additional_attributes):
            tk.Label(additional_frame, text=f"{attr}:").grid(row=i, column=0, sticky='e')
            entry = tk.Entry(additional_frame)
            entry_value = self.pokemon_data[offset + i] if self.pokemon_data[offset + i] is not None else ""
            entry.insert(0, str(entry_value))
            entry.grid(row=i, column=1, sticky='w')
            self.entry_widgets[attr] = entry

    def save_changes(self):
        # Save general and additional attributes
        updated_data = []
        for attr in self.general_attributes[1:]:  # Skip 'ID'
            value = self.entry_widgets[attr].get().strip()
            if attr in ['Type 1', 'Type 2']:
                # Convert type name to type ID
                value = self.type_ids.get(value, None)
            elif not value:
                # Convert empty string to None
                value = None
            updated_data.append(value)

        updated_data.extend([self.entry_widgets[attr].get().strip() or None for attr in self.additional_attributes])

        # Update the general and additional data in the database
        self.db_manager.update_pokemon_data(self.pokemon_id, updated_data)

        # Save moves
        self.save_moves()

        # Show a confirmation message
        tk.messagebox.showinfo("Update", "Pokemon data updated successfully")

        # Close the window after saving
        self.window.destroy()

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

        self.fast_moves = self.db_manager.fetch_moves(1)  # Fetch fast moves
        self.charged_moves = self.db_manager.fetch_moves(0)  # Fetch charged moves

        self.move_entries = {}  # Use a dictionary to associate moves with their UI elements

        # Process each move with legacy status
        for move_name, move_type, is_fast, is_legacy in self.moves:
            parent_frame = fast_moves_frame if is_fast else charged_moves_frame
            move_var, move_dropdown, legacy_var = self.create_move_slot(parent_frame, move_name, is_fast, is_legacy)
            
            delete_button = tk.Button(parent_frame, text="Delete", command=lambda mn=move_name: self.delete_move_entry(mn))
            delete_button.pack()
            
            self.move_entries[move_name] = {
                'move_var': move_var, 
                'move_dropdown': move_dropdown, 
                'delete_button': delete_button, 
                'legacy_var': legacy_var
            }

            # Add buttons for new move slots
        tk.Button(fast_moves_frame, text="Add Fast Move", command=lambda: self.add_move_slot(fast_moves_frame, True)).pack()
        tk.Button(charged_moves_frame, text="Add Charged Move", command=lambda: self.add_move_slot(charged_moves_frame, False)).pack()
        
    def delete_move_entry(self, move_name):
        # Get the move entry components
        move_var, move_dropdown, delete_button = self.move_entries.pop(move_name, (None, None, None))
        if move_dropdown and delete_button:
            move_dropdown.destroy()
            delete_button.destroy()

    def create_move_slot(self, parent_frame, move_name='', is_fast=True, is_legacy=False):
        move_var = tk.StringVar()
        move_var.set(move_name)

        moves = self.fast_moves if is_fast else self.charged_moves
        move_dropdown = ttk.Combobox(parent_frame, textvariable=move_var, values=list(moves.keys()))
        move_dropdown.pack()

        legacy_var = tk.BooleanVar(value=is_legacy)
        legacy_checkbox = tk.Checkbutton(parent_frame, text="Legacy", variable=legacy_var)
        legacy_checkbox.pack()

        return move_var, move_dropdown, legacy_var

    def add_move_slot(self, parent_frame, is_fast):
        # Create a new move slot
        move_var, move_dropdown, legacy_var = self.create_move_slot(parent_frame, is_fast=is_fast)

        # Generate a unique key for the new move entry
        move_key = f"new_move_{self.move_counter}"
        self.move_counter += 1

        # Add the new move entry to self.move_entries
        self.move_entries[move_key] = {
            'move_var': move_var, 
            'move_dropdown': move_dropdown, 
            'legacy_var': legacy_var
        }

    def save_moves(self):
        move_data = []
        for key, move_entry in self.move_entries.items():
            move_name = move_entry['move_var'].get()
            if move_name:
                move_id = self.fast_moves.get(move_name) or self.charged_moves.get(move_name)
                is_legacy = move_entry['legacy_var'].get()
                if move_id:
                    move_data.append((move_id, int(is_legacy)))
        
        if move_data:
            self.db_manager.update_pokemon_moves(self.pokemon_id, move_data)

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
        
        save_button = tk.Button(self.scrollable_frame, text="Save Changes", command=self.save_changes)
        save_button.pack()

    