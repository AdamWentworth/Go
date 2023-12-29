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
        for costume in self.costumes:
            self.create_costume_frame(costume, False)  # False indicating it's not a new costume
        self.add_costume_button()

    def create_costume_frame(self, costume, is_new):
        costume_id = 'new' if is_new else costume[0]
        frame_text = "New Costume" if is_new else f"Costume ID: {costume_id}"
        frame = tk.LabelFrame(self, text=frame_text, borderwidth=2, relief=tk.GROOVE)
        frame.pack(side="top", fill="x", padx=5, pady=5)

        labels = ['Costume Name', 'Shiny Available', 'Date Available', 'Date Shiny Available', 'Image URL', 'Shiny Image URL']
        for i, label in enumerate(labels):
            tk.Label(frame, text=label).grid(row=i, column=0, sticky="e")
            entry = ttk.Entry(frame)
            entry.grid(row=i, column=1, sticky="ew")
            if not is_new:
                entry.insert(0, str(costume[i+2]) if costume[i+2] is not None else "")
            self.costume_entries[(costume_id, label)] = entry

        image_label, shiny_image_label = self.create_image_controls(frame, costume_id, is_new)
        self.costume_frames.append((frame, image_label, shiny_image_label, costume_id))  # Store frame, image labels, and costume_id
        return frame
    
    def create_image_controls(self, frame, costume_id, is_new):
        # Image display placeholders
        image_label = tk.Label(frame)
        image_label.grid(row=0, column=2, rowspan=6, padx=10, pady=10)
        shiny_image_label = tk.Label(frame)
        shiny_image_label.grid(row=0, column=3, rowspan=6, padx=10, pady=10)

        # Buttons for regular image update placed right beneath the image placeholders
        update_reg_image_url_button = tk.Button(frame, text="Download Image",
                                                command=lambda c_id=costume_id: self.update_costume_image_from_url(c_id, is_shiny=False))
        update_reg_image_url_button.grid(row=6, column=2, sticky="ew")

        upload_reg_image_file_button = tk.Button(frame, text="Select Image",
                                                command=lambda c_id=costume_id: self.upload_costume_image(c_id, is_shiny=False))
        upload_reg_image_file_button.grid(row=7, column=2, sticky="ew")

        # Buttons for shiny image update placed right beneath the shiny image placeholders
        update_shiny_image_url_button = tk.Button(frame, text="Download Image",
                                                command=lambda c_id=costume_id: self.update_costume_image_from_url(c_id, is_shiny=True))
        update_shiny_image_url_button.grid(row=6, column=3, sticky="ew")

        upload_shiny_image_file_button = tk.Button(frame, text="Select Image",
                                                command=lambda c_id=costume_id: self.upload_costume_image(c_id, is_shiny=True))
        upload_shiny_image_file_button.grid(row=7, column=3, sticky="ew")

        # Add save button for the costume
        save_costume_button = tk.Button(frame, text="Save Costume",
                                        command=lambda c_id=costume_id: self.save_costume_changes(c_id))
        save_costume_button.grid(row=8, column=1, columnspan=2, sticky="ew")

        # Add delete button for the costume if it's not a new costume
        if not is_new:
            delete_button = tk.Button(frame, text="Delete Costume",
                                    command=lambda c_id=costume_id: self.delete_costume(c_id))
            delete_button.grid(row=8, column=0, sticky="ew")

        # If it's a new costume, no images exist yet, so set placeholders or empty labels
        if is_new:
            image_label.config(text="No Image")
            shiny_image_label.config(text="No Image")

        return image_label, shiny_image_label  # Return labels for storing in costume_frames

    def refresh_ui_for_costume(self, costume_id):
        # Find and destroy the old frame for the specific costume
        for frame, _, _, c_id in self.costume_frames:
            if c_id == costume_id:
                frame.destroy()
                break

        # Fetch the updated costume from the database
        updated_costume = self.db_manager.fetch_pokemon_costumes(self.pokemon_id, costume_id)

        # Rebuild the UI for the updated costume
        self.initialize_ui_for_costume(updated_costume)  # You'll need to modify initialize_ui to handle single costume
        self.load_costume_images()  # Reload images for all costumes
        self.display_costume_images()  # Redisplay images for all costumes

    def load_costume_images(self):
        # Load and display images for each stored costume
        for frame, image_label, shiny_image_label, costume_id in self.costume_frames:
            if costume_id != 'new':  # Ensure we're not trying to load images for a 'new' costume
                # Find the costume in self.costumes with the matching costume_id
                costume = next((c for c in self.costumes if c[0] == costume_id), None)
                if costume:  # Check if the costume was found
                    regular_image_path = costume[6]  # Regular image path (already relative)
                    shiny_image_path = costume[7]  # Shiny image path (already relative)

                    # Open regular and shiny costume images if they exist, or display placeholder
                    image = self.open_local_image(regular_image_path) if regular_image_path else self.get_placeholder_image()
                    shiny_image = self.open_local_image(shiny_image_path) if shiny_image_path else self.get_placeholder_image()

                    # Update the image and shiny_image labels with the images
                    image_label.configure(image=image)
                    image_label.image = image  # Keep a reference
                    shiny_image_label.configure(image=shiny_image)
                    shiny_image_label.image = shiny_image  # Keep a reference

        self.display_costume_images()

    def display_costume_images(self):
        for _, image_label, shiny_image_label, costume_id in self.costume_frames:
            # Fetching images from the stored dictionary using the costume_id
            regular_image_path, shiny_image_path = None, None
            
            # Find the costume in self.costumes with the matching costume_id
            costume = next((c for c in self.costumes if str(c[0]) == str(costume_id)), None)
            if costume:  # Ensure costume is found and costume_id is not 'new'
                regular_image_path = costume[6]  # Regular image path (already relative)
                shiny_image_path = costume[7]  # Shiny image path (already relative)

            # Update regular image if exists
            if regular_image_path and regular_image_path in self.images:
                image = self.images[regular_image_path]
                image_label.configure(image=image)
                image_label.image = image  # Keep a reference
            else:
                # Clear the image or set to default/placeholder
                image_label.configure(image=self.get_placeholder_image())
                image_label.image = self.get_placeholder_image()  # Keep a reference to avoid garbage collection

            # Update shiny image if exists
            if shiny_image_path and shiny_image_path in self.images:
                shiny_image = self.images[shiny_image_path]
                shiny_image_label.configure(image=shiny_image)
                shiny_image_label.image = shiny_image  # Keep a reference
            else:
                # Clear the image or set to default/placeholder
                shiny_image_label.configure(image=self.get_placeholder_image())
                shiny_image_label.image = self.get_placeholder_image()  # Keep a reference to avoid garbage collection

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
        for frame_tuple in self.costume_frames:
            try:
                frame, image_label, shiny_image_label, costume_id = frame_tuple
                str_costume_id = str(costume_id)  # Ensuring it's a string

                costume = next((c for c in self.costumes if str(c[0]) == str_costume_id), None)
                if costume:
                    regular_image_path = costume[6]  # Regular image path
                    shiny_image_path = costume[7]  # Shiny image path

                    # Only attempt to update the image if a path is available
                    if regular_image_path and regular_image_path in self.images:
                        image = self.images.get(regular_image_path)
                        image_label.configure(image=image)
                        image_label.image = image  # Keep a reference
                    else:
                        image_label.configure(image=None)  # Clear the image or set to a default

                    if shiny_image_path and shiny_image_path in self.images:
                        shiny_image = self.images.get(shiny_image_path)
                        shiny_image_label.configure(image=shiny_image)
                        shiny_image_label.image = shiny_image  # Keep a reference
                    else:
                        shiny_image_label.configure(image=None)  # Clear the image or set to a default

            except Exception as e:
                print(f"Error updating costume image: {e}")

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

    def add_delete_button(self, frame, costume_id, row, column):
        # Ensure the delete command has the correct costume_id
        delete_button = tk.Button(frame, text="Delete Costume", command=lambda: self.delete_costume(costume_id))
        delete_button.grid(row=row, column=column)

    def delete_costume(self, costume_id):
        # Confirm before deleting
        if messagebox.askyesno("Delete", "Are you sure you want to delete this costume?", parent=self.details_window):
            self.db_manager.delete_costume(costume_id)

            # Find and remove the frame for the deleted costume from the UI
            for frame_tuple in self.costume_frames:
                _, c_id = frame_tuple
                if c_id == costume_id:
                    frame, _ = frame_tuple
                    frame.destroy()
                    self.costume_frames.remove(frame_tuple)
                    break
    
    def add_costume_button(self):
        add_button = tk.Button(self, text="Add Costume",
                            command=self.add_costume)
        add_button.pack(side="top")  # Adjust the placement as needed
    
    def add_costume(self):
        blank_costume_details = self.get_blank_costume_details()
        new_costume_id = self.db_manager.add_costume(self.pokemon_id, blank_costume_details)
        self.create_costume_frame(['new'] * 8, True)  # 'new' * 8 represents a blank costume tuple for new costume creation

    def save_costume_changes(self, costume_id):
        # Gather the updated details from the entries
        updated_details = []
        labels = ['Costume Name', 'Shiny Available', 'Date Available', 'Date Shiny Available', 'Image URL', 'Shiny Image URL']
        for label in labels:
            entry = self.costume_entries.get((costume_id, label))
            if entry is not None:
                value = entry.get().strip()  # strip to remove leading/trailing whitespace
                if label == 'Shiny Available':
                    raw_value = entry.get().strip()  # Get the raw string value and strip whitespace
                    if raw_value.lower() in ['true', '1']:
                        value = 1
                    elif raw_value.lower() in ['false', '0']:
                        value = 0
                    else:
                        value = None  # Or handle unexpected input
                updated_details.append(value)
        # Update the database with these details
        self.db_manager.update_pokemon_costume(costume_id, updated_details)

        # Confirm the update to the user. Assuming 'self.details_window.window' is the actual Tk window.
        # Adjust 'self.details_window.window' to the actual attribute that holds the Tkinter window reference.
        messagebox.showinfo("Update Successful", f"Costume ID: {costume_id} updated.", parent=self.details_window.window)

    def get_blank_costume_details(self):
        # Return blank details as per your costume structure in the database
        # This is an example structure, adjust according to your actual database schema
        return {
            'costume_name': '',
            'shiny_available': '',
            'date_available': '',
            'date_shiny_available': '',
            'image_url_costume': '',
            'image_url_shiny_costume': ''
        }

    def create_blank_costume_frame(self, costume_id, is_new=False):
        frame_text = "New Costume" if is_new else f"Costume ID: {costume_id}"
        frame = tk.LabelFrame(self, text=frame_text, borderwidth=2, relief=tk.GROOVE)
        frame.pack(side="top", fill="x", padx=5, pady=5)

        labels = ['Costume Name', 'Shiny Available', 'Date Available', 'Date Shiny Available', 'Image URL', 'Shiny Image URL']
        for i, label in enumerate(labels):
            tk.Label(frame, text=label).grid(row=i, column=0, sticky="e")
            entry = ttk.Entry(frame)
            entry.grid(row=i, column=1, sticky="ew")
            self.costume_entries[(costume_id, label)] = entry  # Store the entry with its costume_id and label

        # Image display placeholders for regular and shiny images
        image_label = tk.Label(frame)
        image_label.grid(row=0, column=2, rowspan=6, padx=10, pady=10)

        shiny_image_label = tk.Label(frame)
        shiny_image_label.grid(row=0, column=3, rowspan=6, padx=10, pady=10)

        # Buttons for regular image update placed right beneath the image placeholders
        update_reg_image_url_button = tk.Button(frame, text="Download Image",
                                                command=lambda c_id=costume_id: self.update_costume_image_from_url(c_id, is_shiny=False))
        update_reg_image_url_button.grid(row=6, column=2, sticky="ew")

        upload_reg_image_file_button = tk.Button(frame, text="Select Image",
                                                command=lambda c_id=costume_id: self.upload_costume_image(c_id, is_shiny=False))
        upload_reg_image_file_button.grid(row=7, column=2, sticky="ew")

        # Buttons for shiny image update placed right beneath the shiny image placeholders
        update_shiny_image_url_button = tk.Button(frame, text="Download Image",
                                                command=lambda c_id=costume_id: self.update_costume_image_from_url(c_id, is_shiny=True))
        update_shiny_image_url_button.grid(row=6, column=3, sticky="ew")

        upload_shiny_image_file_button = tk.Button(frame, text="Select Image",
                                                command=lambda c_id=costume_id: self.upload_costume_image(c_id, is_shiny=True))
        upload_shiny_image_file_button.grid(row=7, column=3, sticky="ew")

        # Add save button for the costume
        save_costume_button = tk.Button(frame, text="Save Costume", command=lambda: self.save_costume_changes(costume_id))
        save_costume_button.grid(row=8, column=1, sticky="ew")

        # Add delete button for the costume
        delete_button = tk.Button(frame, text="Delete Costume", command=lambda: self.delete_costume(costume_id))
        delete_button.grid(row=8, column=0, sticky="ew")

        # Store the frame along with other components for later use
        self.costume_frames.append((frame, image_label, shiny_image_label, costume_id))

        return frame  # Return the frame for potential further use
