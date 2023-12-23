# pokemon_shiny_image_frame.py
import tkinter as tk
from tkinter import filedialog, messagebox, simpledialog
from PIL import Image, ImageTk
import os
import requests
from io import BytesIO

class PokemonShinyImageFrame:
    def __init__(self, parent, image_url_shiny, pokemon_id):
        self.parent = parent
        self.pokemon_id = pokemon_id
        self.frame = tk.Frame(parent)
        self.frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=10, pady=10)

        # Create a container frame within the main frame
        self.container_frame = tk.Frame(self.frame, bg="white", bd=2, relief=tk.RIDGE)
        self.container_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        # Create a label for the container frame
        self.frame_label = tk.Label(self.container_frame, text=f"Shiny Image Pokémon ID: {pokemon_id}", bg="white")
        self.frame_label.pack(side=tk.TOP, fill=tk.X)

        # Initialize image_label attribute within the container frame
        self.image_label = tk.Label(self.container_frame)
        self.image_label.pack(fill=tk.BOTH, expand=True)

        # Get the directory of the currently executing script/file
        script_directory = os.path.dirname(os.path.realpath(__file__))
        
        # Correctly navigate up four directories from the script location to reach the Go folder
        go_directory = os.path.normpath(os.path.join(script_directory, '../../../../'))

        # Construct the path to the images directory
        self.relative_path_to_images = os.path.join(go_directory, 'frontend', 'public')

        # Trim leading slash from image_url_shiny if present to ensure it's treated as relative
        image_url_shiny = image_url_shiny.lstrip("\\/")

        # Combine the base path with the specific shiny image URL
        self.full_image_path = os.path.join(self.relative_path_to_images, image_url_shiny)

        # Normalize the path to ensure consistent slashes
        self.full_image_path = os.path.normpath(self.full_image_path)

        # Determine paths relative to the script
        self.shiny_icon_path = os.path.normpath(os.path.join(self.relative_path_to_images, 'images', 'shiny_icon.png'))

        # Attempt to load and display the shiny image
        try:
            self.image = Image.open(self.full_image_path)
            self.photo = ImageTk.PhotoImage(self.image)
            self.image_label.configure(image=self.photo)
        except FileNotFoundError:
            print(f"Shiny image file does not exist: {self.full_image_path}")
            # Optionally set a default image if the file is not found
            self.photo = ImageTk.PhotoImage(Image.new('RGB', (240, 240), color='grey'))
            self.image_label.configure(image=self.photo)
            # Don't forget to set this, so the reference is not garbage collected
            self.image_label.image = self.photo

        # Update the pack methods for buttons to pack in the container frame
        self.btn_select_image = tk.Button(self.container_frame, text="Select Image", command=self.select_image_from_device)
        self.btn_select_image.pack(side=tk.BOTTOM)
        
        self.btn_download_image = tk.Button(self.container_frame, text="Download Image", command=self.download_image_from_url)
        self.btn_download_image.pack(side=tk.BOTTOM)

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

    def select_image_from_device(self):
        # Open file dialog to select an image
        file_path = filedialog.askopenfilename()
        if file_path:  # proceed if a file was selected
            try:
                # Open and resize the image
                image = Image.open(file_path).resize((240, 240))
                self.save_and_update_image(image)
            except Exception as e:
                messagebox.showerror("Error", f"Failed to open or process the image: {e}")

    def download_image_from_url(self):
    # Prompt for the URL
        url = simpledialog.askstring("Download Image", "Enter the Image URL:")
        if url:
            try:
                # Download and resize the image
                response = requests.get(url)
                response.raise_for_status()  # This will raise an HTTPError if the HTTP request returned an unsuccessful status code
                image = Image.open(BytesIO(response.content)).resize((240, 240))
                self.save_and_update_image(image)
            except requests.exceptions.RequestException as e:  # This is the correct exception to catch for requests errors
                messagebox.showerror("Error", f"Failed to download the image: {e}")
            except Exception as e:
                messagebox.showerror("Error", f"Failed to process the image: {e}")

    def save_and_update_image(self, image):
        # Combine image with the shiny icon before saving
        combined_image = self.combine_images(image)
        # Check if the image_url already contains the 'images' directory
        if 'images' not in self.full_image_path:
            # If 'images' is not in the path, it's a new image, so add the directory
            save_path = os.path.join(self.relative_path_to_images, 'images', f'default/pokemon_{self.pokemon_id}.png')
        else:
            # If 'images' is in the path, we're replacing an existing image
            save_path = self.full_image_path

        # Normalize the path to ensure consistent slashes
        save_path = os.path.normpath(save_path)

        # Make sure the directory exists, create if it doesn't
        os.makedirs(os.path.dirname(save_path), exist_ok=True)

        # Save the combined image instead of the original image
        combined_image.save(save_path, "PNG")

        # Update the displayed image
        self.photo = ImageTk.PhotoImage(Image.open(save_path))
        self.image_label.configure(image=self.photo)
        self.image_label.image = self.photo

        messagebox.showinfo("Success", f"Image updated successfully at {save_path}")

    def combine_images(self, pokemon_image):
        """
        Combine the downloaded or selected Pokémon image with the shiny icon.
        """
        shiny_icon = Image.open(self.shiny_icon_path).convert("RGBA")
        base_image = pokemon_image.copy()
        base_image.paste(shiny_icon, (0, 0), shiny_icon)
        return base_image