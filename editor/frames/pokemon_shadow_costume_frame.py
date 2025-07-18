# frames/pokemon_shadow_costume_frame.py
import os
import tkinter as tk
from tkinter import ttk, filedialog, simpledialog, messagebox
from PIL import Image, ImageTk
import requests
from io import BytesIO


class PokemonShadowCostumeFrame(tk.Frame):
    """
    Shadow-costume editor.

    • If data already exists → show populated editor.
    • Otherwise show a single “Add Shadow Costume” button; clicking it loads the editor.
    """

    # ────────────────────────────────────────────────────────────
    def __init__(self, parent, db_manager, pokemon_id):
        super().__init__(parent)
        self.db_manager = db_manager
        self.pokemon_id = pokemon_id

        if self.db_manager.fetch_shadow_costume_data(self.pokemon_id):
            self._show_editor()
        else:
            tk.Button(
                self,
                text="Add Shadow Costume",
                command=self._show_editor,
                width=25,
                padx=10,
                pady=10,
            ).pack(padx=20, pady=20)

    # ────────────────────────────────────────────────────────────
    # Build the full editor (once)
    # ────────────────────────────────────────────────────────────
    def _show_editor(self):
        for w in self.winfo_children():
            w.destroy()

        self._create_widgets()
        self.refresh_data()
        self.load_existing_data()

    # ────────────────────────────────────────────────────────────
    # Widget construction  (two-column grid)
    # ────────────────────────────────────────────────────────────
    def _create_widgets(self):
        outer = tk.LabelFrame(self, text="Shadow Costume Info", padx=8, pady=8)
        outer.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        outer.columnconfigure(0, weight=1)
        outer.columnconfigure(1, weight=1)

        # ── column 0 : all fields ───────────────────────────────
        left = tk.Frame(outer)
        left.grid(row=0, column=0, sticky="nsew", padx=(0, 8))
        left.columnconfigure(1, weight=1)

        r = 0
        tk.Label(left, text="Shadow:").grid(row=r, column=0, sticky="e", pady=2)
        self.shadow_dropdown = ttk.Combobox(left, width=45)
        self.shadow_dropdown.grid(row=r, column=1, sticky="ew", pady=2)
        r += 1

        tk.Label(left, text="Costume:").grid(row=r, column=0, sticky="e", pady=2)
        self.costume_dropdown = ttk.Combobox(left, width=45)
        self.costume_dropdown.grid(row=r, column=1, sticky="ew", pady=2)
        r += 1

        tk.Label(left, text="Date Available:").grid(row=r, column=0, sticky="e", pady=2)
        self.date_available_entry = ttk.Entry(left)
        self.date_available_entry.grid(row=r, column=1, sticky="ew", pady=2)
        r += 1

        tk.Label(left, text="Date Shiny Available:").grid(row=r, column=0, sticky="e", pady=2)
        self.date_shiny_available_entry = ttk.Entry(left)
        self.date_shiny_available_entry.grid(row=r, column=1, sticky="ew", pady=2)
        r += 1

        tk.Label(left, text="Image URL (Shadow):").grid(row=r, column=0, sticky="e", pady=2)
        self.image_url_shadow_costume_entry = ttk.Entry(left)
        self.image_url_shadow_costume_entry.grid(row=r, column=1, sticky="ew", pady=2)
        self.image_url_shadow_costume_entry.bind(
            "<FocusOut>",
            lambda e: self.view_image(self.image_url_shadow_costume_entry.get(), "shadow"),
        )
        r += 1

        tk.Label(left, text="Image URL (Shiny Shadow):").grid(row=r, column=0, sticky="e", pady=2)
        self.image_url_shiny_shadow_costume_entry = ttk.Entry(left)
        self.image_url_shiny_shadow_costume_entry.grid(row=r, column=1, sticky="ew", pady=2)
        self.image_url_shiny_shadow_costume_entry.bind(
            "<FocusOut>",
            lambda e: self.view_image(self.image_url_shiny_shadow_costume_entry.get(), "shiny"),
        )
        r += 1

        self.save_button = tk.Button(left, text="Save Shadow Costume",
                                     command=self.save_shadow_costume)
        self.save_button.grid(row=r, column=0, columnspan=2, pady=(8, 0))

        # ── column 1 : image preview + buttons ──────────────────
        right = tk.Frame(outer)
        right.grid(row=0, column=1, sticky="nsew")
        right.rowconfigure(0, weight=1)

        self.image_label = tk.Label(right, relief="groove")
        self.image_label.grid(row=0, column=0, sticky="nsew", padx=2, pady=2)

        btn_box = tk.Frame(right)
        btn_box.grid(row=1, column=0, pady=4)

        tk.Button(btn_box, text="Select Image",
                  command=self.select_image).pack(side=tk.LEFT, padx=4)
        tk.Button(btn_box, text="Download Image",
                  command=self.download_image).pack(side=tk.LEFT, padx=4)

    # ────────────────────────────────────────────────────────────
    # (logic methods below are unchanged from previous version)
    # ────────────────────────────────────────────────────────────
    def get_images_directory(self):
        return os.path.join(os.path.dirname(os.path.realpath(__file__)),
                            '../../frontend/public')

    def view_image(self, image_url, _kind):
        if image_url:
            path = os.path.join(self.get_images_directory(), image_url.strip("/"))
            self.display_image(path)

    def display_image(self, path):
        try:
            img = Image.open(path)
        except FileNotFoundError:
            img = Image.new("RGB", (240, 240), "grey")
        photo = ImageTk.PhotoImage(img.resize((240, 240)))
        self.image_label.configure(image=photo)
        self.image_label.image = photo

    def select_image(self):
        fpath = filedialog.askopenfilename(
            filetypes=[("Image files", "*.png;*.jpg;*.jpeg;*.bmp")]
        )
        if fpath:
            img = Image.open(fpath)
            combined = self.combine_images(img)
            if combined:
                self._update_preview_and_save(combined)

    def download_image(self):
        url = simpledialog.askstring("Download Image", "Enter the Image URL:")
        if url:
            try:
                rsp = requests.get(url)
                rsp.raise_for_status()
                img = Image.open(BytesIO(rsp.content))
                combined = self.combine_images(img)
                if combined:
                    self._update_preview_and_save(combined)
            except Exception as e:
                messagebox.showerror("Error", f"Failed to download the image: {e}")

    # helper used by select_image / download_image
    def _update_preview_and_save(self, img):
        photo = ImageTk.PhotoImage(img.resize((240, 240)))
        self.image_label.configure(image=photo)
        self.image_label.image = photo

        rel_path = self.image_url_shadow_costume_entry.get().strip("/")
        abs_path = os.path.join(self.get_images_directory(), rel_path)
        os.makedirs(os.path.dirname(abs_path), exist_ok=True)
        img.save(abs_path)

    def combine_images(self, pokemon_image):
        try:
            base = Image.new("RGBA", (240, 240), (0, 0, 0, 0))
            se_path = os.path.join(self.get_images_directory(), "images/shadow_effect.png")
            si_path = os.path.join(self.get_images_directory(), "images/shadow_icon_middle_ground.png")
            shadow_effect = Image.open(se_path).convert("RGBA")
            shadow_icon = Image.open(si_path).convert("RGBA")

            shadow_effect = shadow_effect.resize(
                (240, int(240 / shadow_effect.width * shadow_effect.height))
            )
            base.paste(shadow_effect,
                       ((base.width - shadow_effect.width) // 2,
                        (base.height - shadow_effect.height) // 2 + 20),
                       shadow_effect)
            base.paste(pokemon_image, (0, 0), pokemon_image)
            base.paste(shadow_icon,
                       (0, base.height - shadow_icon.height),
                       shadow_icon)
            return base
        except Exception as e:
            print("Failed to combine images:", e)
            return None

    def save_shadow_costume(self):
        shadow_id = self.shadow_dropdown.get().split(":")[0]
        costume_id = self.costume_dropdown.get().split(":")[0]
        self.db_manager.save_shadow_costume(
            shadow_id,
            costume_id,
            self.date_available_entry.get(),
            self.date_shiny_available_entry.get(),
            self.image_url_shadow_costume_entry.get(),
            self.image_url_shiny_shadow_costume_entry.get(),
        )
        messagebox.showinfo("Save Successful", "Shadow costume data saved successfully.")
        self.refresh_data()

    # ---------- populate / clear ----------
    def load_existing_data(self):
        data = self.db_manager.fetch_shadow_costume_data(self.pokemon_id)
        if not data:
            return
        d = data[0]
        self.shadow_dropdown.set(f"{d[0]}: {d[0]}")
        self.costume_dropdown.set(f"{d[2]}: {d[2]}")
        self.date_available_entry.delete(0, tk.END);  self.date_available_entry.insert(0, d[3])
        self.date_shiny_available_entry.delete(0, tk.END); self.date_shiny_available_entry.insert(0, d[4])
        self.image_url_shadow_costume_entry.delete(0, tk.END); self.image_url_shadow_costume_entry.insert(0, d[5])
        self.image_url_shiny_shadow_costume_entry.delete(0, tk.END); self.image_url_shiny_shadow_costume_entry.insert(0, d[6])
        self.view_image(d[5], "shadow")

    def refresh_data(self):
        self.clear_entries()
        self.shadow_dropdown['values'] = self.db_manager.fetch_shadow_options(self.pokemon_id)
        self.costume_dropdown['values'] = self.db_manager.fetch_costume_options(self.pokemon_id)
        if self.shadow_dropdown['values']:
            self.shadow_dropdown.set(self.shadow_dropdown['values'][0])
        if self.costume_dropdown['values']:
            self.costume_dropdown.set(self.costume_dropdown['values'][0])
        self.load_existing_data()

    def clear_entries(self):
        if hasattr(self, "shadow_dropdown"):
            self.shadow_dropdown.set('')
            self.costume_dropdown.set('')
            self.date_available_entry.delete(0, tk.END)
            self.date_shiny_available_entry.delete(0, tk.END)
            self.image_url_shadow_costume_entry.delete(0, tk.END)
            self.image_url_shiny_shadow_costume_entry.delete(0, tk.END)
