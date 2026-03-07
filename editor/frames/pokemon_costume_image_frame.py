# frames/pokemon_costume_image_frame.py
import os
from io import BytesIO
import tkinter as tk
from tkinter import messagebox, simpledialog, ttk

import requests
from PIL import Image, ImageTk

from utils.collection_utils import filter_costume_rows, format_costume_row_label, paginate_items


class PokemonCostumeImageFrame(tk.Frame):
    LABELS = [
        "Costume Name",
        "Shiny Available",
        "Date Available",
        "Date Shiny Available",
        "Image URL",
        "Shiny Image URL",
        "Female Image URL",
        "Shiny Female Image URL",
    ]

    PREVIEW = 120
    SAVE_SZ = 240
    PAGE_SIZE = 10
    FILTER_DELAY_MS = 180
    PREVIEW_LABELS = {
        "Image URL": "regular",
        "Shiny Image URL": "shiny",
        "Female Image URL": "female",
        "Shiny Female Image URL": "shiny_female",
    }

    def __init__(self, parent, pokemon_id, details_window):
        super().__init__(parent)

        self.pokemon_id = int(pokemon_id)
        self.details_window = details_window
        self.db_manager = details_window.db_manager

        script_dir = os.path.dirname(os.path.realpath(__file__))
        go_dir = os.path.normpath(os.path.join(script_dir, "../../"))
        self.img_root = os.path.join(go_dir, "assets")

        self.costumes = []
        self.costume_entries = {}
        self.preview_labels = {}
        self.page_index = 0
        self.total_pages = 1
        self.filter_after_id = None
        self.filter_var = tk.StringVar()
        self.has_new_row = False

        self._build_ui()
        self.refresh()

    def _build_ui(self):
        self.outer = tk.LabelFrame(self, text="Costumes", bd=2, relief=tk.GROOVE, padx=6, pady=6)
        self.outer.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        toolbar = tk.Frame(self.outer)
        toolbar.pack(fill=tk.X, pady=(0, 6))

        tk.Label(toolbar, text="Filter").pack(side=tk.LEFT, padx=(0, 4))
        self.filter_entry = ttk.Entry(toolbar, textvariable=self.filter_var, width=30)
        self.filter_entry.pack(side=tk.LEFT, padx=(0, 6))
        self.filter_entry.bind("<KeyRelease>", lambda _event: self._schedule_filter_refresh())

        tk.Button(toolbar, text="Clear", command=self._clear_filter).pack(side=tk.LEFT, padx=(0, 12))

        self.prev_button = tk.Button(toolbar, text="Previous", command=lambda: self._change_page(-1))
        self.prev_button.pack(side=tk.LEFT, padx=(0, 4))

        self.page_label = tk.Label(toolbar, text="Page 1 / 1")
        self.page_label.pack(side=tk.LEFT, padx=(0, 4))

        self.next_button = tk.Button(toolbar, text="Next", command=lambda: self._change_page(1))
        self.next_button.pack(side=tk.LEFT, padx=(0, 12))

        tk.Button(toolbar, text="Add Costume", command=self._add_costume).pack(side=tk.RIGHT)

        self.rows_container = tk.Frame(self.outer)
        self.rows_container.pack(fill=tk.BOTH, expand=True)

    def refresh(self, preserve_costume_id=None, preserve_page_index=None):
        def _do_refresh():
            if preserve_page_index is not None:
                self.page_index = preserve_page_index

            self.costumes = self.db_manager.fetch_pokemon_costumes(self.pokemon_id)
            filtered_costumes = filter_costume_rows(self.costumes, self.filter_var.get())

            if preserve_costume_id is not None:
                matching_index = next(
                    (index for index, row in enumerate(filtered_costumes) if str(row[0]) == str(preserve_costume_id)),
                    None,
                )
                if matching_index is not None:
                    self.page_index = matching_index // self.PAGE_SIZE

            self._render_rows(filtered_costumes)

        return self._run_with_preserved_viewport(_do_refresh)

    def _schedule_filter_refresh(self):
        if self.filter_after_id is not None:
            self.after_cancel(self.filter_after_id)
        self.filter_after_id = self.after(self.FILTER_DELAY_MS, self._apply_filter)

    def _apply_filter(self):
        self.filter_after_id = None
        self.page_index = 0
        self.refresh()

    def _clear_filter(self):
        if not self.filter_var.get():
            return
        self.filter_var.set("")
        self.page_index = 0
        self.refresh()

    def _change_page(self, delta):
        filtered_costumes = filter_costume_rows(self.costumes, self.filter_var.get())
        _page_items, page_index, _total_pages = paginate_items(
            filtered_costumes,
            self.page_index + delta,
            self.PAGE_SIZE,
        )
        if page_index == self.page_index:
            return
        self.page_index = page_index
        self.refresh()

    def _render_rows(self, filtered_costumes):
        for child in self.rows_container.winfo_children():
            child.destroy()

        self.costume_entries = {}
        self.preview_labels = {}

        page_costumes, self.page_index, self.total_pages = paginate_items(
            filtered_costumes,
            self.page_index,
            self.PAGE_SIZE,
        )
        self._update_pager_state(len(filtered_costumes))

        if self.has_new_row:
            self._create_costume_frame(self._blank_costume_row(), is_new=True)

        if not page_costumes and not self.has_new_row:
            empty_text = "No costumes match the current filter." if filtered_costumes != self.costumes else "No costumes yet."
            tk.Label(self.rows_container, text=empty_text).pack(anchor="w")
            return

        for costume in page_costumes:
            self._create_costume_frame(costume, is_new=False)

    def _update_pager_state(self, filtered_count):
        self.page_label.configure(text=f"Page {self.page_index + 1} / {self.total_pages} ({filtered_count} costumes)")
        self.prev_button.configure(state=tk.NORMAL if self.page_index > 0 else tk.DISABLED)
        self.next_button.configure(state=tk.NORMAL if self.page_index < self.total_pages - 1 else tk.DISABLED)

    def _blank_costume_row(self):
        return ["new", self.pokemon_id, "", "", "", "", "", "", "", ""]

    def _create_costume_frame(self, costume, *, is_new):
        costume_id = "new" if is_new else costume[0]
        title = "New Costume" if is_new else format_costume_row_label(costume)

        frame = tk.LabelFrame(self.rows_container, text=title, bd=2, relief=tk.GROOVE)
        frame.pack(side=tk.TOP, fill=tk.X, padx=5, pady=5)
        frame.columnconfigure(1, weight=1)

        for index, label_text in enumerate(self.LABELS):
            tk.Label(frame, text=label_text).grid(row=index, column=0, sticky="e")
            entry = ttk.Entry(frame, width=60)
            entry.grid(row=index, column=1, sticky="ew")
            if not is_new:
                entry.insert(0, str(costume[index + 2]) if costume[index + 2] else "")
            self.costume_entries[(costume_id, label_text)] = entry

        preview_labels = self._make_image_controls(frame, costume_id)
        self.preview_labels[costume_id] = preview_labels
        self._refresh_costume_previews(costume_id)

        for entry_label in self.PREVIEW_LABELS:
            entry = self.costume_entries[(costume_id, entry_label)]
            entry.bind(
                "<FocusOut>",
                lambda _event, cid=costume_id: self._refresh_costume_previews(cid),
            )

        tk.Button(
            frame,
            text="Save Changes",
            command=lambda cid=costume_id: self._save_costume(cid),
        ).grid(row=8, column=1, sticky="ew")

        delete_text = "Discard New Costume" if is_new else "Delete Costume"
        tk.Button(
            frame,
            text=delete_text,
            command=lambda cid=costume_id: self._delete_costume(cid),
        ).grid(row=8, column=0)

    def _make_image_controls(self, frame, costume_id):
        labels = {}
        for column, preview_key in enumerate(("regular", "shiny", "female", "shiny_female"), start=2):
            label = tk.Label(frame)
            label.grid(row=0, column=column, rowspan=6, padx=6, pady=6)
            labels[preview_key] = label

        buttons = [
            ("Download Image", False, False, 2),
            ("Download Shiny Image", True, False, 3),
            ("Download Female Image", False, True, 4),
            ("Download Shiny Female Image", True, True, 5),
        ]
        for button_text, is_shiny, is_female, column in buttons:
            tk.Button(
                frame,
                text=button_text,
                command=lambda cid=costume_id, shiny=is_shiny, female=is_female: self._download_remote(
                    cid,
                    is_shiny=shiny,
                    is_female=female,
                ),
            ).grid(row=6, column=column, sticky="ew")

        return labels

    def _photo_from_relative_path(self, rel_path):
        preview_image = None
        if rel_path:
            absolute_path = os.path.join(self.img_root, rel_path.lstrip("\\/"))
            preview_image = self.details_window.preview_cache.get_resized_image(absolute_path, self.PREVIEW)
        if preview_image is None:
            preview_image = self.details_window.preview_cache.get_placeholder(self.PREVIEW)
        return ImageTk.PhotoImage(preview_image)

    def _refresh_costume_previews(self, costume_id):
        labels = self.preview_labels.get(costume_id)
        if not labels:
            return

        for entry_label, preview_key in self.PREVIEW_LABELS.items():
            entry = self.costume_entries.get((costume_id, entry_label))
            rel_path = entry.get().strip() if entry else ""
            photo = self._photo_from_relative_path(rel_path)
            target_label = labels[preview_key]
            target_label.configure(image=photo)
            target_label.image = photo

    def _download_remote(self, costume_id, *, is_shiny=False, is_female=False):
        url = simpledialog.askstring("Download Image", "Remote image URL (http...):")
        if not url:
            return

        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            image = Image.open(BytesIO(response.content)).resize((self.SAVE_SZ, self.SAVE_SZ))
            if is_shiny:
                image = self._overlay_shiny_icon(image) or image

            entry_label = self._entry_label_for_download(is_shiny, is_female)
            entry = self.costume_entries.get((costume_id, entry_label))
            if not entry or not entry.get().strip():
                messagebox.showerror(
                    "Missing Path",
                    f"Fill the '{entry_label}' field before downloading.",
                    parent=self.details_window.window,
                )
                return

            rel_path = entry.get().strip()
            absolute_path = os.path.join(self.img_root, rel_path.lstrip("\\/"))
            os.makedirs(os.path.dirname(absolute_path), exist_ok=True)
            image.save(absolute_path)

            self.details_window.preview_cache.clear()
            self._refresh_costume_previews(costume_id)
            messagebox.showinfo("Saved", "Image saved and preview updated.", parent=self.details_window.window)
        except Exception as exc:
            messagebox.showerror("Error", f"Download failed: {exc}", parent=self.details_window.window)

    def _entry_label_for_download(self, is_shiny, is_female):
        if is_shiny and is_female:
            return "Shiny Female Image URL"
        if is_shiny:
            return "Shiny Image URL"
        if is_female:
            return "Female Image URL"
        return "Image URL"

    def _overlay_shiny_icon(self, base):
        try:
            icon = Image.open(os.path.join(self.img_root, "images", "shiny_icon.png")).convert("RGBA")
            output = Image.new("RGBA", base.size, (0, 0, 0, 0))
            output.paste(base, (0, 0))
            output.paste(icon, (0, 0), icon)
            return output
        except Exception:
            return None

    def _save_costume(self, costume_id):
        data = {}
        for label_text in self.LABELS:
            entry = self.costume_entries.get((costume_id, label_text))
            value = entry.get().strip() if entry else ""
            if label_text == "Shiny Available":
                value = 1 if value.lower() in ("1", "true") else 0 if value.lower() in ("0", "false") else None
            data[label_text] = value

        if costume_id == "new":
            new_id = self.db_manager.add_costume(self.pokemon_id, data)
            self.has_new_row = False
            self.refresh(preserve_costume_id=new_id, preserve_page_index=self.page_index)
        else:
            values = [data[label] for label in self.LABELS]
            self.db_manager.update_pokemon_costume(costume_id, values)
            self.refresh(preserve_costume_id=costume_id, preserve_page_index=self.page_index)

        messagebox.showinfo("Saved", "Costume saved.", parent=self.details_window.window)

    def _delete_costume(self, costume_id):
        if costume_id == "new":
            self.has_new_row = False
            self.refresh(preserve_page_index=self.page_index)
            return

        if not messagebox.askyesno("Delete", "Delete this costume?", parent=self.details_window.window):
            return

        self.db_manager.delete_costume(costume_id)
        self.refresh(preserve_page_index=self.page_index)

    def _add_costume(self):
        if self.has_new_row:
            return
        self.has_new_row = True
        self.refresh(preserve_page_index=self.page_index)

    def _run_with_preserved_viewport(self, callback):
        preserve = getattr(self.details_window, "preserve_scroll_position", None)
        if callable(preserve):
            return preserve(callback)
        return callback()
