import tkinter as tk
from tkinter import filedialog, messagebox, ttk
from PIL import Image, ImageTk
import requests
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
        self.initialize_ui()

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

            # Image display placeholder
            image_label = tk.Label(frame)
            image_label.grid(row=0, column=2, rowspan=len(labels), padx=10, pady=10)
            self.costume_frames.append((frame, image_label, costume[0]))  # Store frame, label, and costume_id for later

            # Add update button for each costume
            update_button = tk.Button(frame, text="Update Costume", command=lambda c_id=costume[0]: self.update_costume(c_id))
            update_button.grid(row=len(labels), column=0, columnspan=3)

        # Load and display images after setting up UI
        self.load_costume_images()

    def load_costume_images(self):
        
        # Load and display images for each costume
        for index, (frame, image_label, costume_id) in enumerate(self.costume_frames):
            costume = self.costumes[index]
            image_url = costume[6]  # Assuming index 6 is image_url_costume

            image = self.download_image(image_url) if image_url else None
            if image:
                self.images[costume_id] = image  # Store the image with its costume_id

        self.display_costume_images()

    def display_costume_images(self):
        # Update the UI with loaded images
        for frame, image_label, costume_id in self.costume_frames:
            image = self.images.get(costume_id)
            if image:
                image_label.configure(image=image)
                image_label.image = image  # Keep a reference!

    def update_costume_image(self, costume_id, new_image):

        # Update the specified costume image
        # This will be a placeholder, you'll need to add the actual database update logic

        # Reload and redisplay the image
        self.load_costume_images()
        self.display_costume_images()

    def download_image(self, url):
        # Download the image from the URL
        try:
            response = requests.get(url)
            response.raise_for_status()
            image = Image.open(BytesIO(response.content))
            return ImageTk.PhotoImage(image)
        except requests.RequestException as e:
            messagebox.showerror("Download Error", f"Failed to download image: {e}")
            return None

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