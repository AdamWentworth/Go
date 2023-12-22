import tkinter as tk
from PIL import Image, ImageTk
import os

class PokemonImageFrame:
    def __init__(self, parent, image_url):
        self.frame = tk.Frame(parent)
        self.frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=10, pady=10)

        # Get the directory of the currently executing script/file
        script_directory = os.path.dirname(os.path.realpath(__file__))

        # Correctly navigate up four directories from the script location to reach the Go folder
        go_directory = os.path.normpath(os.path.join(script_directory, '../../../../'))

        # Construct the path to the images directory
        self.relative_path_to_images = os.path.join(go_directory, 'frontend', 'public')

        # Trim leading slash from image_url if present to ensure it's treated as relative
        image_url = image_url.lstrip("\\/")

        # Combine the base path with the specific image URL
        full_image_path = os.path.join(self.relative_path_to_images, image_url)

        # Normalize the path to ensure consistent slashes
        full_image_path = os.path.normpath(full_image_path)

        # Print the paths for debugging
        print("Script Directory:", script_directory)
        print("Go Directory:", go_directory)
        print("Relative Path to Images:", self.relative_path_to_images)
        print("Full Image Path:", full_image_path)

        # Load and display the image
        try:
            self.image = Image.open(full_image_path)
            self.photo = ImageTk.PhotoImage(self.image)
            self.image_label = tk.Label(self.frame, image=self.photo)
            self.image_label.pack(fill=tk.BOTH, expand=True)
        except FileNotFoundError:
            print(f"Image file does not exist: {full_image_path}")
            # Here you could add a default image or a placeholder

    def update_image(self, new_image_url):
        # Ensure image_url is treated as relative
        new_image_url = new_image_url.lstrip("\\/")

        # Update the image displayed
        image_path = os.path.join(self.relative_path_to_images, new_image_url)
        image_path = os.path.normpath(image_path)  # Normalize the path
        try:
            self.image = Image.open(image_path)
            self.photo = ImageTk.PhotoImage(self.image)
            self.image_label.configure(image=self.photo)
            self.image_label.image = self.photo  # keep a reference!
        except FileNotFoundError:
            print(f"New image file does not exist: {image_path}")
            # Handle the error, maybe update with a default image or log the error
