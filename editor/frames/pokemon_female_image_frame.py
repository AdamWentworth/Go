# pokemon_female_image_frame.py
import tkinter as tk
from tkinter import filedialog, messagebox, simpledialog
from PIL import Image, ImageTk
import os
import requests
from io import BytesIO

class PokemonFemaleImageFrame:
    def __init__(self, parent, female_image_url, shiny_female_image_url, shadow_female_image_url, shiny_shadow_female_image_url, pokemon_id, controller):
        self.parent = parent
        self.female_image_url = female_image_url
        self.shiny_female_image_url = shiny_female_image_url
        self.shadow_female_image_url = shadow_female_image_url
        self.shiny_shadow_female_image_url = shiny_shadow_female_image_url
        self.pokemon_id = pokemon_id
        self.controller = controller

        self.frame = tk.Frame(parent)

        # Path to the shiny, shadow icon, and shadow background images
        self.shiny_icon_path = os.path.normpath(os.path.join(self.controller.relative_path_to_images, 'images', 'shiny_icon.png'))
        self.shadow_icon_path = os.path.normpath(os.path.join(self.controller.relative_path_to_images, 'images', 'shadow_icon_middle_ground.png'))
        self.shadow_background_path = os.path.normpath(os.path.join(self.controller.relative_path_to_images, 'images', 'shadow_effect.png'))

        # Image labels placeholders
        self.image_labels = {}

        # Create all image frames
        self.create_female_image_frame()

    def create_female_image_frame(self):
        """ Create a fixed frame to display female, shiny female, shadow female, and shiny shadow female images """
        self.create_image_label(self.female_image_url, "Female Form", "female")
        self.create_image_label(self.shiny_female_image_url, "Shiny Female Form", "shiny_female")
        self.create_image_label(self.shadow_female_image_url, "Shadow Female Form", "shadow_female")
        self.create_image_label(self.shiny_shadow_female_image_url, "Shiny Shadow Female Form", "shiny_shadow_female")

    def create_image_label(self, image_url, label_text, image_type):
        """ Helper method to create or update an image label with a description and download button """
        if image_type not in self.image_labels:
            # Create a new image label and download button only if not created
            image_label_frame = tk.Frame(self.frame)

            image_label = tk.Label(image_label_frame)
            image_label.pack(side=tk.TOP)

            description_label = tk.Label(image_label_frame, text=label_text)
            description_label.pack(side=tk.BOTTOM)

            download_button = tk.Button(image_label_frame, text="Download Image", command=lambda: self.download_image(image_type))
            download_button.pack(side=tk.BOTTOM)

            image_label_frame.pack(side=tk.LEFT, padx=10, pady=10)

            # Store references to the image label and frame for updates
            self.image_labels[image_type] = image_label

        # Update the image on the existing image label
        self.update_image_label(image_url, image_type)

    def update_image_label(self, image_url, image_type):
        """ Update an existing image label with a new image """
        image_label = self.image_labels.get(image_type)
        if image_label:
            try:
                image_path = os.path.join(self.controller.relative_path_to_images, image_url.lstrip('/'))  # Combine root and relative path
                image = Image.open(image_path)
                image = image.resize((150, 150), Image.ANTIALIAS)
                photo = ImageTk.PhotoImage(image)

                # Update the existing image label with the new photo
                image_label.config(image=photo)
                image_label.image = photo  # Keep a reference to avoid garbage collection
            except Exception as e:
                print(f"Error loading image for {image_type}: {e}")
                image_label.config(text="Image Not Available")
                image_label.image = None

    def download_image(self, image_type):
        """ Download an image from a URL input by the user """
        # Prompt for the URL
        url = simpledialog.askstring("Download Image", f"Enter the Image URL for {image_type}:")

        if url:
            try:
                # Download and resize the image
                response = requests.get(url)
                response.raise_for_status()  # Raise an HTTPError if the request fails
                image = Image.open(BytesIO(response.content)).resize((240, 240))
                self.save_image(image, image_type)
            except requests.exceptions.RequestException as e:
                messagebox.showerror("Error", f"Failed to download the image: {e}", parent=self.controller.window)
            except Exception as e:
                messagebox.showerror("Error", f"Failed to process the image: {e}", parent=self.controller.window)

    def save_image(self, image, image_type):
        """ Save the image to the appropriate folder and update the database """
        folder_map = {
            "female": "female/default",
            "shiny_female": "female/shiny",
            "shadow_female": "female/shadow",
            "shiny_shadow_female": "female/shiny_shadow"
        }

        save_folder = os.path.join(self.controller.relative_path_to_images, 'images', folder_map[image_type])
        os.makedirs(save_folder, exist_ok=True)

        # Define the file name and path
        file_name = f"{image_type}_pokemon_{self.pokemon_id}.png"
        save_path = os.path.join(save_folder, file_name)

        try:
            # Normalize the path to ensure platform consistency
            save_path = os.path.normpath(save_path)

            # Combine images if necessary
            if "shiny_shadow" in image_type:
                image = self.combine_images(image, is_shiny=True, is_shadow=True)
            elif "shiny" in image_type:
                image = self.combine_images(image, is_shiny=True)
            elif "shadow" in image_type:
                image = self.combine_images(image, is_shadow=True)

            # Save the image to the disk
            image.save(save_path)

            # Normalize the relative path for database storage (URLs should use forward slashes)
            relative_path = f"/images/{folder_map[image_type]}/{file_name}".replace("\\", "/")
            self.update_female_pokemon_image_url(image_type, relative_path)

            # Update the UI to reflect the new image
            self.update_image_label(relative_path, image_type)

            # Show success message without affecting the window stack
            messagebox.showinfo("Success", f"{image_type.replace('_', ' ').title()} image saved successfully!", parent=self.controller.window)

        except Exception as e:
            messagebox.showerror("Error", f"Failed to save the image: {e}", parent=self.controller.window)

    def show_error_message(self, message):
        """ Display error messages without flickering or changing window focus """
        messagebox.showerror("Error", message)  # No need to force focus changes here

    def combine_images(self, pokemon_image, is_shiny=False, is_shadow=False):
        """ Combine the Pokémon image with the shiny, shadow icons, and shadow background """
        try:
            # Create a base image with an alpha channel
            base_image = Image.new("RGBA", (240, 240), (0, 0, 0, 0))

            # Add shadow background if it's a shadow or shiny shadow image
            if is_shadow:
                shadow_background = Image.open(self.shadow_background_path).convert("RGBA")
                shadow_background = shadow_background.resize((240, 240))  # Resize shadow background to fit the base image
                # Paste shadow background behind the Pokémon image
                base_image.paste(shadow_background, (0, 0), shadow_background)

            # Now place the Pokémon image on top of the shadow background
            pokemon_image = pokemon_image.convert("RGBA")  # Ensure Pokémon image has an alpha channel
            base_image.paste(pokemon_image, (0, 0), pokemon_image)  # Paste Pokémon image

            # Add shadow icon if it's a shadow or shiny shadow image
            if is_shadow:
                shadow_icon = Image.open(self.shadow_icon_path).convert("RGBA")
                shadow_icon = shadow_icon.resize((60, 60))  # Resize shadow icon
                base_image.paste(shadow_icon, (0, base_image.height - 60), shadow_icon)  # Paste shadow icon at bottom left

            # Add shiny icon if it's a shiny or shiny shadow image
            if is_shiny:
                shiny_icon = Image.open(self.shiny_icon_path).convert("RGBA")
                shiny_icon = shiny_icon.resize((60, 60))  # Resize shiny icon
                base_image.paste(shiny_icon, (0, 0), shiny_icon)  # Paste shiny icon at top left

            return base_image  # Return the combined image
        except Exception as e:
            print(f"Error combining images: {e}")
            return pokemon_image  # Return the original image in case of failure
        
    def update_female_pokemon_image_url(self, image_type, relative_image_path):
        """ Update the correct image URL field in the database based on the image type """
        try:
            # Fetch the existing image data from the database for this Pokémon ID
            existing_data = self.controller.db_manager.fetch_female_pokemon_image_data(self.pokemon_id)

            # Only update the relevant field and keep others unchanged
            image_data = {
                'image_url': existing_data['image_url'],
                'shiny_image_url': existing_data['shiny_image_url'],
                'shadow_image_url': existing_data['shadow_image_url'],
                'shiny_shadow_image_url': existing_data['shiny_shadow_image_url']
            }

            if image_type == "female":
                image_data['image_url'] = relative_image_path
            elif image_type == "shiny_female":
                image_data['shiny_image_url'] = relative_image_path
            elif image_type == "shadow_female":
                image_data['shadow_image_url'] = relative_image_path
            elif image_type == "shiny_shadow_female":
                image_data['shiny_shadow_image_url'] = relative_image_path

            # Now update the database with the new values
            self.controller.db_manager.update_female_pokemon_images(self.pokemon_id, image_data)

        except Exception as e:
            messagebox.showerror("Error", f"Failed to update the database: {e}")