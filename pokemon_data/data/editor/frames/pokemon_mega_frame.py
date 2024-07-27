import tkinter as tk
from tkinter import filedialog, messagebox, simpledialog
from PIL import Image, ImageTk
import os
import requests
from io import BytesIO

class PokemonMegaFrame:
    def __init__(self, parent, pokemon_id, mega_data, details_window):
        self.parent = parent
        self.pokemon_id = pokemon_id
        self.details_window = details_window

        self.frame = tk.Frame(parent)
        self.frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=10, pady=10)

        self.container_frame = tk.Frame(self.frame, bg="white", bd=2, relief=tk.RIDGE)
        self.container_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        self.frame_label = tk.Label(self.container_frame, text=f"Mega Evolution for Pokemon ID: {pokemon_id}", bg="white")
        self.frame_label.pack(side=tk.TOP, fill=tk.X)

        self.mega_energy_cost, self.attack, self.defense, self.stamina, self.image_url, self.image_url_shiny, self.sprite_url, self.primal = mega_data

        # Entry fields for editable values
        self.create_editable_fields()
        # Display the mega details
        self.display_mega_details()

    def create_editable_fields(self):
        self.energy_entry = self.create_entry_field("Energy Cost", self.mega_energy_cost)
        self.attack_entry = self.create_entry_field("Attack", self.attack)
        self.defense_entry = self.create_entry_field("Defense", self.defense)
        self.stamina_entry = self.create_entry_field("Stamina", self.stamina)
        self.primal_entry = self.create_entry_field("Primal", self.primal)

    def create_entry_field(self, label_text, value):
        tk.Label(self.container_frame, text=f"{label_text}:", bg="white").pack()
        entry = tk.Entry(self.container_frame)
        entry.insert(0, str(value))
        entry.pack()
        return entry

    def display_mega_details(self):
        self.image_label = tk.Label(self.container_frame)
        self.image_label.pack(fill=tk.BOTH, expand=True)

        self.shiny_image_label = tk.Label(self.container_frame)
        self.shiny_image_label.pack(fill=tk.BOTH, expand=True)

        # Load and display the images
        self.load_image(self.image_url, self.image_label)
        self.load_image(self.image_url_shiny, self.shiny_image_label)

        # Add buttons for selecting and downloading images for shiny mega
        self.btn_download_shiny_image = tk.Button(self.container_frame, text="Download Shiny Mega Image", command=lambda: self.download_image_from_url('shiny_mega'))
        self.btn_download_shiny_image.pack(side=tk.BOTTOM)

        self.btn_download_image = tk.Button(self.container_frame, text="Download Mega Image", command=lambda: self.download_image_from_url('mega'))
        self.btn_download_image.pack(side=tk.BOTTOM)

    def load_image(self, image_url, label):
        if image_url:
            image_path = os.path.join(self.details_window.relative_path_to_images, image_url.lstrip("\\/"))
        else:
            image_path = None

        try:
            if image_path and os.path.exists(image_path):
                image = Image.open(image_path)
            else:
                raise FileNotFoundError
        except FileNotFoundError:
            print(f"Image file does not exist: {image_path}")
            image = Image.new('RGB', (240, 240), color='grey')

        photo = ImageTk.PhotoImage(image)
        label.configure(image=photo)
        label.image = photo

    def select_image_from_device(self, image_type):
        # Open file dialog to select an image
        file_path = filedialog.askopenfilename()
        if file_path:  # proceed if a file was selected
            try:
                # Open and resize the image
                image = Image.open(file_path).resize((240, 240))
                self.save_and_update_image(image, image_type)
            except Exception as e:
                messagebox.showerror("Error", f"Failed to open or process the image: {e}")

    def download_image_from_url(self, image_type):
        # Prompt for the URL
        url = simpledialog.askstring("Download Image", "Enter the Image URL:")
        if url:
            try:
                # Download and resize the image
                response = requests.get(url)
                response.raise_for_status()  # This will raise an HTTPError if the HTTP request returned an unsuccessful status code
                image = Image.open(BytesIO(response.content)).resize((240, 240))
                self.save_and_update_image(image, image_type)
            except requests.exceptions.RequestException as e:  # This is the correct exception to catch for requests errors
                messagebox.showerror("Error", f"Failed to download the image: {e}")
            except Exception as e:
                messagebox.showerror("Error", f"Failed to process the image: {e}")

    def save_and_update_image(self, image, image_type):
        if image_type == 'mega':
            save_dir = 'images/mega'
            save_name = f'mega_{self.pokemon_id}.png'
            label = self.image_label
        elif image_type == 'shiny_mega':
            save_dir = 'images/shiny_mega'
            save_name = f'shiny_mega_{self.pokemon_id}.png'
            label = self.shiny_image_label

        # Ensure the correct path construction with a single "Go" folder
        save_path = os.path.join(self.details_window.relative_path_to_images, save_dir, save_name)

        # Normalize the path to ensure consistent slashes
        save_path = os.path.normpath(save_path)

        # Make sure the directory exists, create if it doesn't
        os.makedirs(os.path.dirname(save_path), exist_ok=True)

        # Save the image
        image.save(save_path)

        # Update the displayed image
        self.photo = ImageTk.PhotoImage(image)
        label.configure(image=self.photo)
        label.image = self.photo  # keep a reference

        # Update the image URL in the corresponding attribute with a leading slash
        if image_type == 'mega':
            self.image_url = '/' + os.path.join(save_dir, save_name).replace("\\", "/")
        elif image_type == 'shiny_mega':
            self.image_url_shiny = '/' + os.path.join(save_dir, save_name).replace("\\", "/")

        # Show success message on top of the details window
        messagebox.showinfo("Success", f"Image updated successfully at {save_path}", parent=self.details_window.window)

        # You can call a method on details_window to react to the update if needed
        self.details_window.react_to_image_update()

    def get_mega_data(self):
        return (
            self.energy_entry.get(),
            self.attack_entry.get(),
            self.defense_entry.get(),
            self.stamina_entry.get(),
            self.image_url,
            self.image_url_shiny,
            self.sprite_url,
            self.primal_entry.get()
        )