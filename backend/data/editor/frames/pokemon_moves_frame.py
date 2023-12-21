# pokemon_moves_frame.py
import tkinter as tk
from tkinter import ttk

class PokemonMovesFrame:
    def __init__(self, parent, db_manager, moves):
        self.parent = parent
        self.db_manager = db_manager
        self.moves = moves
        self.move_counter = 0
        self.move_entries = {}

        self.fast_moves = self.db_manager.fetch_moves(1)  # Fetch fast moves
        self.charged_moves = self.db_manager.fetch_moves(0)  # Fetch charged moves

    def create_moves_frame(self):
        frame = tk.LabelFrame(self.parent, text="Moves", padx=10, pady=10)
        frame.pack(padx=10, pady=10, fill='x')

        # Separate moves into fast and charged
        fast_moves_frame = tk.Frame(frame)
        charged_moves_frame = tk.Frame(frame)
        fast_moves_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        charged_moves_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True)

        tk.Label(fast_moves_frame, text="Fast Moves").pack(anchor='w')
        tk.Label(charged_moves_frame, text="Charged Moves").pack(anchor='w')

        # Create move entries
        for move_name, move_type, is_fast, is_legacy in self.moves:
            self.add_move_entry(move_name, is_fast, is_legacy, fast_moves_frame if is_fast else charged_moves_frame)

        # Add buttons for new move slots
        tk.Button(fast_moves_frame, text="Add Fast Move", command=lambda: self.add_move_entry('', True, False, fast_moves_frame)).pack()
        tk.Button(charged_moves_frame, text="Add Charged Move", command=lambda: self.add_move_entry('', False, False, charged_moves_frame)).pack()

    def add_move_entry(self, move_name, is_fast, is_legacy, parent_frame):
        move_key = f"move_{self.move_counter}"
        self.move_counter += 1

        move_var = tk.StringVar(value=move_name)
        move_dropdown = ttk.Combobox(parent_frame, textvariable=move_var, values=list(self.fast_moves.keys() if is_fast else self.charged_moves.keys()))
        move_dropdown.pack()

        legacy_var = tk.BooleanVar(value=is_legacy)
        legacy_checkbox = tk.Checkbutton(parent_frame, text="Legacy", variable=legacy_var)
        legacy_checkbox.pack()

        delete_button = tk.Button(parent_frame, text="Delete", command=lambda: self.delete_move_entry(move_key))
        delete_button.pack()

        self.move_entries[move_key] = {
            'move_var': move_var,
            'move_dropdown': move_dropdown,
            'delete_button': delete_button,
            'legacy_var': legacy_var,
            'legacy_checkbox': legacy_checkbox  # Add the checkbox to the dictionary
        }

    def delete_move_entry(self, move_key):
        entry = self.move_entries.pop(move_key, None)
        if entry:
            entry['move_dropdown'].destroy()
            entry['delete_button'].destroy()
            entry['legacy_checkbox'].destroy()

    def save_moves(self):
        move_data = []
        for key, move_entry in self.move_entries.items():
            move_name = move_entry['move_var'].get()
            if move_name:
                move_id = self.fast_moves.get(move_name) or self.charged_moves.get(move_name)
                is_legacy = move_entry['legacy_var'].get()
                if move_id:
                    move_data.append((move_id, int(is_legacy)))
        
        return move_data
