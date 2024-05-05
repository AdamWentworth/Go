# pokemon_evolutions_frame.py
import tkinter as tk
from tkinter import ttk

class PokemonEvolutionsFrame(tk.Frame):
    def __init__(self, parent, db_manager, pokemon_id, evolutions):
        super().__init__(parent)  # Initialize the superclass (tk.Frame)
        self.db_manager = db_manager
        self.parent = parent
        self.pokemon_id = pokemon_id
        self.evolutions = evolutions
        self.pending_evolves_to_additions = []
        self.pending_evolves_to_removals = []
        self.evolution_details_frame = None

        self.create_evolutions_frame()

    def create_evolutions_frame(self):
        # Use 'self' instead of a separate container
        self.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        self.create_evolutions_list_frame(self)

        # Initial call with default selected_id, if exists
        initial_selected_id = self.evolutions['evolves_to'][0][0] if self.evolutions['evolves_to'] else None
        self.create_evolution_details_frame(self, initial_selected_id)

    def create_evolutions_list_frame(self, container):
        all_pokemon = self.db_manager.fetch_all_pokemon_sorted()  # Define all_pokemon here

        evolutions_frame = tk.LabelFrame(container, text="Evolutions", padx=10, pady=10)
        evolutions_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=5)

        # Label for 'Evolves From'
        evolves_from_label_text = tk.StringVar()
        evolves_from_label = tk.Label(evolutions_frame, textvariable=evolves_from_label_text)
        evolves_from_label.grid(row=0, column=1, sticky='w')

        if self.evolutions['evolves_from']:
            current_evolves_from = f"{self.evolutions['evolves_from'][0][1]} (ID: {self.evolutions['evolves_from'][0][0]})"
            evolves_from_label_text.set("Evolves From: " + current_evolves_from)
        else:
            evolves_from_label_text.set("Evolves From: None")

        evolves_to_label = tk.Label(evolutions_frame, text="Evolves To:")
        evolves_to_label.grid(row=1, column=0, sticky='w')

        self.evolves_to_listbox = tk.Listbox(evolutions_frame, height=3)  # Set a fixed height
        evolves_to_scroll = tk.Scrollbar(evolutions_frame, orient="vertical")
        self.evolves_to_listbox.config(yscrollcommand=evolves_to_scroll.set)
        evolves_to_scroll.config(command=self.evolves_to_listbox.yview)
        self.evolves_to_listbox.grid(row=1, column=1, sticky='we')
        evolves_to_scroll.grid(row=1, column=1, sticky='ens')

        for to_id, to_name in self.evolutions['evolves_to']:
            self.evolves_to_listbox.insert(tk.END, f"{to_id}: {to_name}")

        self.evolves_to_listbox.bind("<<ListboxSelect>>", self.on_evolves_to_selection)

        self.new_evolves_to_var = tk.StringVar()
        new_evolves_to_combobox = ttk.Combobox(evolutions_frame, textvariable=self.new_evolves_to_var, values=all_pokemon)
        new_evolves_to_combobox.grid(row=2, column=1, sticky='we')
        
        add_evolves_to_button = tk.Button(evolutions_frame, text="Add", command=self.add_evolves_to)
        add_evolves_to_button.grid(row=2, column=2, sticky='w')

        remove_evolves_to_button = tk.Button(evolutions_frame, text="Remove", command=self.remove_selected_evolves_to)
        remove_evolves_to_button.grid(row=3, column=1, sticky='w')

    def create_evolution_details_frame(self, container, selected_id):
        if selected_id is None:
            return
        if not self.evolution_details_frame:
            self.evolution_details_frame = tk.LabelFrame(container, text="Evolution Details", padx=10, pady=10)
            self.evolution_details_frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=5)

        # Clear previous contents
        for widget in self.evolution_details_frame.winfo_children():
            widget.destroy()

        self.evolution_detail_entries = {}  # Dictionary to store entry widgets

        # Initialize labels_values as an empty list to avoid UnboundLocalError
        labels_values = []

        # Fetch evolution details for the selected evolution
        evolution_details = self.db_manager.fetch_evolution_details_for_evolves_to(self.pokemon_id, selected_id)
        for detail in evolution_details:
            evolution_id, evolves_to, candies_needed, trade_discount, item_id, other = detail

            labels_values = [
                ("Evolution ID", evolution_id),
                ("Evolves To", evolves_to),
                ("Candies Needed", candies_needed),
                ("Trade Discount", trade_discount),
                ("Item ID", item_id),
                ("Other", other)
            ]

            for i, (label, value) in enumerate(labels_values):
                tk.Label(self.evolution_details_frame, text=f"{label}:").grid(row=i, column=0, sticky='e', padx=5, pady=2)
                entry = tk.Entry(self.evolution_details_frame)
                entry.insert(0, str(value) if value is not None else "")
                entry.grid(row=i, column=1, sticky='w', padx=5, pady=2)
                self.evolution_detail_entries[label] = entry

        # Add the Save button
        save_button = tk.Button(self.evolution_details_frame, text="Save Changes", command=self.save_evolution_changes)
        # Use the length of labels_values to determine the grid row for the Save button
        save_button.grid(row=len(labels_values), column=0, columnspan=2, pady=5)

    def save_evolution_changes(self):
        # Collect updated data from entry widgets
        updated_data = {}
        for label, entry in self.evolution_detail_entries.items():
            updated_data[label] = entry.get()

        # Assuming evolution_id is always present and is the first item in the details
        evolution_id = updated_data.get("Evolution ID")
        if evolution_id:
            try:
                evolution_id = int(evolution_id)
                # Call the database manager method to update the details
                self.db_manager.update_evolution_details(evolution_id, updated_data)
                # Optionally, show a confirmation message
                tk.messagebox.showinfo("Success", "Evolution details updated successfully")
            except ValueError:
                tk.messagebox.showerror("Error", "Invalid Evolution ID")
        else:
            tk.messagebox.showerror("Error", "Evolution ID is missing")

    def on_evolves_to_selection(self, event):
        if not self.evolves_to_listbox.curselection():
            return

        selected_index = self.evolves_to_listbox.curselection()[0]
        evolves_to_id = self.parse_id_from_dropdown(self.evolves_to_listbox.get(selected_index))

        self.update_evolution_details(evolves_to_id)

    def update_evolution_details(self, evolves_to_id):
        # Initialize evolution details frame if it does not exist
        if self.evolution_details_frame is None:
            self.create_evolution_details_frame(self.parent, evolves_to_id)
        else:
            # Clear previous contents
            for widget in self.evolution_details_frame.winfo_children():
                widget.destroy()

        # Clear the previous contents of the frame
        for widget in self.evolution_details_frame.winfo_children():
            widget.destroy()

        # Fetch and display the details for the selected evolution
        evolution_details = self.db_manager.fetch_evolution_details_for_evolves_to(self.pokemon_id, evolves_to_id)
        if not evolution_details:  # If there are no details (e.g., new evolution)
            evolution_details = [{'evolution_id': None, 'evolves_to': evolves_to_id, 'candies_needed': '', 'trade_discount': '', 'item_id': '', 'other': ''}]  # Default values
        for detail in evolution_details:
            evolution_id, evolves_to, candies_needed, trade_discount, item_id, other = detail

            labels_values = [
                ("Evolution ID", evolution_id),
                ("Evolves To", evolves_to),
                ("Candies Needed", candies_needed),
                ("Trade Discount", trade_discount),
                ("Item ID", item_id),
                ("Other", other)
            ]

            for i, (label, value) in enumerate(labels_values):
                tk.Label(self.evolution_details_frame, text=f"{label}:").grid(row=i, column=0, sticky='e', padx=5, pady=2)
                entry = tk.Entry(self.evolution_details_frame)
                entry.insert(0, str(value) if value is not None else "")
                entry.grid(row=i, column=1, sticky='w', padx=5, pady=2)
                self.evolution_detail_entries[label] = entry

        # Re-add the Save button after updating details
        save_button = tk.Button(self.evolution_details_frame, text="Save Changes", command=self.save_evolution_changes)
        save_button.grid(row=len(labels_values), column=0, columnspan=2, pady=5)

    def update_evolution_details_with_placeholders(self, details):
        # Initialize evolution details frame if it does not exist
        if self.evolution_details_frame is None:
            self.create_evolution_details_frame(self.parent, details['evolves_to'])
        else:
            # Clear previous contents
            for widget in self.evolution_details_frame.winfo_children():
                widget.destroy()

        # Prepare the labels and values, including placeholders where necessary
        labels_values = [
            ("Evolution ID", details['evolution_id']),
            ("Evolves To", details['evolves_to']),
            ("Candies Needed", ""),
            ("Trade Discount", ""),
            ("Item ID", ""),
            ("Other", "")
        ]

    def update_evolves_from(self):
        selected = self.evolves_from_var.get()
        selected_id = self.parse_id_from_dropdown(selected)
        if selected_id is not None:
            # Update evolves_from in the database
            self.db_manager.update_evolves_from(self.pokemon_id, selected_id)

    def add_evolves_to(self):
        selected_text = self.new_evolves_to_var.get()
        selected_id = self.parse_id_from_dropdown(selected_text)
        if selected_id is not None and selected_id not in [self.parse_id_from_dropdown(evo) for evo in self.evolves_to_listbox.get(0, tk.END)]:
            # Add the new evolution to the database and get its ID
            new_evolution_id = self.db_manager.add_evolves_to(self.pokemon_id, selected_id)
            
            # Add the new evolution to the evolutions listbox
            self.evolutions['evolves_to'].append((new_evolution_id, selected_text))
            self.evolves_to_listbox.insert(tk.END, f"{new_evolution_id}: {selected_text}")
            
            # Automatically select the new evolution in the listbox and load its details
            self.evolves_to_listbox.selection_set(tk.END)

            # Fetch actual details for the new evolution or set up defaults
            actual_details = self.db_manager.fetch_evolution_details_for_evolves_to(self.pokemon_id, new_evolution_id)
            if actual_details:
                # If there are actual details returned from the database, use them
                self.update_evolution_details(new_evolution_id)
            else:
                # If there are no details, use placeholders for evolution_id and evolves_to
                placeholder_details = {'evolution_id': new_evolution_id, 'evolves_to': selected_id}
                self.update_evolution_details_with_placeholders(placeholder_details)

    def remove_selected_evolves_to(self):
        selected_indices = self.evolves_to_listbox.curselection()
        if selected_indices:
            selected_index = selected_indices[0]
            selected_text = self.evolves_to_listbox.get(selected_index)
            selected_id = self.parse_id_from_dropdown(selected_text)

            if selected_id is not None:
                if selected_id in self.pending_evolves_to_additions:
                    self.pending_evolves_to_additions.remove(selected_id)
                else:
                    self.pending_evolves_to_removals.append(selected_id)
                self.evolves_to_listbox.delete(selected_index)

    def save_evolutions(self):
    # Use the self.pokemon_id directly instead of trying to access from evolutions dictionary
        for evolves_to_id in self.pending_evolves_to_additions:
            self.db_manager.add_evolves_to(self.pokemon_id, evolves_to_id)

        for evolves_to_id in self.pending_evolves_to_removals:
            self.db_manager.remove_evolves_to(self.pokemon_id, evolves_to_id)

    def parse_id_from_dropdown(self, dropdown_value):
        try:
            return int(dropdown_value.split(":")[0].strip())
        except (IndexError, ValueError):
            return None