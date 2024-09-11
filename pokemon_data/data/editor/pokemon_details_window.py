# pokemon_details_window.py
from details_window.ui_setup import create_scrollable_window, bind_scroll_events
import tkinter as tk
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
from frames.pokemon_female_image_frame import PokemonFemaleImageFrame

import os

class PokemonDetailsWindow:
    def __init__(self, parent, pokemon_id, details):
        self.pokemon_id = pokemon_id
        self.db_manager = DatabaseManager('./data/pokego.db')  # Adjust the path as necessary

        self.female_pokemon_data = self.db_manager.fetch_female_pokemon()

        self.shadow_pokemon_data = self.db_manager.fetch_shadow_pokemon_data(pokemon_id)

        self.type_ids = self.db_manager.fetch_type_ids()
        self.existing_move_ids = self.db_manager.fetch_pokemon_moves(pokemon_id)

        # Define the relative path to images
        script_directory = os.path.dirname(os.path.realpath(__file__))
        go_directory = os.path.normpath(os.path.join(script_directory, '../../../frontend/public'))
        self.relative_path_to_images = go_directory

        # Scrollable container setup
        self.window, self.canvas, self.scrollable_frame = create_scrollable_window(parent, f"Details of Pokémon ID: {pokemon_id}")

        # Bind scroll events for smooth scrolling
        bind_scroll_events(self.window, self.canvas)

        # Assuming details is a tuple of (pokemon_data, moves, evolutions)
        self.pokemon_data, self.moves, self.evolutions = details

        # Main container frame for all sections
        main_container = tk.Frame(self.scrollable_frame)
        main_container.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        # Call methods to create frames while keeping the layout the same
        self.create_info_and_moves_frames(main_container)
        self.create_evolutions_and_shadow_frames(main_container)
        self.create_image_frames(main_container)
        self.create_mega_frames(main_container)
        self.create_shadow_costume_frames(main_container)
        self.create_costume_frame(main_container)
        self.create_female_image_frame(main_container)

        # Save Button
        save_button = tk.Button(self.window, text="Save Changes", command=self.save_changes)
        save_button.pack(side="bottom", pady=10)

    def create_info_and_moves_frames(self, parent):
        """ Create top container for General Info and Moves Frames """
        top_container = tk.Frame(parent)
        top_container.pack(side=tk.TOP, fill=tk.BOTH, expand=True)

        # Container for General and Additional Info Frames
        info_container = tk.Frame(top_container)
        info_container.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        self.info_frames = PokemonInfoFrames(info_container, self.pokemon_data, self.db_manager)
        self.info_frames.create_info_frames()

        # Moves Frame
        self.moves_frame = PokemonMovesFrame(top_container, self.db_manager, self.moves)
        self.moves_frame.create_moves_frame()

    def create_evolutions_and_shadow_frames(self, parent):
        """ Create second container for Evolutions and Shadow Frames """
        second_container = tk.Frame(parent)
        second_container.pack(side=tk.TOP, fill=tk.BOTH, expand=True)

        # Evolutions Frame
        self.evolutions_frame = PokemonEvolutionsFrame(second_container, self.db_manager, self.pokemon_id, self.evolutions)
        self.evolutions_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

        # Shadow Frame
        self.shadow_frame = PokemonShadowFrame(second_container, self.pokemon_id, self.shadow_pokemon_data, self.db_manager)
        self.shadow_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

    def create_image_frames(self, parent):
        """ Create container for Image Frames """
        image_frames_container = tk.Frame(parent)
        image_frames_container.pack(side=tk.TOP, fill=tk.BOTH, expand=True)

        # Image Frame
        image_url = self.pokemon_data[3]  # Assuming the image URL is at this index
        self.image_frame = PokemonImageFrame(image_frames_container, image_url, self.pokemon_id, self)
        self.image_frame.frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)  # Correctly pack the frame attribute

        # Shiny Image Frame
        shiny_image_url = self.pokemon_data[4]  # Assuming the shiny image URL is at this index (update as necessary)
        self.shiny_image_frame = PokemonShinyImageFrame(image_frames_container, shiny_image_url, self.pokemon_id, self)
        self.shiny_image_frame.frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)  # Correctly pack the frame attribute

        shadow_image_url = self.shadow_pokemon_data[4] if len(self.shadow_pokemon_data) > 4 else None
        shiny_shadow_image_url = self.shadow_pokemon_data[5] if len(self.shadow_pokemon_data) > 5 else None

        # Shadow Image Frame
        self.shadow_image_frame = PokemonShadowImageFrame(image_frames_container, shadow_image_url, self.pokemon_id, self)
        self.shadow_image_frame.frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)  # Correctly pack the frame attribute

        # Shiny Shadow Image Frame
        self.shiny_shadow_image_frame = PokemonShinyShadowImageFrame(image_frames_container, shiny_shadow_image_url, self.pokemon_id, self)
        self.shiny_shadow_image_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)  # Correctly pack the frame attribute

    def create_mega_frames(self, parent):
        """ Create container for Mega Evolution Frames """
        mega_container = tk.Frame(parent)
        mega_container.pack(side=tk.TOP, fill=tk.BOTH, expand=True)

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

    def create_shadow_costume_frames(self, parent):
        """ Create container for Shadow Costume Frames """
        shadow_costume_container = tk.Frame(parent)
        shadow_costume_container.pack(side=tk.TOP, fill=tk.BOTH, expand=True)

        self.shadow_costume_frame = PokemonShadowCostumeFrame(shadow_costume_container, self.db_manager, self.pokemon_id)
        self.shadow_costume_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)

    def create_costume_frame(self, parent):
        """ Create Costume Frame """
        self.costume_frame = PokemonCostumeImageFrame(parent, self.pokemon_id, self)
        self.costume_frame.pack(side=tk.TOP, fill=tk.BOTH, expand=True)
        
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
            (0, 0, 0, 0, '', '', '', 'None', '', None, None),  # Default values
            self
        )
        new_mega_frame.frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        self.mega_frames.append(new_mega_frame)

    def create_female_image_frame(self, parent):
        """ Create frame for Female Pokémon Images if the Pokémon has a unique female version """
        
        # Extract all Pokémon IDs with unique female forms and ensure they are integers
        female_pokemon_ids = [int(row[0]) for row in self.female_pokemon_data]  # Ensure IDs are integers
        print(f"[DEBUG] Current Pokémon ID: {self.pokemon_id} (Type: {type(self.pokemon_id)})")

        # Ensure self.pokemon_id is also an integer
        if isinstance(self.pokemon_id, str):
            self.pokemon_id = int(self.pokemon_id)
        
        # Check if pokemon_id is in the list of female IDs
        if self.pokemon_id in female_pokemon_ids:
            print(f"[DEBUG] Pokémon ID {self.pokemon_id} has a unique female form")

            # Get the image data for the female version
            female_data = next((row for row in self.female_pokemon_data if int(row[0]) == self.pokemon_id), None)
            print(f"[DEBUG] Female data for Pokémon ID {self.pokemon_id}: {female_data}")

            # Ensure default placeholders if URLs are missing
            female_image_url = female_data[1] if female_data and female_data[1] else "placeholder.png"
            shiny_female_image_url = female_data[2] if female_data and female_data[2] else "placeholder.png"
            shadow_female_image_url = female_data[3] if female_data and female_data[3] else "placeholder.png"
            shiny_shadow_female_image_url = female_data[4] if female_data and female_data[4] else "placeholder.png"

            # Debug: Print out what is being passed
            print(f"[DEBUG] Creating female image frame with: female_image_url={female_image_url}, shiny_female_image_url={shiny_female_image_url}, shadow_female_image_url={shadow_female_image_url}, shiny_shadow_female_image_url={shiny_shadow_female_image_url}")

            # Create the frame for Female Pokémon Images
            self.female_image_frame = PokemonFemaleImageFrame(
                parent, female_image_url, shiny_female_image_url, 
                shadow_female_image_url, shiny_shadow_female_image_url, 
                self.pokemon_id, self
            )
            # Pack the frame and expand it fully
            self.female_image_frame.frame.pack(side=tk.TOP, fill=tk.BOTH, expand=True)
        else:
            print(f"[DEBUG] Pokémon ID {self.pokemon_id} does not have a unique female form")

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
