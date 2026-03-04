import os
from io import BytesIO

import requests
import tkinter as tk
from tkinter import filedialog, messagebox, simpledialog
from PIL import Image, ImageTk


class FusionImageFrames:
    PREVIEW_SIZE = 180
    SAVE_SIZE = 240

    def __init__(self, parent, fusion_id, details_window, image_url_entry, shiny_image_url_entry):
        self.parent = parent
        self.fusion_id = int(fusion_id)
        self.details_window = details_window
        self.image_url_entry = image_url_entry
        self.shiny_image_url_entry = shiny_image_url_entry

        # Root that resolves /images/... URLs
        self.assets_root = self.details_window.relative_path_to_images
        self.shiny_icon_path = os.path.join(self.assets_root, "images", "shiny_icon.png")

        self.frame = tk.LabelFrame(parent, text="Fusion Images", padx=8, pady=8)
        self.frame.pack(side=tk.TOP, fill=tk.BOTH, expand=True, padx=10, pady=10)

        self.default_label = self._create_image_block(
            self.frame,
            title="Fusion Image",
            select_cmd=lambda: self._select_image(is_shiny=False),
            download_cmd=lambda: self._download_image(is_shiny=False),
            col=0,
        )
        self.shiny_label = self._create_image_block(
            self.frame,
            title="Shiny Fusion Image",
            select_cmd=lambda: self._select_image(is_shiny=True),
            download_cmd=lambda: self._download_image(is_shiny=True),
            col=1,
        )

        self.image_url_entry.bind("<FocusOut>", lambda _e: self.refresh_previews())
        self.shiny_image_url_entry.bind("<FocusOut>", lambda _e: self.refresh_previews())

        self.refresh_previews()

    def _create_image_block(self, parent, title, select_cmd, download_cmd, col):
        card = tk.Frame(parent)
        card.grid(row=0, column=col, padx=8, pady=4, sticky="nsew")

        tk.Label(card, text=title).pack(side=tk.TOP, pady=(0, 4))
        image_label = tk.Label(card)
        image_label.pack(side=tk.TOP, fill=tk.BOTH, expand=True)

        tk.Button(card, text="Select Image", command=select_cmd).pack(side=tk.TOP, pady=(4, 0))
        tk.Button(card, text="Download Image", command=download_cmd).pack(side=tk.TOP, pady=(4, 0))

        return image_label

    def refresh_previews(self):
        self._load_preview(self.image_url_entry.get().strip(), self.default_label)
        self._load_preview(self.shiny_image_url_entry.get().strip(), self.shiny_label)

    def _load_preview(self, rel_url, target_label):
        image = self._open_image_from_rel_url(rel_url)
        if image is None:
            image = Image.new("RGB", (self.PREVIEW_SIZE, self.PREVIEW_SIZE), "grey")
        else:
            image = image.resize((self.PREVIEW_SIZE, self.PREVIEW_SIZE), Image.LANCZOS)

        photo = ImageTk.PhotoImage(image)
        target_label.configure(image=photo)
        target_label.image = photo

    def _open_image_from_rel_url(self, rel_url):
        if not rel_url:
            return None
        absolute_path = os.path.join(self.assets_root, rel_url.lstrip("\\/"))
        if not os.path.exists(absolute_path):
            return None
        try:
            return Image.open(absolute_path)
        except Exception:
            return None

    def _select_image(self, is_shiny):
        file_path = filedialog.askopenfilename(
            filetypes=[("Image files", "*.png;*.jpg;*.jpeg;*.bmp")]
        )
        if not file_path:
            return

        try:
            image = Image.open(file_path).convert("RGBA").resize(
                (self.SAVE_SIZE, self.SAVE_SIZE), Image.LANCZOS
            )
            if is_shiny:
                image = self._overlay_shiny_icon(image)
            self._save_image_and_update_entry(image, is_shiny=is_shiny)
        except Exception as exc:
            messagebox.showerror("Error", f"Failed to process image: {exc}", parent=self.details_window.window)

    def _download_image(self, is_shiny):
        url = simpledialog.askstring(
            "Download Image",
            f"Enter {'shiny ' if is_shiny else ''}fusion image URL:",
            parent=self.details_window.window,
        )
        if not url:
            return

        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            image = Image.open(BytesIO(response.content)).convert("RGBA").resize(
                (self.SAVE_SIZE, self.SAVE_SIZE), Image.LANCZOS
            )
            if is_shiny:
                image = self._overlay_shiny_icon(image)
            self._save_image_and_update_entry(image, is_shiny=is_shiny)
        except Exception as exc:
            messagebox.showerror("Error", f"Failed to download image: {exc}", parent=self.details_window.window)

    def _save_image_and_update_entry(self, image, is_shiny):
        entry = self.shiny_image_url_entry if is_shiny else self.image_url_entry
        existing = entry.get().strip()
        default_rel = self._default_relative_path(is_shiny=is_shiny)
        rel_path = self._normalize_rel_path(existing or default_rel)
        absolute_path = os.path.join(self.assets_root, rel_path.lstrip("/"))

        os.makedirs(os.path.dirname(absolute_path), exist_ok=True)
        image.save(absolute_path, "PNG")

        entry.delete(0, tk.END)
        entry.insert(0, rel_path)
        self.refresh_previews()

        messagebox.showinfo(
            "Saved",
            f"Image saved to:\n{absolute_path}",
            parent=self.details_window.window,
        )

    def _default_relative_path(self, is_shiny):
        if is_shiny:
            return f"/images/shiny_fusion/shiny_fusion_{self.fusion_id}.png"
        return f"/images/fusion/fusion_{self.fusion_id}.png"

    @staticmethod
    def _normalize_rel_path(path_value):
        normalized = path_value.replace("\\", "/").lstrip("/")
        return f"/{normalized}"

    def _overlay_shiny_icon(self, base_image):
        try:
            shiny_icon = Image.open(self.shiny_icon_path).convert("RGBA")
            output = base_image.copy()
            output.paste(shiny_icon, (0, 0), shiny_icon)
            return output
        except Exception:
            return base_image
