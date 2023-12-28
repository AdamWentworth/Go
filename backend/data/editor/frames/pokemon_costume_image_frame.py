# pokemon_costume_image_frame.py
import tkinter as tk
from tkinter import filedialog, messagebox, ttk, simpledialog
from PIL import Image, ImageTk
import requests
import os
from io import BytesIO

class PokemonCostumeImageFrame(tk.Frame):
    def __init__(self, parent, pokemon_id, details_window):
        super().__init__(parent)
        self.parent = parent
        self.pokemon_id = pokemon_id
        self.details_window = details_window
        self.db_manager = details_window.db_manager
        self.costumes = self.db_manager.fetch_pokemon_costumes(pokemon_id)
        self.images = {}  # To store the loaded images
        self.costume_entries = {}  # To store the entry widgets for costume attributes

        # Set up the base directory for images
        script_directory = os.path.dirname(os.path.realpath(__file__))
        go_directory = os.path.normpath(os.path.join(script_directory, '../../../../'))
        self.relative_path_to_images = os.path.join(go_directory, 'frontend', 'public')

        self.initialize_ui()  # This now can be called safely after the above attributes are set
        self.load_costume_images() 

    def initialize_ui(self):
        # UI setup for costumes
        self.costume_frames = []
        for index, costume in enumerate(self.costumes):
            frame = tk.LabelFrame(self, text=f"Costume ID: {costume[0]}", borderwidth=2, relief=tk.GROOVE)
            frame.pack(side="top", fill="x", padx=5, pady=5)
            
            # Create a form for each costume attribute
            labels = ['Costume Name', 'Shiny Available', 'Date Available', 'Date Shiny Available', 'Image URL', 'Shiny Image URL']
            for i, label in enumerate(labels):
                tk.Label(frame, text=label).grid(row=i, column=0, sticky="e")
                entry = ttk.Entry(frame)
                entry.grid(row=i, column=1, sticky="ew")
                entry.insert(0, str(costume[i+2]) if costume[i+2] is not None else "")
                self.costume_entries[(costume[0], label)] = entry  # Store the entry with its costume_id and label

            # Image display placeholders
            image_label = tk.Label(frame)
            image_label.grid(row=0, column=2, rowspan=6, padx=10, pady=10)

            shiny_image_label = tk.Label(frame)
            shiny_image_label.grid(row=0, column=3, rowspan=6, padx=10, pady=10)
            
            # Store frame, labels, and costume_id for later
            self.costume_frames.append((frame, image_label, shiny_image_label, costume[0]))
            
            # Buttons for regular image update
            update_reg_image_url_button = tk.Button(frame, text="Download Image",
                                                    command=lambda c_id=costume[0]: self.update_costume_image_from_url(c_id, is_shiny=False))
            update_reg_image_url_button.grid(row=6, column=2, sticky="ew")

            upload_reg_image_file_button = tk.Button(frame, text="Select Image",
                                                    command=lambda c_id=costume[0]: self.upload_costume_image(c_id, is_shiny=False))
            upload_reg_image_file_button.grid(row=7, column=2, sticky="ew")

            # Buttons for shiny image update
            update_shiny_image_url_button = tk.Button(frame, text="Download Image",
                                                    command=lambda c_id=costume[0]: self.update_costume_image_from_url(c_id, is_shiny=True))
            update_shiny_image_url_button.grid(row=6, column=3, sticky="ew")

            upload_shiny_image_file_button = tk.Button(frame, text="Select Image",
                                                    command=lambda c_id=costume[0]: self.upload_costume_image(c_id, is_shiny=True))
            upload_shiny_image_file_button.grid(row=7, column=3, sticky="ew")

        # Load and display images after setting up UI
        self.load_costume_images()

    def load_costume_images(self):
        # Load and display images for each costume
        for index, (frame, image_label, shiny_image_label, costume_id) in enumerate(self.costume_frames):
            costume = self.costumes[index]
            regular_image_path = costume[6]  # Regular image path (already relative)
            shiny_image_path = costume[7]  # Shiny image path (already relative)

            # Open regular and shiny costume images if they exist, or display placeholder
            image = self.open_local_image(regular_image_path) if regular_image_path else self.get_placeholder_image()
            shiny_image = self.open_local_image(shiny_image_path) if shiny_image_path else self.get_placeholder_image()

            if image:
                self.images[regular_image_path] = image  # Use the path as the key for regular images

            if shiny_image:
                self.images[shiny_image_path] = shiny_image  # Use the path as the key for shiny images

        self.display_costume_images()

    def open_local_image(self, image_url):
        # Trim leading slash from image_url if present to ensure it's treated as relative
        image_url = image_url.lstrip("\\/")

        # Combine the base path with the specific image URL
        full_image_path = os.path.join(self.relative_path_to_images, image_url)

        # Normalize the path to ensure consistent slashes
        full_image_path = os.path.normpath(full_image_path)

        # Try to open the image from the local filesystem
        try:
            image = Image.open(full_image_path)
            return ImageTk.PhotoImage(image)
        except FileNotFoundError:
            # Instead of showing an error, return None or a placeholder image
            return None  # or return self.get_placeholder_image()
        except Exception as e:
            # Log the error for debugging purposes
            print(f"Failed to open image: {e}")
            return None  # or return self.get_placeholder_image()

    def get_placeholder_image(self):
        # This method returns a placeholder image to be used when the image is missing
        try:
            placeholder = Image.open("path/to/placeholder.png")  # Update this path to your placeholder image
            return ImageTk.PhotoImage(placeholder)
        except IOError:
            # If placeholder is also missing, you can create a blank image or show an error
            return None

    def display_costume_images(self):
        # Update the UI with loaded images
        for frame, image_label, shiny_image_label, costume_id in self.costume_frames:
            costume = next((costume for costume in self.costumes if costume[0] == costume_id), None)
            if costume is not None:
                regular_image_path = costume[6]  # Regular image path
                shiny_image_path = costume[7]  # Shiny image path

                image = self.images.get(regular_image_path)
                shiny_image = self.images.get(shiny_image_path)

                # Set the image if it exists, otherwise leave it empty
                if image:
                    image_label.configure(image=image)
                    image_label.image = image  # Keep a reference!
                else:
                    image_label.image = None  # Clear the image

                if shiny_image:
                    shiny_image_label.configure(image=shiny_image)
                    shiny_image_label.image = shiny_image  # Keep a reference!
                else:
                    shiny_image_label.image = None  # Clear the image

    def upload_costume_image(self, costume_id):
        # Use the existing upload_image method to get the image from the file system
        new_image = self.upload_image()
        if new_image:
            # Here you would update the database with the path of the new image
            # self.db_manager.update_costume_image_file(costume_id, file_path)
            self.images[costume_id] = new_image
            self.display_costume_images()

    def upload_image(self):
        # Upload a new image from the user's device
        file_path = filedialog.askopenfilename()
        if file_path:
            try:
                image = Image.open(file_path)
                return ImageTk.PhotoImage(image)
            except Exception as e:
                messagebox.showerror("Upload Error", f"Failed to open or process the image: {e}")
                return None
    def update_costume(self, costume_id):
        # Gather the updated details from the entries
        updated_details = []
        for label in ['Costume Name', 'Shiny Available', 'Date Available', 'Date Shiny Available', 'Image URL', 'Shiny Image URL']:
            entry = self.costume_entries[(costume_id, label)]
            # Convert 'Shiny Available' entry to integer (1 for True, 0 for False)
            value = entry.get()
            if label == 'Shiny Available':
                value = 1 if value.lower() == 'true' else 0
            updated_details.append(value)

        # Update the costume details in the database
        self.db_manager.update_pokemon_costume(costume_id, tuple(updated_details))

        # Confirm the update to the user
        messagebox.showinfo("Update Successful", f"Costume ID: {costume_id} updated.")

        # Reload the costume details from the database to refresh the UI
        self.costumes = self.db_manager.fetch_pokemon_costumes(self.pokemon_id)
        self.load_costume_images()
        self.display_costume_images()