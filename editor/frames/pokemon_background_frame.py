import tkinter as tk
from tkinter import messagebox, simpledialog, ttk
import os
import re
from io import BytesIO
from urllib.parse import urlparse

from PIL import Image, ImageTk
import requests


class PokemonBackgroundFrame(tk.Frame):
    PREVIEW_SIZE = 132

    def __init__(self, parent, pokemon_id, db_manager, details_window):
        super().__init__(parent)

        self.pokemon_id = int(pokemon_id)
        self.db_manager = db_manager
        self.details_window = details_window

        self.all_backgrounds = []
        self.background_by_id = {}
        self.background_options = []

        self._setup_ui()
        self.refresh()

    def _setup_ui(self):
        self.outer = tk.LabelFrame(self, text="Backgrounds", padx=10, pady=10)
        self.outer.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        self._build_add_existing_section()
        self._build_create_background_section()

        self.links_container = tk.Frame(self.outer)
        self.links_container.pack(fill=tk.BOTH, expand=True, pady=(8, 0))

    def _build_add_existing_section(self):
        section = tk.LabelFrame(self.outer, text="Link Existing Background", padx=8, pady=8)
        section.pack(fill=tk.X, expand=False, pady=(0, 8))

        tk.Label(section, text="Background").grid(row=0, column=0, sticky="e", padx=(0, 4))
        self.link_background_var = tk.StringVar()
        self.link_background_combo = ttk.Combobox(
            section,
            textvariable=self.link_background_var,
            state="readonly",
            width=36,
        )
        self.link_background_combo.grid(row=0, column=1, sticky="ew", padx=(0, 8))

        tk.Label(section, text="Costume ID").grid(row=0, column=2, sticky="e", padx=(0, 4))
        self.link_costume_entry = tk.Entry(section, width=12)
        self.link_costume_entry.grid(row=0, column=3, sticky="w", padx=(0, 8))

        tk.Button(
            section,
            text="Add Link",
            command=self._add_existing_link,
        ).grid(row=0, column=4, sticky="w")

        section.columnconfigure(1, weight=1)

    def _build_create_background_section(self):
        section = tk.LabelFrame(self.outer, text="Create Background + Link", padx=8, pady=8)
        section.pack(fill=tk.X, expand=False)

        self.create_entries = {}
        fields = (
            ("Name", "name"),
            ("Location", "location"),
            ("Image URL", "image_url"),
            ("Date (YYYY-MM-DD)", "date"),
            ("Costume ID", "costume_id"),
        )
        for row, (label, key) in enumerate(fields):
            tk.Label(section, text=label).grid(row=row, column=0, sticky="e", padx=(0, 4), pady=1)
            entry = tk.Entry(section)
            entry.grid(row=row, column=1, sticky="ew", pady=1)
            self.create_entries[key] = entry

        tk.Button(
            section,
            text="Download Image",
            command=lambda: self._download_background_image_to_local(
                self.create_entries["image_url"],
                self.create_preview_label,
                None,
                self.create_entries["name"].get().strip(),
            ),
        ).grid(row=2, column=2, sticky="w", padx=(8, 8))

        tk.Button(
            section,
            text="Create + Link",
            command=self._create_background_and_link,
        ).grid(row=0, column=3, rowspan=5, sticky="nsw", padx=(0, 8))

        self.create_preview_label = tk.Label(section)
        self.create_preview_label.grid(row=0, column=4, rowspan=5, padx=(8, 0), pady=2, sticky="n")
        self._update_preview(self.create_preview_label, self.create_entries["image_url"].get().strip())
        self.create_entries["image_url"].bind(
            "<KeyRelease>",
            lambda _event: self._update_preview(
                self.create_preview_label,
                self.create_entries["image_url"].get().strip(),
            ),
        )
        self.create_entries["image_url"].bind(
            "<FocusOut>",
            lambda _event: self._update_preview(
                self.create_preview_label,
                self.create_entries["image_url"].get().strip(),
            ),
        )

        section.columnconfigure(1, weight=1)

    def refresh(self):
        self._refresh_background_cache()
        self._refresh_background_dropdown()
        self._render_link_rows()

    def _refresh_background_cache(self):
        self.all_backgrounds = self.db_manager.fetch_all_backgrounds()
        self.background_by_id = {
            row[0]: {
                "background_id": row[0],
                "name": row[1],
                "location": row[2],
                "image_url": row[3],
                "date": row[4],
            }
            for row in self.all_backgrounds
        }
        self.background_options = [self._option_from_background_id(row[0]) for row in self.all_backgrounds]

    def _refresh_background_dropdown(self):
        self.link_background_combo["values"] = self.background_options
        if self.background_options and self.link_background_var.get() not in self.background_options:
            self.link_background_var.set(self.background_options[0])

    def _render_link_rows(self):
        for child in self.links_container.winfo_children():
            child.destroy()

        rows = self.db_manager.fetch_pokemon_background_rows(self.pokemon_id)
        if not rows:
            tk.Label(
                self.links_container,
                text="No backgrounds linked to this Pokemon yet.",
            ).pack(anchor="w")
            return

        for row in rows:
            self._create_link_row(row)

    def _create_link_row(self, row):
        (
            link_row_id,
            _pokemon_id,
            background_id,
            costume_id,
            bg_name,
            bg_location,
            bg_image_url,
            bg_date,
        ) = row

        frame = tk.LabelFrame(
            self.links_container,
            text=f"Link #{link_row_id} / Background #{background_id}",
            padx=8,
            pady=8,
        )
        frame.pack(fill=tk.X, expand=False, pady=(0, 8))

        tk.Label(frame, text="Background").grid(row=0, column=0, sticky="e", padx=(0, 4), pady=1)
        bg_var = tk.StringVar(value=self._option_from_background_id(background_id))
        bg_combo = ttk.Combobox(
            frame,
            textvariable=bg_var,
            values=self.background_options,
            state="readonly",
            width=36,
        )
        bg_combo.grid(row=0, column=1, sticky="ew", padx=(0, 8), pady=1)

        tk.Label(frame, text="Costume ID").grid(row=0, column=2, sticky="e", padx=(0, 4), pady=1)
        costume_entry = tk.Entry(frame, width=12)
        costume_entry.insert(0, "" if costume_id is None else str(costume_id))
        costume_entry.grid(row=0, column=3, sticky="w", pady=1)

        field_entries = {}
        bg_fields = (
            ("Name", "name", bg_name),
            ("Location", "location", bg_location),
            ("Image URL", "image_url", bg_image_url),
            ("Date", "date", bg_date),
        )
        for idx, (label, key, value) in enumerate(bg_fields, start=1):
            tk.Label(frame, text=label).grid(row=idx, column=0, sticky="e", padx=(0, 4), pady=1)
            entry = tk.Entry(frame)
            entry.insert(0, "" if value is None else str(value))
            entry.grid(row=idx, column=1, columnspan=3, sticky="ew", pady=1)
            field_entries[key] = entry

        preview_label = tk.Label(frame)
        preview_label.grid(row=0, column=4, rowspan=6, padx=(8, 0), pady=2, sticky="n")
        self._update_preview(preview_label, field_entries["image_url"].get().strip())

        def on_background_changed(_event):
            selected_id = self._parse_selected_background_id(bg_var.get())
            selected_bg = self.background_by_id.get(selected_id)
            if not selected_bg:
                return
            field_entries["name"].delete(0, tk.END)
            field_entries["name"].insert(0, selected_bg["name"] or "")
            field_entries["location"].delete(0, tk.END)
            field_entries["location"].insert(0, selected_bg["location"] or "")
            field_entries["image_url"].delete(0, tk.END)
            field_entries["image_url"].insert(0, selected_bg["image_url"] or "")
            field_entries["date"].delete(0, tk.END)
            field_entries["date"].insert(0, selected_bg["date"] or "")
            self._update_preview(preview_label, field_entries["image_url"].get().strip())

        bg_combo.bind("<<ComboboxSelected>>", on_background_changed)
        field_entries["image_url"].bind(
            "<KeyRelease>",
            lambda _event: self._update_preview(preview_label, field_entries["image_url"].get().strip()),
        )
        field_entries["image_url"].bind(
            "<FocusOut>",
            lambda _event: self._update_preview(preview_label, field_entries["image_url"].get().strip()),
        )

        button_row = tk.Frame(frame)
        button_row.grid(row=5, column=0, columnspan=4, sticky="w", pady=(6, 0))

        tk.Button(
            button_row,
            text="Save Link + Background",
            command=lambda: self._save_link_row(
                link_row_id,
                bg_var,
                costume_entry,
                field_entries,
            ),
        ).pack(side=tk.LEFT, padx=(0, 6))

        tk.Button(
            button_row,
            text="Remove Link",
            command=lambda: self._remove_link(link_row_id),
        ).pack(side=tk.LEFT, padx=(0, 6))

        tk.Button(
            button_row,
            text="Delete Background (Global)",
            command=lambda: self._delete_background_global(bg_var),
        ).pack(side=tk.LEFT)

        tk.Button(
            button_row,
            text="Download Image",
            command=lambda: self._download_background_image_to_local(
                field_entries["image_url"],
                preview_label,
                self._parse_selected_background_id(bg_var.get()),
                field_entries["name"].get().strip(),
            ),
        ).pack(side=tk.LEFT, padx=(6, 0))

        frame.columnconfigure(1, weight=1)

    def _add_existing_link(self):
        selected_id = self._parse_selected_background_id(self.link_background_var.get())
        if selected_id is None:
            messagebox.showerror(
                "Missing Background",
                "Select a background to link.",
                parent=self.details_window.window,
            )
            return

        costume_id = self._parse_optional_int(self.link_costume_entry.get())
        if self.link_costume_entry.get().strip() and costume_id is None:
            messagebox.showerror(
                "Invalid Costume ID",
                "Costume ID must be a whole number or blank.",
                parent=self.details_window.window,
            )
            return

        self.db_manager.add_pokemon_background_link(self.pokemon_id, selected_id, costume_id)
        self.refresh()

    def _create_background_and_link(self):
        name = self.create_entries["name"].get().strip()
        location = self.create_entries["location"].get().strip() or None
        image_url = self.create_entries["image_url"].get().strip() or None
        date_value = self.create_entries["date"].get().strip() or None
        costume_raw = self.create_entries["costume_id"].get().strip()
        costume_id = self._parse_optional_int(costume_raw)

        if not name:
            messagebox.showerror(
                "Missing Name",
                "Background name is required.",
                parent=self.details_window.window,
            )
            return
        if costume_raw and costume_id is None:
            messagebox.showerror(
                "Invalid Costume ID",
                "Costume ID must be a whole number or blank.",
                parent=self.details_window.window,
            )
            return

        background_id = self.db_manager.add_background(name, location, image_url, date_value)
        self.db_manager.add_pokemon_background_link(self.pokemon_id, background_id, costume_id)

        for entry in self.create_entries.values():
            entry.delete(0, tk.END)

        self._update_preview(self.create_preview_label, "")
        self.refresh()

    def _save_link_row(self, link_row_id, bg_var, costume_entry, field_entries):
        background_id = self._parse_selected_background_id(bg_var.get())
        if background_id is None:
            messagebox.showerror(
                "Missing Background",
                "Select a background.",
                parent=self.details_window.window,
            )
            return

        costume_raw = costume_entry.get().strip()
        costume_id = self._parse_optional_int(costume_raw)
        if costume_raw and costume_id is None:
            messagebox.showerror(
                "Invalid Costume ID",
                "Costume ID must be a whole number or blank.",
                parent=self.details_window.window,
            )
            return

        name = field_entries["name"].get().strip()
        location = field_entries["location"].get().strip() or None
        image_url = field_entries["image_url"].get().strip() or None
        date_value = field_entries["date"].get().strip() or None
        if not name:
            messagebox.showerror(
                "Missing Name",
                "Background name is required.",
                parent=self.details_window.window,
            )
            return

        self.db_manager.update_background(
            background_id,
            name,
            location,
            image_url,
            date_value,
        )
        self.db_manager.update_pokemon_background_link(
            link_row_id,
            background_id,
            costume_id,
        )
        self.refresh()

    def _remove_link(self, link_row_id):
        if not messagebox.askyesno(
            "Remove Link",
            "Remove this Pokemon/background link?",
            parent=self.details_window.window,
        ):
            return
        self.db_manager.delete_pokemon_background_link(link_row_id)
        self.refresh()

    def _delete_background_global(self, bg_var):
        background_id = self._parse_selected_background_id(bg_var.get())
        if background_id is None:
            messagebox.showerror(
                "Missing Background",
                "Select a background.",
                parent=self.details_window.window,
            )
            return

        usage_count = self.db_manager.count_background_usage(background_id)
        confirmed = messagebox.askyesno(
            "Delete Background",
            (
                f"Delete background #{background_id} globally?\n\n"
                f"It is currently linked {usage_count} time(s). "
                "This removes all those links."
            ),
            parent=self.details_window.window,
        )
        if not confirmed:
            return

        self.db_manager.delete_background(background_id)
        self.refresh()

    def _download_background_image_to_local(self, image_url_entry, preview_label, background_id, background_name):
        current_value = image_url_entry.get().strip()
        url = current_value if current_value.startswith(("http://", "https://")) else ""

        if not url:
            url = simpledialog.askstring(
                "Download Background Image",
                "Enter remote image URL:",
                initialvalue=current_value or "",
                parent=self.details_window.window,
            )

        if not url:
            return

        if not url.startswith(("http://", "https://")):
            messagebox.showerror(
                "Invalid URL",
                "Image URL must start with http:// or https://",
                parent=self.details_window.window,
            )
            return

        try:
            response = requests.get(url, timeout=15)
            response.raise_for_status()
            image = Image.open(BytesIO(response.content)).convert("RGBA")
        except Exception as exc:
            messagebox.showerror(
                "Download Failed",
                f"Could not download/process image:\n{exc}",
                parent=self.details_window.window,
            )
            return

        relative_path = self._resolve_background_save_relative_path(
            image_url_entry.get().strip(),
            url,
            background_id,
            background_name,
        )
        absolute_path = os.path.join(
            self.details_window.relative_path_to_images,
            relative_path.lstrip("\\/"),
        )
        os.makedirs(os.path.dirname(absolute_path), exist_ok=True)

        try:
            image.save(absolute_path, "PNG")
        except Exception as exc:
            messagebox.showerror(
                "Save Failed",
                f"Could not save image:\n{exc}",
                parent=self.details_window.window,
            )
            return

        image_url_entry.delete(0, tk.END)
        image_url_entry.insert(0, relative_path)
        self._update_preview(preview_label, relative_path)

        messagebox.showinfo(
            "Image Saved",
            f"Background image saved to:\n{absolute_path}",
            parent=self.details_window.window,
        )

    def _resolve_background_save_relative_path(self, current_value, source_url, background_id, background_name):
        normalized_current = (current_value or "").strip()
        if normalized_current and not normalized_current.startswith(("http://", "https://")):
            return self._normalize_rel_path(normalized_current)

        if background_id is not None:
            return f"/images/backgrounds/background_{int(background_id)}.png"

        file_name = self._filename_from_url_or_name(source_url, background_name)
        return f"/images/backgrounds/{file_name}"

    @staticmethod
    def _filename_from_url_or_name(source_url, background_name):
        parsed = urlparse(source_url or "")
        basename = os.path.basename(parsed.path or "").strip()
        stem = os.path.splitext(basename)[0].strip()
        if stem:
            safe_stem = re.sub(r"[^a-zA-Z0-9_-]+", "_", stem).strip("_")
            if safe_stem:
                return f"{safe_stem}.png"

        name = (background_name or "").strip()
        safe_name = re.sub(r"[^a-zA-Z0-9_-]+", "_", name).strip("_")
        if safe_name:
            return f"{safe_name.lower()}.png"

        return "background_image.png"

    @staticmethod
    def _normalize_rel_path(path_value):
        normalized = (path_value or "").replace("\\", "/").lstrip("/")
        return f"/{normalized}"

    def _option_from_background_id(self, background_id):
        bg = self.background_by_id.get(background_id)
        if not bg:
            return str(background_id)
        name = bg["name"] or ""
        return f"{background_id}: {name}"

    def _update_preview(self, label, image_url):
        image = self._open_image(image_url)
        if image is None:
            image = Image.new("RGBA", (self.PREVIEW_SIZE, self.PREVIEW_SIZE), (190, 190, 190, 255))
        else:
            image = image.resize((self.PREVIEW_SIZE, self.PREVIEW_SIZE), Image.Resampling.LANCZOS)

        photo = ImageTk.PhotoImage(image)
        label.configure(image=photo)
        label.image = photo

    def _open_image(self, image_url):
        if not image_url:
            return None

        normalized = image_url.strip()
        if not normalized:
            return None

        if normalized.startswith(("http://", "https://")):
            return None

        absolute_path = os.path.join(
            self.details_window.relative_path_to_images,
            normalized.lstrip("\\/"),
        )
        if not os.path.exists(absolute_path):
            return None

        try:
            return Image.open(absolute_path).convert("RGBA")
        except Exception:
            return None

    @staticmethod
    def _parse_selected_background_id(value):
        if not value:
            return None
        prefix = value.split(":", 1)[0].strip()
        if prefix.isdigit():
            return int(prefix)
        return None

    @staticmethod
    def _parse_optional_int(value):
        if value is None:
            return None
        stripped = value.strip()
        if not stripped:
            return None
        if stripped.isdigit():
            return int(stripped)
        return None
