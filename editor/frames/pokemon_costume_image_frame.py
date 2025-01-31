# pokemon_costume_image_frame.py
import tkinter as tk
from tkinter import filedialog, messagebox, ttk, simpledialog
from PIL import Image, ImageTk
import requests
import os
from io import BytesIO

class PokemonCostumeImageFrame(tk.Frame):
    LABELS = [
        'Costume Name', 
        'Shiny Available', 
        'Date Available', 
        'Date Shiny Available',
        'Image URL', 
        'Shiny Image URL', 
        'Female Image URL', 
        'Shiny Female Image URL'
    ]

    def __init__(self, parent, pokemon_id, details_window):
        super().__init__(parent)
        self.parent = parent
        self.pokemon_id = pokemon_id
        self.details_window = details_window
        self.db_manager = details_window.db_manager
        
        # Current costumes from DB
        self.costumes = self.db_manager.fetch_pokemon_costumes(pokemon_id)
        
        self.images = {}            # store PhotoImages
        self.costume_entries = {}   # dict of {(costume_id, label): ttk.Entry}
        
        # Base path
        script_directory = os.path.dirname(os.path.realpath(__file__))
        go_directory = os.path.normpath(os.path.join(script_directory, '../../'))
        self.relative_path_to_images = os.path.join(go_directory, 'frontend', 'public')

        # Build UI
        self.initialize_ui()
        self.load_costume_images()

    def initialize_ui(self):
        self.costume_frames = []
        for costume in self.costumes:
            self.create_costume_frame(costume, is_new=False)
        self.add_costume_button()

    def create_costume_frame(self, costume, is_new):
        costume_id = 'new' if is_new else costume[0]
        frame_text = "New Costume" if is_new else f"Costume ID: {costume_id}"
        
        frame = tk.LabelFrame(self, text=frame_text, borderwidth=2, relief=tk.GROOVE)
        frame.pack(side="top", fill="x", padx=5, pady=5)
        frame.costume_id = costume_id 

        # Save Changes
        save_button = tk.Button(
            frame,
            text="Save Changes",
            command=lambda f=frame: self.save_costume_changes(f)  # Pass the frame
        )
        save_button.grid(row=8, column=1, sticky="ew")

        # Delete button (only if not new)
        if not is_new:
            self.add_delete_button(frame, costume_id, row=8, column=0)

        # Create the 8 entry widgets
        for i, label in enumerate(self.LABELS):
            tk.Label(frame, text=label).grid(row=i, column=0, sticky="e")
            entry = ttk.Entry(frame)
            entry.grid(row=i, column=1, sticky="ew")

            # If existing costume from DB, fill the field
            if not is_new:
                # costume[i+2] because index 0 is costume_id, 1 is pokemon_id, so actual fields start at index 2
                entry.insert(0, str(costume[i+2]) if costume[i+2] is not None else "")

            # store in dictionary
            self.costume_entries[(costume_id, label)] = entry

        # Add image controls (download, select) for each type of image
        image_label, shiny_image_label, female_image_label, shiny_female_image_label = \
            self.create_image_controls(frame, costume_id, is_new)
        
        # track the entire set in self.costume_frames
        self.costume_frames.append(
            (frame, image_label, shiny_image_label, female_image_label, shiny_female_image_label, costume_id)
        )
        return frame

    def create_image_controls(self, frame, costume_id, is_new):
        image_label = tk.Label(frame)
        image_label.grid(row=0, column=2, rowspan=6, padx=10, pady=10)
        
        shiny_image_label = tk.Label(frame)
        shiny_image_label.grid(row=0, column=3, rowspan=6, padx=10, pady=10)
        
        female_image_label = tk.Label(frame)
        female_image_label.grid(row=0, column=4, rowspan=6, padx=10, pady=10)
        
        shiny_female_image_label = tk.Label(frame)
        shiny_female_image_label.grid(row=0, column=5, rowspan=6, padx=10, pady=10)

        # Download/Upload buttons for each image type
        btn_download_image = tk.Button(
        frame, text="Download Image",
        command=lambda f=frame: self.download_image_from_url(f, is_shiny=False, is_female=False)
        )
        btn_download_image.grid(row=6, column=2, sticky="ew")

        btn_download_shiny = tk.Button(
            frame, text="Download Shiny Image",
            command=lambda f=frame: self.download_image_from_url(f, is_shiny=True, is_female=False)
        )
        btn_download_shiny.grid(row=6, column=3, sticky="ew")

        btn_download_female = tk.Button(
            frame, text="Download Female Image",
            command=lambda f=frame: self.download_image_from_url(f, is_shiny=False, is_female=True)
        )
        btn_download_female.grid(row=6, column=4, sticky="ew")

        btn_download_shiny_female = tk.Button(
            frame, text="Download Shiny Female Image",
            command=lambda f=frame: self.download_image_from_url(f, is_shiny=True, is_female=True)
        )
        btn_download_shiny_female.grid(row=6, column=5, sticky="ew")

        return image_label, shiny_image_label, female_image_label, shiny_female_image_label

    def load_costume_images(self):
        """
        For each existing costume (non-'new'), load images from local disk
        and update the UI. 'new' costumes won't have paths from DB yet.
        """
        for frame, image_label, shiny_image_label, female_image_label, shiny_female_image_label, costume_id in self.costume_frames:
            if costume_id == 'new':
                continue  # skip brand-new since it has no DB data yet

            # find in self.costumes
            costume = next((c for c in self.costumes if c[0] == costume_id), None)
            if not costume:
                continue

            regular_image_path = costume[6]   # image_url_costume
            shiny_image_path   = costume[7]   # image_url_shiny_costume
            female_image_path  = costume[8]   # image_url_costume_female
            shiny_female_path  = costume[9]   # image_url_shiny_costume_female

            # load each from disk
            image = self.open_local_image(regular_image_path) or self.get_placeholder_image()
            image_label.configure(image=image)
            image_label.image = image

            shiny_image = self.open_local_image(shiny_image_path) or self.get_placeholder_image()
            shiny_image_label.configure(image=shiny_image)
            shiny_image_label.image = shiny_image

            female_image = self.open_local_image(female_image_path) or self.get_placeholder_image()
            female_image_label.configure(image=female_image)
            female_image_label.image = female_image

            shiny_female_image = self.open_local_image(shiny_female_path) or self.get_placeholder_image()
            shiny_female_image_label.configure(image=shiny_female_image)
            shiny_female_image_label.image = shiny_female_image

        self.display_costume_images()

    def open_local_image(self, image_url):
        if not image_url:
            return None
        image_url = image_url.lstrip("\\/")
        full_path = os.path.join(self.relative_path_to_images, image_url)
        full_path = os.path.normpath(full_path)

        print(f"[DEBUG] Attempting to open local image at: {full_path}")
        try:
            pil_img = Image.open(full_path)
            pil_img = pil_img.resize((240, 240))
            return ImageTk.PhotoImage(pil_img)
        except FileNotFoundError:
            print(f"[WARNING] File not found: {full_path}")
            return None
        except Exception as e:
            print(f"[ERROR] Failed to open image: {e}")
            return None

    def get_placeholder_image(self):
        try:
            print("[DEBUG] Loading placeholder.png")
            placeholder = Image.open("path/to/placeholder.png")  # Adjust path
            return ImageTk.PhotoImage(placeholder)
        except IOError:
            print("[WARNING] Placeholder image not found, returning None.")
            return None

    def display_costume_images(self):
        """
        Optionally re-display images from self.images, if we had them in memory.
        Currently we rely on load_costume_images for existing costumes.
        """
        pass  # if you want to do any additional logic, put it here.

    def upload_costume_image(self, costume_id, is_shiny=False, is_female=False):
        """
        Let the user pick a local file from disk, then store it in self.images dict
        under some key. Optionally, you'd also store the path in the DB, but we have
        no code for that here.
        """
        new_image = self.upload_image()
        if new_image:
            # For demonstration, store it in self.images with some key:
            key = f"upload_{costume_id}_{is_shiny}_{is_female}"
            self.images[key] = new_image
            # Then you could update the UI as you wish:
            # e.g. self.display_costume_images()
            messagebox.showinfo("Uploaded", "Image successfully uploaded!")

    def upload_image(self):
        file_path = filedialog.askopenfilename()
        if file_path:
            print(f"[DEBUG] Selected file for upload: {file_path}")
            try:
                pil_img = Image.open(file_path).resize((240, 240))
                return ImageTk.PhotoImage(pil_img)
            except Exception as e:
                print(f"[ERROR] Failed to open or process the selected image: {e}")
                messagebox.showerror("Upload Error", f"Failed to open or process the image: {e}")
        else:
            print("[DEBUG] No file selected for upload.")
        return None

    def add_delete_button(self, frame, costume_id, row, column):
        # Pass the frame to the delete command
        btn_delete = tk.Button(frame, text="Delete Costume", 
                            command=lambda f=frame: self.delete_costume(f.costume_id))
        btn_delete.grid(row=row, column=column)

    def delete_costume(self, costume_id):
        """
        Delete from DB if not 'new', remove from self.costumes, remove frame from UI.
        """
        if costume_id != 'new':
            if messagebox.askyesno("Delete", "Are you sure you want to delete this costume?", parent=self.details_window.window):
                self.db_manager.delete_costume(costume_id)
                self.costumes = [c for c in self.costumes if c[0] != costume_id]
        else:
            # If it's 'new' and not saved, just remove the UI frame
            if not messagebox.askyesno("Discard", "Discard this new costume?", parent=self.details_window.window):
                return

        # remove from UI
        for frame_tuple in self.costume_frames[:]:
            frame, _, _, _, _, c_id = frame_tuple
            if c_id == costume_id:
                frame.destroy()
                self.costume_frames.remove(frame_tuple)

    def add_costume_button(self):
        btn_add = tk.Button(self, text="Add Costume", command=self.add_costume)
        btn_add.pack(side="top")

    def add_costume(self):
        """
        Creates a brand-new 'new' costume. The user can fill in the fields,
        optionally download images, then eventually "Save Changes".
        """
        print("[DEBUG] add_costume in PokemonCostumeImageFrame called.")
        self.create_costume_frame(['new'] + [''] * 7, True)

    def update_costume_entries_key(self, old_key, new_key):
        """
        If we do a DB insert for 'new', we replace 'new' with the real DB ID
        in self.costume_entries so future references are consistent.
        """
        for label in self.LABELS:
            if (old_key, label) in self.costume_entries:
                self.costume_entries[(new_key, label)] = self.costume_entries.pop((old_key, label))

    def save_costume_changes(self, frame):
        costume_id = frame.costume_id  # Get current ID from frame
        updated_details = {}
        for label in self.LABELS:
            widget = self.costume_entries.get((costume_id, label))
            if widget is not None:
                value = widget.get().strip()
                if label == 'Shiny Available':
                    raw = value.lower()
                    if raw in ['true','1']:
                        value = 1
                    elif raw in ['false','0']:
                        value = 0
                    else:
                        value = None
                updated_details[label] = value
            else:
                updated_details[label] = None

        if costume_id == 'new':
            new_id = self.db_manager.add_costume(self.pokemon_id, updated_details)
            self.update_costume_entries_key('new', new_id)
            
            # Update the frame's costume_id and costume_frames entry
            frame.costume_id = new_id
            for i, frame_tuple in enumerate(self.costume_frames):
                f, img_lbl, shiny_lbl, female_lbl, shiny_female_lbl, c_id = frame_tuple
                if c_id == 'new' and f == frame:
                    self.costume_frames[i] = (f, img_lbl, shiny_lbl, female_lbl, shiny_female_lbl, new_id)
                    break
            costume_id = new_id
        else:
            # existing
            values_list = [updated_details[lbl] for lbl in self.LABELS]
            self.db_manager.update_pokemon_costume(costume_id, values_list)

        # re-fetch from DB
        self.costumes = self.db_manager.fetch_pokemon_costumes(self.pokemon_id)
        messagebox.showinfo("Update Successful", f"Costume ID: {costume_id} updated.", parent=self.details_window.window)

    def download_image_from_url(self, frame, is_shiny=False, is_female=False):
        costume_id = frame.costume_id
        url = simpledialog.askstring("Download Image", "Enter the REMOTE image URL (http...):")
        if not url:
            print("[DEBUG] No remote URL entered by user.")
            return
        print(f"[DEBUG] download_image_from_url -> user entered remote URL: {url}")

        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()  # ensure status code 200

            print(f"[DEBUG] HTTP response status: {response.status_code}")
            print(f"[DEBUG] Content length: {len(response.content)} bytes")

            # Log current fields for debugging
            print("[DEBUG] Dumping all fields for this costume_id:")
            for label in self.LABELS:
                w = self.costume_entries.get((costume_id, label))
                w_val = w.get() if w else "[NONE]"
                print(f"   => {label}: {w_val}")

            # Downloaded image
            pil_img = Image.open(BytesIO(response.content)).resize((240, 240))

            if is_shiny:
                pil_img = self.combine_images_with_shiny_icon(pil_img)
                if not pil_img:
                    print("[ERROR] Could not combine with shiny icon. Aborting.")
                    return

            # Decide which local path field to use
            if is_female:
                entry_key = 'Shiny Female Image URL' if is_shiny else 'Female Image URL'
            else:
                entry_key = 'Shiny Image URL' if is_shiny else 'Image URL'

            # Get the user-typed local path
            widget = self.costume_entries.get((costume_id, entry_key))
            if not widget:
                # This means we have no such field, which shouldn't happen if everything is correct
                messagebox.showerror(
                    "No Field Found",
                    f"No entry widget found for costume_id={costume_id}, label='{entry_key}'."
                )
                print(f"[ERROR] No widget found for (costume_id={costume_id}, '{entry_key}') in self.costume_entries.")
                return

            relative_path = widget.get().strip()
            if not relative_path:
                messagebox.showerror(
                    "No Local Path",
                    f"You must enter a local file path in '{entry_key}' before downloading."
                )
                print("[DEBUG] Local path is empty; aborting.")
                return

            print(f"[DEBUG] Using user-entered local path: {relative_path}")

            # Build absolute save path
            save_path = os.path.join(self.relative_path_to_images, relative_path.lstrip("\\/"))
            save_path = os.path.normpath(save_path)
            print(f"[DEBUG] Full save_path: {save_path}")

            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            pil_img.save(save_path)
            print("[DEBUG] Image saved successfully to disk.")

            if os.path.exists(save_path):
                print(f"[DEBUG] Verified file exists on disk: {save_path}")
            else:
                print(f"[WARNING] File not found on disk after saving: {save_path}")

            # Update the UI label
            tk_img = ImageTk.PhotoImage(pil_img)
            for frame_tuple in self.costume_frames:
                # (frame, image_label, shiny_image_label, female_image_label, shiny_female_image_label, c_id)
                _, img_lbl, shiny_lbl, female_lbl, shiny_female_lbl, c_id = frame_tuple
                if str(c_id) == str(costume_id):
                    if is_female:
                        label_to_update = shiny_female_lbl if is_shiny else female_lbl
                    else:
                        label_to_update = shiny_lbl if is_shiny else img_lbl

                    label_to_update.configure(image=tk_img)
                    label_to_update.image = tk_img
                    print("[DEBUG] Label image updated in UI.")
                    break

        except requests.exceptions.RequestException as re:
            print(f"[ERROR] Failed to download the image: {re}")
            messagebox.showerror("Error", f"Failed to download the image: {re}")
        except Exception as e:
            print(f"[ERROR] Error processing the image: {e}")
            messagebox.showerror("Error", f"Error processing the image: {e}")

    def combine_images_with_shiny_icon(self, pokemon_image):
        """
        Overlays 'shiny_icon.png' on top of the downloaded Pokemon image.
        """
        try:
            shiny_icon_path = os.path.normpath(
                os.path.join(self.relative_path_to_images, 'images', 'shiny_icon.png')
            )
            print(f"[DEBUG] Attempting to open shiny icon at: {shiny_icon_path}")
            shiny_icon = Image.open(shiny_icon_path).convert("RGBA")

            base_image = Image.new("RGBA", pokemon_image.size, (0, 0, 0, 0))
            base_image.paste(pokemon_image, (0,0))

            # top-left corner
            base_image.paste(shiny_icon, (0,0), shiny_icon)
            print("[DEBUG] Shiny icon successfully overlaid.")
            return base_image

        except FileNotFoundError:
            print(f"[WARNING] Shiny icon not found. Path: {shiny_icon_path}")
            return pokemon_image  # gracefully proceed without icon
        except Exception as e:
            print(f"[ERROR] Failed to combine images with shiny icon: {e}")
            return None
