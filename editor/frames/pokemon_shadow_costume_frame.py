# pokemon_shadow_costume_frame.py

import tkinter as tk
from tkinter import ttk, filedialog, simpledialog, messagebox
from PIL import Image, ImageTk
import os
import requests
from io import BytesIO

class PokemonShadowCostumeFrame(tk.Frame):
    def __init__(self, parent, db_manager, pokemon_id):
        super().__init__(parent)
        self.db_manager = db_manager
        self.pokemon_id = pokemon_id
        self.create_widgets()
        self.load_existing_data()

    def create_widgets(self):
        tk.Label(self, text="Shadow Costume Pokémon Details", font=("Arial", 16)).pack(pady=(10, 5))
        
        self.shadow_dropdown = ttk.Combobox(self, width=50)
        self.shadow_dropdown.pack(pady=5)

        self.costume_dropdown = ttk.Combobox(self, width=50)
        self.costume_dropdown.pack(pady=5)

        tk.Label(self, text="Date Available:").pack()
        self.date_available_entry = ttk.Entry(self, width=50)
        self.date_available_entry.pack(pady=5)

        tk.Label(self, text="Date Shiny Available:").pack()
        self.date_shiny_available_entry = ttk.Entry(self, width=50)
        self.date_shiny_available_entry.pack(pady=5)

        tk.Label(self, text="Image URL (Shadow Costume):").pack()
        self.image_url_shadow_costume_entry = ttk.Entry(self, width=50)
        self.image_url_shadow_costume_entry.pack(pady=5)
        self.image_url_shadow_costume_entry.bind("<FocusOut>", lambda e: self.view_image(self.image_url_shadow_costume_entry.get(), 'shadow'))

        tk.Label(self, text="Image URL (Shiny Shadow Costume):").pack()
        self.image_url_shiny_shadow_costume_entry = ttk.Entry(self, width=50)
        self.image_url_shiny_shadow_costume_entry.pack(pady=5)
        self.image_url_shiny_shadow_costume_entry.bind("<FocusOut>", lambda e: self.view_image(self.image_url_shiny_shadow_costume_entry.get(), 'shiny'))

        self.image_label = tk.Label(self)
        self.image_label.pack(pady=20, fill=tk.BOTH, expand=True)

        self.btn_select_image = tk.Button(self, text="Select Image", command=self.select_image)
        self.btn_select_image.pack(side=tk.BOTTOM)

        self.btn_download_image = tk.Button(self, text="Download Image", command=self.download_image)
        self.btn_download_image.pack(side=tk.BOTTOM)

        self.save_button = tk.Button(self, text="Save Shadow Costume", command=self.save_shadow_costume)
        self.save_button.pack(pady=10)

        self.refresh_data()  # Update dropdown lists on initialization

    def get_images_directory(self):
        script_directory = os.path.dirname(os.path.realpath(__file__))
        return os.path.join(script_directory, '../../frontend/public')

    def view_image(self, image_url, image_type):
        if image_url:
            image_path = os.path.join(self.get_images_directory(), image_url.strip("/"))
            self.display_image(image_path)

    def display_image(self, path):
        try:
            image = Image.open(path)
            photo = ImageTk.PhotoImage(image)
            self.image_label.configure(image=photo)
            self.image_label.image = photo  # Prevent garbage-collection
        except FileNotFoundError:
            self.display_default_image()

    def display_default_image(self):
        default_image = Image.new('RGB', (200, 200), color='grey')
        photo = ImageTk.PhotoImage(default_image)
        self.image_label.configure(image=photo)
        self.image_label.image = photo  # Prevent garbage-collection

    def select_image(self):
        file_path = filedialog.askopenfilename(filetypes=[("Image Files", "*.png;*.jpg;*.jpeg;*.bmp")])
        if file_path:
            image = Image.open(file_path)
            combined_image = self.combine_images(image)
            if combined_image:
                photo = ImageTk.PhotoImage(combined_image)
                self.image_label.configure(image=photo)
                self.image_label.image = photo  # Update display immediately
                
                # Construct the full save path by appending the existing image_url to the base directory
                existing_path = self.image_url_shadow_costume_entry.get().strip("/")
                full_save_path = os.path.join(self.get_images_directory(), existing_path)
                combined_image.save(full_save_path)  # Save combined image to the specified full path

    def download_image(self):
        url = simpledialog.askstring("Download Image", "Enter the Image URL:")
        if url:
            try:
                response = requests.get(url)
                image = Image.open(BytesIO(response.content))
                combined_image = self.combine_images(image)
                if combined_image:
                    photo = ImageTk.PhotoImage(combined_image)
                    self.image_label.configure(image=photo)
                    self.image_label.image = photo  # Update display immediately

                    # Construct the full save path from the image URL entry field
                    existing_path = self.image_url_shadow_costume_entry.get().strip("/")
                    full_save_path = os.path.join(self.get_images_directory(), existing_path)
                    combined_image.save(full_save_path)  # Save the image at the constructed path
            except Exception as e:
                messagebox.showerror("Error", f"Failed to download the image: {e}")

    def combine_images(self, pokemon_image):
        """
        Combine the downloaded or selected Pokémon image with the shadow effect and shadow icon.
        """
        try:
            # Define paths to shadow effect and shadow icon images
            shadow_effect_path = os.path.join(self.get_images_directory(), './images/shadow_effect.png')
            shadow_icon_path = os.path.join(self.get_images_directory(), './images/shadow_icon_middle_ground.png')

            # Open all the images
            base_image = Image.new("RGBA", (240,240), (0,0,0,0))
            
            shadow_effect = Image.open(shadow_effect_path).convert("RGBA")

            shadow_icon = Image.open(shadow_icon_path).convert("RGBA")

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
        
    def save_shadow_costume(self):
        shadow_id = self.shadow_dropdown.get().split(':')[0]
        costume_id = self.costume_dropdown.get().split(':')[0]
        date_available = self.date_available_entry.get()
        date_shiny_available = self.date_shiny_available_entry.get()
        image_url_shadow_costume = self.image_url_shadow_costume_entry.get()
        image_url_shiny_shadow_costume = self.image_url_shiny_shadow_costume_entry.get()

        # Attempt to save the costume data
        self.db_manager.save_shadow_costume(shadow_id, costume_id, date_available, date_shiny_available, image_url_shadow_costume, image_url_shiny_shadow_costume)
        messagebox.showinfo("Save Successful", "Shadow costume data saved successfully.")
        self.refresh_data()

    def load_existing_data(self):
        data = self.db_manager.fetch_shadow_costume_data(self.pokemon_id)
        if data:
            first_record = data[0]
            # Assuming first_record is a tuple, access by index:
            self.shadow_dropdown.set("{}: {}".format(first_record[0], first_record[0]))  # first_record[0] for shadow_id
            self.costume_dropdown.set("{}: {}".format(first_record[2], first_record[2]))  # first_record[2] for costume_id

            # Clear the fields before inserting new data to avoid duplication
            self.date_available_entry.delete(0, tk.END)
            self.date_available_entry.insert(0, first_record[3])  # date_available

            self.date_shiny_available_entry.delete(0, tk.END)
            self.date_shiny_available_entry.insert(0, first_record[4])  # date_shiny_available

            self.image_url_shadow_costume_entry.delete(0, tk.END)
            self.image_url_shadow_costume_entry.insert(0, first_record[5])  # image_url_shadow_costume

            self.image_url_shiny_shadow_costume_entry.delete(0, tk.END)
            self.image_url_shiny_shadow_costume_entry.insert(0, first_record[6])  # image_url_shiny_shadow_costume

            self.view_image(first_record[5], 'shadow')
            if first_record[6]:
                self.view_image(first_record[6], 'shiny')

    def refresh_data(self):
        self.clear_entries()
        shadow_options = self.db_manager.fetch_shadow_options(self.pokemon_id)
        costume_options = self.db_manager.fetch_costume_options(self.pokemon_id)
        self.shadow_dropdown['values'] = shadow_options
        self.costume_dropdown['values'] = costume_options
        if shadow_options:
            self.shadow_dropdown.set(shadow_options[0])
        if costume_options:
            self.costume_dropdown.set(costume_options[0])
        self.load_existing_data()

    def clear_entries(self):
        self.shadow_dropdown.set('')
        self.costume_dropdown.set('')
        self.date_available_entry.delete(0, tk.END)
        self.date_shiny_available_entry.delete(0, tk.END)
        self.image_url_shadow_costume_entry.delete(0, tk.END)
        self.image_url_shiny_shadow_costume_entry.delete(0, tk.END)
