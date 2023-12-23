# pokemon_shadow_image_frames.py
import tkinter as tk
from tkinter import filedialog, messagebox, simpledialog
from PIL import Image, ImageTk
import os
import requests
from io import BytesIO

class BaseShadowImageFrame(tk.Frame):
    def initialize_image_frame(self, parent, image_url, pokemon_id, frame_label_text, image_subfolder):
        super().__init__(parent)
        self.parent = parent
        self.pokemon_id = pokemon_id
        self.frame = tk.Frame(parent)
        self.frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=10, pady=10)

        # Create a container frame within the main frame
        self.container_frame = tk.Frame(self.frame, bg="white", bd=2, relief=tk.RIDGE)
        self.container_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        # Create a label for the container frame
        self.frame_label = tk.Label(self.container_frame, text=f"{frame_label_text} Image Pokemon ID: {pokemon_id}", bg="white")
        self.frame_label.pack(side=tk.TOP, fill=tk.X)

        # Initialize image_label attribute within the container frame
        self.image_label = tk.Label(self.container_frame)
        self.image_label.pack(fill=tk.BOTH, expand=True)

        # Set the relative path to images
        script_directory = os.path.dirname(os.path.realpath(__file__))
        go_directory = os.path.normpath(os.path.join(script_directory, '../../../../'))
        self.relative_path_to_images = os.path.join(go_directory, 'frontend', 'public', 'images', image_subfolder)

        # Check if image_url is None or empty
        if image_url:
            # Set the full image path
            image_url = image_url.lstrip("\\/")  # Ensure the URL is treated as relative
            self.full_image_path = os.path.normpath(os.path.join(self.relative_path_to_images, f"{image_subfolder}_pokemon_{pokemon_id}.png"))

            # Attempt to load and display the image
            self.load_and_display_image()
        else:
            # If image_url is None, skip loading and display a placeholder or nothing
            self.full_image_path = None 

        # Buttons for updating image
        self.btn_select_image = tk.Button(self.container_frame, text="Select Image", command=self.select_image_from_device)
        self.btn_select_image.pack(side=tk.BOTTOM)
        
        self.btn_download_image = tk.Button(self.container_frame, text="Download Image", command=self.download_image_from_url)
        self.btn_download_image.pack(side=tk.BOTTOM)

    def load_and_display_image(self):
        print(f"Loading and displaying image. Path: {self.full_image_path}")
        if not os.path.exists(self.full_image_path):
            print(f"Image file does not exist: {self.full_image_path}")
            self.photo = ImageTk.PhotoImage(Image.new('RGB', (240, 240), color='grey'))
        else:
            try:
                self.image = Image.open(self.full_image_path)
                self.photo = ImageTk.PhotoImage(self.image)
                print(f"Image loaded for display: {self.photo}")
            except Exception as e:
                print(f"Failed to load image: {e}")
                self.photo = ImageTk.PhotoImage(Image.new('RGB', (240, 240), color='grey'))

        try:
            self.image_label.configure(image=self.photo)
            self.image_label.image = self.photo  # This line might be problematic if self.photo is None
        except Exception as e:
            print(f"Failed to update image label: {e}")

    def select_image_from_device(self):
        file_path = filedialog.askopenfilename()
        if file_path:
            try:
                image = Image.open(file_path).resize((240, 240))
                print(f"Image selected: {image}")  # Confirm that the image is loaded
                self.save_and_update_image(image)
            except Exception as e:
                print(f"Exception occurred during image selection from device: {e}")
                messagebox.showerror("Error", f"Failed to open or process the image: {e}")

    def download_image_from_url(self):
        url = simpledialog.askstring("Download Image", "Enter the Image URL:")
        if url:
            try:
                response = requests.get(url)
                response.raise_for_status()
                image = Image.open(BytesIO(response.content)).resize((240, 240))
                self.save_and_update_image(image)
            except requests.exceptions.RequestException as e:
                messagebox.showerror("Error", f"Failed to download the image: {e}")
            except Exception as e:
                print(f"Exception occurred during image download: {e}")
                messagebox.showerror("Error", f"Failed to download the image: {e}")

    def combine_images(self, pokemon_image):
        """
        Combine the downloaded or selected Pokémon image with the shadow effect and shadow icon.
        """
        try:
            # Define paths to shadow effect and shadow icon images
            shadow_effect_path = os.path.normpath(os.path.join(self.relative_path_to_images, '..', 'shadow_effect.png'))
            shadow_icon_path = os.path.normpath(os.path.join(self.relative_path_to_images, '..', 'shadow_icon_middle_ground.png'))

            # Open all the images
            base_image = Image.new("RGBA", (240,240), (0,0,0,0))
            
            shadow_effect = Image.open(shadow_effect_path).convert("RGBA")
            print(f"Shadow effect loaded: {shadow_effect}")

            shadow_icon = Image.open(shadow_icon_path).convert("RGBA")
            print(f"Shadow icon loaded: {shadow_icon}")

            # Resize the shadow_effect
            target_width = 240
            shadow_effect = shadow_effect.resize((target_width, int((target_width/shadow_effect.width)*shadow_effect.height)))

            # Place shadow effect on the base image with a downward offset
            se_width, se_height = shadow_effect.size
            vertical_offset = 20
            se_position = ((base_image.width - se_width) // 2, (base_image.height - se_height) // 2 + vertical_offset)
            base_image.paste(shadow_effect, se_position, shadow_effect)

            # Place Pokemon image on top of the shadow effect
            base_image.paste(pokemon_image, (0, 0), pokemon_image)

            # Place shadow icon at the bottom left on top of the Pokemon image
            si_width, si_height = shadow_icon.size
            si_position = (0, base_image.height - si_height)
            base_image.paste(shadow_icon, si_position, shadow_icon)

            return base_image
        except Exception as e:
            print(f"Failed to combine images: {e}")
            return None

class PokemonShadowImageFrame(BaseShadowImageFrame):
    def __init__(self, parent, image_url_shadow, pokemon_id, details_window):
        super().__init__(parent)
        self.details_window = details_window  # Store the reference to the details window
        self.initialize_image_frame(parent, image_url_shadow, pokemon_id, "Shadow", "shadow")

    def save_and_update_image(self, image):
        print(f"Saving and updating shadow image: {image}")
        combined_image = self.combine_images(image)
        print(f"Combined shadow image: {combined_image}")

        save_path = os.path.join(self.relative_path_to_images, f'shadow_pokemon_{self.pokemon_id}.png')
        save_path = os.path.normpath(save_path)
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        combined_image.save(save_path, "PNG")
        print(f"Shadow image saved at: {save_path}")

        # Load and display the combined image
        self.full_image_path = save_path  # Update full_image_path to the new save_path
        self.load_and_display_image()

        # Show success message on top of the details window
        messagebox.showinfo("Success", f"Image updated successfully at {save_path}", parent=self.details_window.window)

        # Call method on details_window to react to the update
        self.details_window.react_to_image_update()

class PokemonShinyShadowImageFrame(BaseShadowImageFrame):
    def __init__(self, parent, image_url_shiny_shadow, pokemon_id, details_window):
        super().__init__(parent)
        self.details_window = details_window  # Store the reference to the details window
        self.initialize_image_frame(parent, image_url_shiny_shadow, pokemon_id, "Shiny Shadow", "shiny_shadow")
    
    def save_and_update_image(self, image):
        print(f"Class executing save_and_update_image: {self.__class__.__name__}")
        combined_image = self.combine_images(image)

        # Construct the save path with explicit 'shiny_' prefix
        save_path = os.path.join(self.relative_path_to_images, f'shiny_shadow_pokemon_{self.pokemon_id}.png')
        print(f"Expected save path for shiny shadow image: {save_path}")

        save_path = os.path.normpath(save_path)
        os.makedirs(os.path.dirname(save_path), exist_ok=True)
        combined_image.save(save_path, "PNG")
        print(f"Shiny shadow image saved at: {save_path}")

        self.full_image_path = save_path
        self.load_and_display_image()

        # Show success message on top of the details window
        messagebox.showinfo("Success", f"Image updated successfully at {save_path}", parent=self.details_window.window)

        # Call method on details_window to react to the update
        self.details_window.react_to_image_update()

# This ensures both classes use the same shared methods
PokemonShinyShadowImageFrame.initialize_image_frame = PokemonShadowImageFrame.initialize_image_frame
PokemonShinyShadowImageFrame.load_and_display_image = PokemonShadowImageFrame.load_and_display_image
PokemonShinyShadowImageFrame.select_image_from_device = PokemonShadowImageFrame.select_image_from_device
PokemonShinyShadowImageFrame.download_image_from_url = PokemonShadowImageFrame.download_image_from_url