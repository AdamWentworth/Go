# pokemon_details_window.py

import tkinter as tk
from tkinter import ttk, messagebox, simpledialog
from database_manager import DatabaseManager

# Import necessary frames
from frames.pokemon_info_frames import PokemonInfoFrames
from frames.pokemon_moves_frame import PokemonMovesFrame
from frames.pokemon_evolutions_frame import PokemonEvolutionsFrame
from frames.pokemon_shadow_frame import PokemonShadowFrame
from frames.pokemon_image_frame import PokemonImageFrame
from frames.pokemon_shiny_image_frame import PokemonShinyImageFrame
from frames.pokemon_shadow_image_frames import PokemonShadowImageFrame, PokemonShinyShadowImageFrame
from frames.pokemon_costume_image_frame import PokemonCostumeImageFrame
from frames.pokemon_shadow_costume_frame import PokemonShadowCostumeFrame
from frames.pokemon_mega_frame import PokemonMegaFrame

import os

class PokemonDetailsWindow:
    def __init__(self, parent, pokemon_id, details):
        self.window = tk.Toplevel(parent)
        self.window.title(f"Details of Pokémon ID: {pokemon_id}")
        self.window.state('zoomed')

        self.pokemon_id = pokemon_id
        self.db_manager = DatabaseManager('./data/pokego.db')  # Adjust the path as necessary

        self.shadow_pokemon_data = self.db_manager.fetch_shadow_pokemon_data(pokemon_id)

        self.type_ids = self.db_manager.fetch_type_ids()
        self.existing_move_ids = self.db_manager.fetch_pokemon_moves(pokemon_id)

        # Define the relative path to images
        script_directory = os.path.dirname(os.path.realpath(__file__))
        go_directory = os.path.normpath(os.path.join(script_directory, '../../../frontend/public'))
        self.relative_path_to_images = go_directory

        # Scrollable container setup
        self.canvas = tk.Canvas(self.window)
        self.scrollable_frame = ttk.Frame(self.canvas)

        self.scrollbar = ttk.Scrollbar(self.window, orient="vertical", command=self.canvas.yview)
        self.canvas.configure(yscrollcommand=self.scrollbar.set)
        self.scrollbar.pack(side="right", fill="y")
        self.canvas.pack(side="left", fill="both", expand=True)
        self.canvas.create_window((0, 0), window=self.scrollable_frame, anchor="nw")

        self.scrollable_frame.bind("<Configure>", lambda e: self.canvas.configure(scrollregion=self.canvas.bbox("all")))

        # Horizontal scrollbar
        h_scrollbar = ttk.Scrollbar(self.window, orient="horizontal", command=self.canvas.xview)
        self.canvas.configure(xscrollcommand=h_scrollbar.set)
        h_scrollbar.pack(side="bottom", fill="x")

        # Bind scroll events for smooth scrolling
        self.window.bind("<MouseWheel>", self._on_mousewheel)
        self.window.bind("<Shift-MouseWheel>", self._on_shift_mousewheel)

        # Assuming details is a tuple of (pokemon_data, moves, evolutions)
        self.pokemon_data, self.moves, self.evolutions = details

        # Main container frame for all sections
        main_container = tk.Frame(self.scrollable_frame)
        main_container.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # Top container for General Info and Moves Frames
        top_container = tk.Frame(main_container)
        top_container.pack(side=tk.TOP, fill=tk.BOTH, expand=True)

        # Container for General and Additional Info Frames
        info_container = tk.Frame(top_container)
        info_container.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        self.info_frames = PokemonInfoFrames(info_container, self.pokemon_data, self.db_manager)
        self.info_frames.create_info_frames()

        # Moves Frame
        self.moves_frame = PokemonMovesFrame(top_container, self.db_manager, self.moves)
        self.moves_frame.create_moves_frame()

        # Second container for Evolutions and Shadow Frames
        second_container = tk.Frame(main_container)
        second_container.pack(side=tk.TOP, fill=tk.BOTH, expand=True)

        # Evolutions Frame
        self.evolutions_frame = PokemonEvolutionsFrame(second_container, self.db_manager, self.pokemon_id, self.evolutions)
        self.evolutions_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        # Shadow Frame
        self.shadow_frame = PokemonShadowFrame(second_container, self.pokemon_id, self.shadow_pokemon_data, self.db_manager)
        self.shadow_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        # Image Frames Container
        image_frames_container = tk.Frame(main_container)
        image_frames_container.pack(side=tk.TOP, fill=tk.BOTH, expand=True)

        # Image Frame
        image_url = self.pokemon_data[3]  # Assuming the image URL is at this index
        self.image_frame = PokemonImageFrame(image_frames_container, image_url, pokemon_id, self)
        self.image_frame.frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)  # Correctly pack the frame attribute

        # Shiny Image Frame
        shiny_image_url = self.pokemon_data[4]  # Assuming the shiny image URL is at this index (update as necessary)
        self.shiny_image_frame = PokemonShinyImageFrame(image_frames_container, shiny_image_url, pokemon_id, self)
        self.shiny_image_frame.frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)  # Correctly pack the frame attribute

        shadow_image_url = self.shadow_pokemon_data[4] if len(self.shadow_pokemon_data) > 4 else None
        shiny_shadow_image_url = self.shadow_pokemon_data[5] if len(self.shadow_pokemon_data) > 5 else None

        # Shadow Image Frame
        self.shadow_image_frame = PokemonShadowImageFrame(image_frames_container, shadow_image_url, pokemon_id, self)
        self.shadow_image_frame.frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)  # Correctly pack the frame attribute

        # Shiny Shadow Image Frame
        self.shiny_shadow_image_frame = PokemonShinyShadowImageFrame(image_frames_container, shiny_shadow_image_url, pokemon_id, self)
        self.shiny_shadow_image_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)  # Correctly pack the frame attribute

        # Create a container for Mega Evolution Frames
        mega_container = tk.Frame(main_container)
        mega_container.pack(side=tk.TOP, fill=tk.BOTH, expand=True)

        # Fetch and integrate Mega Evolution Frames
        mega_evolutions = self.db_manager.fetch_mega_pokemon_data(self.pokemon_id)
        self.mega_frames = []
        for mega_data in mega_evolutions:
            mega_evolution_id = mega_data[0]
            mega_frame = PokemonMegaFrame(mega_container, mega_evolution_id, self.pokemon_id, mega_data[1:], self)
            mega_frame.frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
            self.mega_frames.append(mega_frame)

        # Add button to add a new Mega Evolution
        self.btn_add_mega = tk.Button(mega_container, text="Add Mega Evolution", command=self.add_mega_evolution)
        self.btn_add_mega.pack(side=tk.BOTTOM, pady=10)

        # Create a container for Shadow Costume Frames
        shadow_costume_container = tk.Frame(main_container)
        shadow_costume_container.pack(side=tk.TOP, fill=tk.BOTH, expand=True)

        # Integrate the new Shadow Costume Frame
        self.shadow_costume_frame = PokemonShadowCostumeFrame(shadow_costume_container, self.db_manager, self.pokemon_id)
        self.shadow_costume_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        # Costume Frame - this is the frame in question, pack the object directly
        self.costume_frame = PokemonCostumeImageFrame(main_container, pokemon_id, self)
        self.costume_frame.pack(side=tk.TOP, fill=tk.BOTH, expand=True)  # pack the object directly

        # Save Button
        save_button = tk.Button(self.window, text="Save Changes", command=self.save_changes)
        save_button.pack(side="bottom", pady=10)

    def _on_mousewheel(self, event):
        self.canvas.yview_scroll(int(-1*(event.delta/120)), "units")

    def _on_shift_mousewheel(self, event):
        self.canvas.xview_scroll(int(-1*(event.delta/120)), "units")

    def react_to_image_update(self):
        # Bring the window to the front
        self.window.lift()
        # Optional: You can flash the window or change the title to indicate the update
        self.window.title("Details Updated - Pokémon ID: {}".format(self.pokemon_id))

    def add_mega_evolution(self):
        # Insert a new mega evolution into the database and fetch its ID
        new_mega_id = self.db_manager.add_mega_evolution(self.pokemon_id)
        
        # Create a new PokemonMegaFrame with default values
        new_mega_frame = PokemonMegaFrame(
            self.scrollable_frame,
            new_mega_id,
            self.pokemon_id,
            (0, 0, 0, 0, '', '', '', 'None', ''),  # Default values
            self
        )
        new_mega_frame.frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        self.mega_frames.append(new_mega_frame)

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

        # Add save logic for the shadow frame in the save_changes method
        shadow_data = self.shadow_frame.save_shadow_info()
        if shadow_data:
            self.db_manager.update_shadow_pokemon_data(self.pokemon_id, shadow_data)

        # Save shadow data
        self.shadow_frame.save_shadow_info()

        # Save mega evolution data
        mega_data_list = [mega_frame.get_mega_data() for mega_frame in self.mega_frames]
        self.db_manager.update_mega_evolution_data(mega_data_list)

        # Show a confirmation message
        tk.messagebox.showinfo("Update", "Pokemon data updated successfully")

        # Close the window after saving
        self.window.destroy()
