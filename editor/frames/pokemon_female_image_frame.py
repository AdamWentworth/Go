# frames/pokemon_female_image_frame.py
import os
import tkinter as tk
from tkinter import filedialog, messagebox, simpledialog
from io import BytesIO

from PIL import Image, ImageTk
import requests


class PokemonFemaleImageFrame:
    """
    Displays up to four female-form images:

        ┌───────────────────── LabelFrame “Female Images” ─────────────────────┐
        │ [Default ♀]  [Shiny ♀]  [Shadow ♀]  [Shiny-Shadow ♀]  (+ DL buttons) │
        └───────────────────────────────────────────────────────────────────────┘
    """

    IMG_SIZE_UI = 150   # thumbnail size for on-screen preview
    IMG_SIZE_DL = 240   # size saved to disk / combined

    # ──────────────────────────────────────────────────────────────
    def __init__(
        self,
        parent,
        female_image_url,
        shiny_female_image_url,
        shadow_female_image_url,
        shiny_shadow_female_image_url,
        pokemon_id,
        controller,
    ):
        self.parent     = parent
        self.pid        = pokemon_id
        self.ctrl       = controller

        # root widget now a LabelFrame → border + title
        self.frame = tk.LabelFrame(
            parent,
            text="Female Images",
            bd=2,
            relief=tk.GROOVE,
            padx=8,
            pady=8,
        )

        # assets
        self.shiny_icon_path  = os.path.join(
            self.ctrl.relative_path_to_images, "images", "shiny_icon.png"
        )
        self.shadow_icon_path = os.path.join(
            self.ctrl.relative_path_to_images, "images", "shadow_icon_middle_ground.png"
        )
        self.shadow_bg_path   = os.path.join(
            self.ctrl.relative_path_to_images, "images", "shadow_effect.png"
        )

        # keep refs to the four <Label>s so we can update them later
        self.image_labels: dict[str, tk.Label] = {}

        # build UI
        self._add_image_block(female_image_url,          "Female Form",        "female")
        self._add_image_block(shiny_female_image_url,    "Shiny Female",       "shiny_female")
        self._add_image_block(shadow_female_image_url,   "Shadow Female",      "shadow_female")
        self._add_image_block(shiny_shadow_female_image_url,
                              "Shiny Shadow Female",      "shiny_shadow_female")

    # ──────────────────────────────────────────────────────────
    # helpers to build/update a single “image card”
    # ──────────────────────────────────────────────────────────
    def _add_image_block(self, url, label_txt, key):
        """
        Create a mini-frame with thumbnail, description label and
        a “Download Image” button (unless already created).
        """
        if key not in self.image_labels:
            card = tk.Frame(self.frame)
            card.pack(side=tk.LEFT, padx=10, pady=5, expand=True)

            img_lbl = tk.Label(card)
            img_lbl.pack(side=tk.TOP)
            tk.Label(card, text=label_txt).pack(side=tk.TOP, pady=(2, 0))
            tk.Button(
                card,
                text="Download Image",
                command=lambda k=key: self._download_image(k),
            ).pack(side=tk.TOP, pady=(4, 0))

            self.image_labels[key] = img_lbl

        self._update_thumbnail(url, key)

    def _update_thumbnail(self, rel_url, key):
        lbl = self.image_labels[key]
        try:
            path = os.path.join(self.ctrl.relative_path_to_images, rel_url.lstrip("/"))
            img  = Image.open(path).resize((self.IMG_SIZE_UI, self.IMG_SIZE_UI), Image.LANCZOS)
            photo = ImageTk.PhotoImage(img)
            lbl.configure(image=photo)
            lbl.image = photo
        except Exception:
            lbl.configure(text="Image\nNot\nAvailable", justify="center")
            lbl.image = None

    # ──────────────────────────────────────────────────────────
    # download / save helpers
    # ──────────────────────────────────────────────────────────
    def _download_image(self, key):
        url = simpledialog.askstring("Download Image", f"Image URL for {key.replace('_', ' ')}:")
        if not url:
            return

        try:
            resp = requests.get(url)
            resp.raise_for_status()
            img = Image.open(BytesIO(resp.content)).resize(
                (self.IMG_SIZE_DL, self.IMG_SIZE_DL), Image.LANCZOS
            )

            is_shiny  = key.startswith("shiny")
            is_shadow = "shadow" in key

            img = self._combine_overlays(img, is_shiny=is_shiny, is_shadow=is_shadow)
            rel_path = self._save_to_disk(img, key)
            self._update_thumbnail(rel_path, key)
            self._update_db_field(key, rel_path)

            messagebox.showinfo("Saved", f"{key.replace('_', ' ').title()} saved.", parent=self.ctrl.window)
        except Exception as exc:
            messagebox.showerror("Error", str(exc), parent=self.ctrl.window)

    # overlays shiny/star + shadow background/icon
    def _combine_overlays(self, base, *, is_shiny=False, is_shadow=False):
        try:
            canv = Image.new("RGBA", (self.IMG_SIZE_DL, self.IMG_SIZE_DL), (0, 0, 0, 0))
            if is_shadow:
                bg = Image.open(self.shadow_bg_path).convert("RGBA")
                bg = bg.resize(
                    (self.IMG_SIZE_DL, int(self.IMG_SIZE_DL / bg.width * bg.height)),
                    Image.LANCZOS,
                )
                canv.paste(bg, ((canv.width - bg.width) // 2, 20), bg)
            canv.paste(base.convert("RGBA"), (0, 0), base.convert("RGBA"))
            if is_shadow:
                si = Image.open(self.shadow_icon_path).convert("RGBA")
                canv.paste(si, (0, canv.height - si.height), si)
            if is_shiny:
                shiny = Image.open(self.shiny_icon_path).convert("RGBA")
                canv.paste(shiny, (0, 0), shiny)
            return canv
        except Exception:
            return base  # fallback

    # save combined image and return relative URL
    def _save_to_disk(self, img, key):
        folder_map = {
            "female":              "female/default",
            "shiny_female":        "female/shiny",
            "shadow_female":       "female/shadow",
            "shiny_shadow_female": "female/shiny_shadow",
        }
        rel_dir = f"images/{folder_map[key]}"
        abs_dir = os.path.join(self.ctrl.relative_path_to_images, rel_dir)
        os.makedirs(abs_dir, exist_ok=True)

        fname = f"{key}_pokemon_{self.pid}.png"
        abs_path = os.path.join(abs_dir, fname)
        img.save(abs_path)

        return f"/{rel_dir}/{fname}".replace("\\", "/")

    # update DB and keep other columns intact
    def _update_db_field(self, key, rel_path):
        current = self.ctrl.db_manager.fetch_female_pokemon_image_data(self.pid)
        payload = dict(current)  # shallow copy
        field_map = {
            "female":              "image_url",
            "shiny_female":        "shiny_image_url",
            "shadow_female":       "shadow_image_url",
            "shiny_shadow_female": "shiny_shadow_image_url",
        }
        payload[field_map[key]] = rel_path
        self.ctrl.db_manager.update_female_pokemon_images(self.pid, payload)
