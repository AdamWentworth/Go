import os
import re
from io import BytesIO
from urllib.parse import urlparse

import requests
import tkinter as tk
from PIL import Image, ImageTk
from tkinter import messagebox, simpledialog, ttk

from utils.collection_utils import (
    filter_background_rows,
    filter_costume_rows,
    format_costume_row_label,
    paginate_items,
)


class PokemonBackgroundFrame(tk.Frame):
    PREVIEW_SIZE = 132
    COSTUME_PREVIEW_SIZE = 72
    COSTUME_REFERENCE_PAGE_SIZE = 8
    LINK_PAGE_SIZE = 12
    FILTER_DELAY_MS = 180
    COSTUME_FILTER_DELAY_MS = 180
    PREVIEW_DELAY_MS = 150
    BACKGROUND_ORDER_OPTIONS = (
        "Background ID",
        "Date",
        "Location First",
        "Special First",
    )

    def __init__(self, parent, pokemon_id, db_manager, details_window):
        super().__init__(parent)

        self.pokemon_id = int(pokemon_id)
        self.db_manager = db_manager
        self.details_window = details_window

        self.all_backgrounds = []
        self.background_by_id = {}
        self.background_options = []
        self.all_costumes = []
        self.costume_by_id = {}
        self.all_link_rows = []
        self.link_page_index = 0
        self.link_total_pages = 1
        self.link_filter_var = tk.StringVar()
        self.link_filter_after_id = None
        self.background_order_var = tk.StringVar(value=self.BACKGROUND_ORDER_OPTIONS[0])
        self.costume_reference_page_index = 0
        self.costume_reference_total_pages = 1
        self.costume_reference_filter_var = tk.StringVar()
        self.costume_reference_filter_after_id = None
        self.preview_after_ids = {}
        self.costume_entry_refreshers = {}
        self.active_costume_entry = None

        self._setup_ui()
        self.refresh()

    def _setup_ui(self):
        self.outer = tk.LabelFrame(self, text="Backgrounds", padx=10, pady=10)
        self.outer.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        self._build_add_existing_section()
        self._build_create_background_section()
        self._build_costume_reference_section()
        self._build_link_controls()

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

        self.link_costume_preview_label = tk.Label(section)
        self.link_costume_preview_label.grid(row=0, column=5, padx=(8, 4), pady=2, sticky="w")
        self.link_costume_description_label = tk.Label(section, text="No costume link", anchor="w", justify=tk.LEFT)
        self.link_costume_description_label.grid(row=0, column=6, sticky="w")
        self._bind_costume_entry(
            self.link_costume_entry,
            self.link_costume_preview_label,
            self.link_costume_description_label,
        )

        tk.Button(section, text="Add Link", command=self._add_existing_link).grid(row=0, column=4, sticky="w")
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
            lambda _event: self._schedule_preview_refresh(
                self.create_entries["image_url"],
                self.create_preview_label,
            ),
        )
        self.create_entries["image_url"].bind(
            "<FocusOut>",
            lambda _event: self._update_preview(
                self.create_preview_label,
                self.create_entries["image_url"].get().strip(),
            ),
        )

        self.create_costume_preview_label = tk.Label(section)
        self.create_costume_preview_label.grid(row=0, column=5, rowspan=3, padx=(8, 4), pady=2, sticky="n")
        self.create_costume_description_label = tk.Label(
            section,
            text="No costume link",
            anchor="w",
            justify=tk.LEFT,
            wraplength=180,
        )
        self.create_costume_description_label.grid(row=3, column=5, rowspan=2, sticky="nw", padx=(8, 0))
        self._bind_costume_entry(
            self.create_entries["costume_id"],
            self.create_costume_preview_label,
            self.create_costume_description_label,
        )

        section.columnconfigure(1, weight=1)

    def _build_costume_reference_section(self):
        section = tk.LabelFrame(self.outer, text="Costume Reference", padx=8, pady=8)
        section.pack(fill=tk.X, expand=False, pady=(8, 0))

        toolbar = tk.Frame(section)
        toolbar.pack(fill=tk.X, pady=(0, 6))

        tk.Label(toolbar, text="Filter Costumes").pack(side=tk.LEFT, padx=(0, 4))
        self.costume_reference_filter_entry = ttk.Entry(
            toolbar,
            textvariable=self.costume_reference_filter_var,
            width=28,
        )
        self.costume_reference_filter_entry.pack(side=tk.LEFT, padx=(0, 6))
        self.costume_reference_filter_entry.bind(
            "<KeyRelease>",
            lambda _event: self._schedule_costume_reference_filter_refresh(),
        )

        tk.Button(toolbar, text="Clear", command=self._clear_costume_reference_filter).pack(side=tk.LEFT, padx=(0, 12))

        self.prev_costume_reference_button = tk.Button(
            toolbar,
            text="Previous",
            command=lambda: self._change_costume_reference_page(-1),
        )
        self.prev_costume_reference_button.pack(side=tk.LEFT, padx=(0, 4))

        self.costume_reference_page_label = tk.Label(toolbar, text="Page 1 / 1")
        self.costume_reference_page_label.pack(side=tk.LEFT, padx=(0, 4))

        self.next_costume_reference_button = tk.Button(
            toolbar,
            text="Next",
            command=lambda: self._change_costume_reference_page(1),
        )
        self.next_costume_reference_button.pack(side=tk.LEFT)

        self.costume_reference_status_label = tk.Label(
            section,
            text="Click a costume card to fill the focused Costume ID field, or copy the ID if none is focused.",
            anchor="w",
            justify=tk.LEFT,
        )
        self.costume_reference_status_label.pack(fill=tk.X, pady=(0, 6))

        self.costume_reference_cards_container = tk.Frame(section)
        self.costume_reference_cards_container.pack(fill=tk.X, expand=False)

    def _build_link_controls(self):
        controls = tk.Frame(self.outer)
        controls.pack(fill=tk.X, pady=(8, 0))

        tk.Label(controls, text="Order Backgrounds").pack(side=tk.LEFT, padx=(0, 4))
        self.background_order_combo = ttk.Combobox(
            controls,
            textvariable=self.background_order_var,
            state="readonly",
            width=18,
            values=self.BACKGROUND_ORDER_OPTIONS,
        )
        self.background_order_combo.pack(side=tk.LEFT, padx=(0, 12))
        self.background_order_combo.bind("<<ComboboxSelected>>", lambda _event: self._on_background_order_changed())

        tk.Label(controls, text="Filter Links").pack(side=tk.LEFT, padx=(0, 4))
        self.link_filter_entry = ttk.Entry(controls, textvariable=self.link_filter_var, width=30)
        self.link_filter_entry.pack(side=tk.LEFT, padx=(0, 6))
        self.link_filter_entry.bind("<KeyRelease>", lambda _event: self._schedule_link_filter_refresh())

        tk.Button(controls, text="Clear", command=self._clear_link_filter).pack(side=tk.LEFT, padx=(0, 12))

        self.prev_links_button = tk.Button(controls, text="Previous", command=lambda: self._change_link_page(-1))
        self.prev_links_button.pack(side=tk.LEFT, padx=(0, 4))

        self.link_page_label = tk.Label(controls, text="Page 1 / 1")
        self.link_page_label.pack(side=tk.LEFT, padx=(0, 4))

        self.next_links_button = tk.Button(controls, text="Next", command=lambda: self._change_link_page(1))
        self.next_links_button.pack(side=tk.LEFT)

    def refresh(self, preserve_link_row_id=None, preserve_page_index=None):
        def _do_refresh():
            if preserve_page_index is not None:
                self.link_page_index = preserve_page_index

            self._refresh_background_cache()
            self._refresh_costume_cache()
            self._refresh_background_dropdown()
            self._render_costume_reference_cards()
            if hasattr(self, "link_costume_entry"):
                self._refresh_bound_costume_entry(self.link_costume_entry)
            if getattr(self, "create_entries", None):
                self._refresh_bound_costume_entry(self.create_entries["costume_id"])
            self.all_link_rows = self.db_manager.fetch_pokemon_background_rows(self.pokemon_id)
            filtered_rows = self._sort_link_rows(
                filter_background_rows(self.all_link_rows, self.link_filter_var.get())
            )

            if preserve_link_row_id is not None:
                matching_index = next(
                    (index for index, row in enumerate(filtered_rows) if int(row[0]) == int(preserve_link_row_id)),
                    None,
                )
                if matching_index is not None:
                    self.link_page_index = matching_index // self.LINK_PAGE_SIZE

            self._render_link_rows(filtered_rows)

        return self._run_with_preserved_viewport(_do_refresh)

    def _refresh_background_cache(self):
        self.all_backgrounds = self._sort_background_records(self.db_manager.fetch_all_backgrounds())
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

    def _refresh_costume_cache(self):
        self.all_costumes = self.db_manager.fetch_pokemon_costumes(self.pokemon_id)
        self.costume_by_id = {
            int(row[0]): row
            for row in self.all_costumes
            if str(row[0]).isdigit()
        }

    def _refresh_background_dropdown(self):
        self.link_background_combo["values"] = self.background_options
        if self.background_options and self.link_background_var.get() not in self.background_options:
            self.link_background_var.set(self.background_options[0])

    def _on_background_order_changed(self):
        self.link_page_index = 0
        self._render_current_link_page_preserving_viewport()

    def _schedule_link_filter_refresh(self):
        if self.link_filter_after_id is not None:
            self.after_cancel(self.link_filter_after_id)
        self.link_filter_after_id = self.after(self.FILTER_DELAY_MS, self._apply_link_filter)

    def _apply_link_filter(self):
        self.link_filter_after_id = None
        self.link_page_index = 0
        self._render_current_link_page_preserving_viewport()

    def _clear_link_filter(self):
        if not self.link_filter_var.get():
            return
        self.link_filter_var.set("")
        self.link_page_index = 0
        self._render_current_link_page_preserving_viewport()

    def _change_link_page(self, delta):
        filtered_rows = self._sort_link_rows(
            filter_background_rows(self.all_link_rows, self.link_filter_var.get())
        )
        _page_rows, page_index, _total_pages = paginate_items(
            filtered_rows,
            self.link_page_index + delta,
            self.LINK_PAGE_SIZE,
        )
        if page_index == self.link_page_index:
            return
        self.link_page_index = page_index
        self._render_current_link_page_preserving_viewport()

    def _render_current_link_page_preserving_viewport(self):
        return self._run_with_preserved_viewport(self._render_current_link_page)

    def _render_current_link_page(self):
        filtered_rows = self._sort_link_rows(
            filter_background_rows(self.all_link_rows, self.link_filter_var.get())
        )
        self._render_link_rows(filtered_rows)

    def _schedule_costume_reference_filter_refresh(self):
        if self.costume_reference_filter_after_id is not None:
            self.after_cancel(self.costume_reference_filter_after_id)
        self.costume_reference_filter_after_id = self.after(
            self.COSTUME_FILTER_DELAY_MS,
            self._apply_costume_reference_filter,
        )

    def _apply_costume_reference_filter(self):
        self.costume_reference_filter_after_id = None
        self.costume_reference_page_index = 0
        self._render_costume_reference_cards()

    def _clear_costume_reference_filter(self):
        if not self.costume_reference_filter_var.get():
            return
        self.costume_reference_filter_var.set("")
        self.costume_reference_page_index = 0
        self._render_costume_reference_cards()

    def _change_costume_reference_page(self, delta):
        filtered_costumes = filter_costume_rows(self.all_costumes, self.costume_reference_filter_var.get())
        _page_items, page_index, _total_pages = paginate_items(
            filtered_costumes,
            self.costume_reference_page_index + delta,
            self.COSTUME_REFERENCE_PAGE_SIZE,
        )
        if page_index == self.costume_reference_page_index:
            return
        self.costume_reference_page_index = page_index
        self._render_costume_reference_cards()

    def _render_costume_reference_cards(self):
        for child in self.costume_reference_cards_container.winfo_children():
            child.destroy()

        filtered_costumes = filter_costume_rows(self.all_costumes, self.costume_reference_filter_var.get())
        page_costumes, self.costume_reference_page_index, self.costume_reference_total_pages = paginate_items(
            filtered_costumes,
            self.costume_reference_page_index,
            self.COSTUME_REFERENCE_PAGE_SIZE,
        )
        self._update_costume_reference_pager_state(len(filtered_costumes))

        if not page_costumes:
            empty_text = "No costumes match the current filter." if filtered_costumes != self.all_costumes else "No costumes available for this Pokemon."
            tk.Label(self.costume_reference_cards_container, text=empty_text).pack(anchor="w")
            return

        for column in range(4):
            self.costume_reference_cards_container.columnconfigure(column, weight=1)

        for index, costume_row in enumerate(page_costumes):
            self._create_costume_reference_card(costume_row, row=index // 4, column=index % 4)

    def _update_costume_reference_pager_state(self, filtered_count):
        self.costume_reference_page_label.configure(
            text=f"Page {self.costume_reference_page_index + 1} / {self.costume_reference_total_pages} ({filtered_count} costumes)"
        )
        self.prev_costume_reference_button.configure(
            state=tk.NORMAL if self.costume_reference_page_index > 0 else tk.DISABLED
        )
        self.next_costume_reference_button.configure(
            state=tk.NORMAL if self.costume_reference_page_index < self.costume_reference_total_pages - 1 else tk.DISABLED
        )

    def _create_costume_reference_card(self, costume_row, row, column):
        card = tk.LabelFrame(
            self.costume_reference_cards_container,
            text=format_costume_row_label(costume_row),
            padx=6,
            pady=6,
        )
        card.grid(row=row, column=column, sticky="nsew", padx=4, pady=4)

        preview_frame = tk.Frame(card)
        preview_frame.pack(fill=tk.X, pady=(0, 4))

        preview_paths = self._get_costume_preview_paths(costume_row)
        if not preview_paths:
            preview_paths = [None]

        for preview_path in preview_paths[:2]:
            preview_label = tk.Label(preview_frame)
            preview_label.pack(side=tk.LEFT, padx=(0, 4))
            self._set_preview_label_image(preview_label, preview_path, self.COSTUME_PREVIEW_SIZE)

        tk.Button(
            card,
            text="Use ID",
            command=lambda costume_id=costume_row[0]: self._populate_active_costume_entry(costume_id),
        ).pack(anchor="w")

    def _render_link_rows(self, filtered_rows):
        self._clear_destroyed_link_row_state()
        for child in self.links_container.winfo_children():
            child.destroy()
        self._clear_destroyed_link_row_state()

        page_rows, self.link_page_index, self.link_total_pages = paginate_items(
            filtered_rows,
            self.link_page_index,
            self.LINK_PAGE_SIZE,
        )
        self._update_link_pager_state(len(filtered_rows))

        if not page_rows:
            empty_text = "No background links match the current filter." if filtered_rows != self.all_link_rows else "No backgrounds linked to this Pokemon yet."
            tk.Label(self.links_container, text=empty_text).pack(anchor="w")
            return

        for row in page_rows:
            self._create_link_row(row)

    def _sort_background_records(self, background_rows):
        return sorted(background_rows, key=self._background_sort_key_for_record)

    def _sort_link_rows(self, link_rows):
        return sorted(link_rows, key=self._background_sort_key_for_link_row)

    def _background_sort_key_for_record(self, background_row):
        background_id = int(background_row[0])
        background_meta = {
            "background_id": background_id,
            "name": background_row[1],
            "location": background_row[2],
            "image_url": background_row[3],
            "date": background_row[4],
        }
        return self._background_sort_key(background_meta)

    def _background_sort_key_for_link_row(self, link_row):
        background_meta = self.background_by_id.get(link_row[2])
        if background_meta is None:
            background_meta = {
                "background_id": int(link_row[2]),
                "name": link_row[4],
                "location": link_row[5],
                "image_url": link_row[6],
                "date": link_row[7],
            }
        return self._background_sort_key(background_meta)

    def _background_sort_key(self, background_meta):
        background_id = int(background_meta["background_id"])
        date_value = (background_meta.get("date") or "").strip() or "9999-12-31"
        is_location_specific = self._is_location_specific_background(background_meta)
        order_mode = self.background_order_var.get()
        if order_mode == "Date":
            return (date_value, background_id)
        if order_mode == "Location First":
            return (0 if is_location_specific else 1, date_value, background_id)
        if order_mode == "Special First":
            return (0 if not is_location_specific else 1, date_value, background_id)
        return (background_id,)

    @staticmethod
    def _is_location_specific_background(background_meta):
        image_url = (background_meta.get("image_url") or "").lower()
        location = (background_meta.get("location") or "").strip()
        if "/images/backgrounds/location_" in image_url:
            return True
        return bool(location)

    def _update_link_pager_state(self, filtered_count):
        self.link_page_label.configure(text=f"Page {self.link_page_index + 1} / {self.link_total_pages} ({filtered_count} links)")
        self.prev_links_button.configure(state=tk.NORMAL if self.link_page_index > 0 else tk.DISABLED)
        self.next_links_button.configure(state=tk.NORMAL if self.link_page_index < self.link_total_pages - 1 else tk.DISABLED)

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

        costume_preview_label = tk.Label(frame)
        costume_preview_label.grid(row=0, column=5, rowspan=2, padx=(8, 4), pady=2, sticky="n")
        costume_description_label = tk.Label(
            frame,
            text="No costume link",
            anchor="w",
            justify=tk.LEFT,
            wraplength=160,
        )
        costume_description_label.grid(row=2, column=5, rowspan=2, sticky="nw", padx=(8, 0))
        self._bind_costume_entry(
            costume_entry,
            costume_preview_label,
            costume_description_label,
        )

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
            lambda _event: self._schedule_preview_refresh(
                field_entries["image_url"],
                preview_label,
            ),
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
            command=lambda: self._save_link_row(link_row_id, bg_var, costume_entry, field_entries),
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
            messagebox.showerror("Missing Background", "Select a background to link.", parent=self.details_window.window)
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
        self.link_costume_entry.delete(0, tk.END)
        self.refresh(preserve_page_index=self.link_page_index)

    def _create_background_and_link(self):
        name = self.create_entries["name"].get().strip()
        location = self.create_entries["location"].get().strip() or None
        image_url = self.create_entries["image_url"].get().strip() or None
        date_value = self.create_entries["date"].get().strip() or None
        costume_raw = self.create_entries["costume_id"].get().strip()
        costume_id = self._parse_optional_int(costume_raw)

        if not name:
            messagebox.showerror("Missing Name", "Background name is required.", parent=self.details_window.window)
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
        self.refresh(preserve_page_index=self.link_page_index)

    def _save_link_row(self, link_row_id, bg_var, costume_entry, field_entries):
        background_id = self._parse_selected_background_id(bg_var.get())
        if background_id is None:
            messagebox.showerror("Missing Background", "Select a background.", parent=self.details_window.window)
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
            messagebox.showerror("Missing Name", "Background name is required.", parent=self.details_window.window)
            return

        self.db_manager.update_background(background_id, name, location, image_url, date_value)
        self.db_manager.update_pokemon_background_link(link_row_id, background_id, costume_id)
        self.refresh(preserve_link_row_id=link_row_id, preserve_page_index=self.link_page_index)

    def _remove_link(self, link_row_id):
        if not messagebox.askyesno("Remove Link", "Remove this Pokemon/background link?", parent=self.details_window.window):
            return
        self.db_manager.delete_pokemon_background_link(link_row_id)
        self.refresh(preserve_page_index=self.link_page_index)

    def _delete_background_global(self, bg_var):
        background_id = self._parse_selected_background_id(bg_var.get())
        if background_id is None:
            messagebox.showerror("Missing Background", "Select a background.", parent=self.details_window.window)
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
        self.refresh(preserve_page_index=self.link_page_index)

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

        self.details_window.preview_cache.clear()
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

    def _bind_costume_entry(self, entry_widget, preview_label, description_label):
        self.costume_entry_refreshers[entry_widget] = lambda: self._update_costume_entry_preview(
            entry_widget,
            preview_label,
            description_label,
        )
        entry_widget.bind(
            "<FocusIn>",
            lambda _event, widget=entry_widget: self._set_active_costume_entry(widget),
        )
        entry_widget.bind(
            "<KeyRelease>",
            lambda _event, widget=entry_widget: self._refresh_bound_costume_entry(widget),
        )
        entry_widget.bind(
            "<FocusOut>",
            lambda _event, widget=entry_widget: self._refresh_bound_costume_entry(widget),
        )
        self._refresh_bound_costume_entry(entry_widget)

    def _set_active_costume_entry(self, entry_widget):
        self.active_costume_entry = entry_widget
        if hasattr(self, "costume_reference_status_label"):
            self.costume_reference_status_label.configure(
                text="Active costume field selected. Click a costume card to fill this field."
            )

    def _refresh_bound_costume_entry(self, entry_widget):
        refresher = self.costume_entry_refreshers.get(entry_widget)
        if refresher is not None:
            refresher()

    def _update_costume_entry_preview(self, entry_widget, preview_label, description_label):
        if not self._widget_exists(entry_widget):
            return
        description_text, preview_path = self._describe_costume_id_value(entry_widget.get())
        if self._widget_exists(description_label):
            description_label.configure(text=description_text)
        if self._widget_exists(preview_label):
            self._set_preview_label_image(preview_label, preview_path, self.COSTUME_PREVIEW_SIZE)

    def _populate_active_costume_entry(self, costume_id):
        target = self.active_costume_entry
        if target is not None and (not hasattr(target, "winfo_exists") or target.winfo_exists()):
            target.delete(0, tk.END)
            target.insert(0, str(costume_id))
            if hasattr(target, "focus_set"):
                target.focus_set()
            if hasattr(target, "icursor"):
                target.icursor(tk.END)
            self._refresh_bound_costume_entry(target)
            if hasattr(self, "costume_reference_status_label"):
                self.costume_reference_status_label.configure(
                    text=f"Filled costume ID {costume_id} into the active field."
                )
            return

        try:
            self.details_window.window.clipboard_clear()
            self.details_window.window.clipboard_append(str(costume_id))
            status_text = f"Copied costume ID {costume_id} to clipboard."
        except Exception:
            status_text = f"Costume ID {costume_id}"

        if hasattr(self, "costume_reference_status_label"):
            self.costume_reference_status_label.configure(text=status_text)

    def _describe_costume_id_value(self, value):
        normalized = (value or "").strip()
        if not normalized:
            return "No costume link", self._get_base_pokemon_preview_path()

        costume_id = self._parse_optional_int(normalized)
        if costume_id is None:
            return f"Invalid costume ID: {normalized}", None

        costume_row = self._get_costume_record(costume_id)
        if costume_row is None:
            return f"Costume ID {costume_id} not found", None

        preview_paths = self._get_costume_preview_paths(costume_row)
        preview_path = preview_paths[0] if preview_paths else None
        return format_costume_row_label(costume_row), preview_path

    def _get_base_pokemon_preview_path(self):
        pokemon_data = getattr(self.details_window, "pokemon_data", None)
        if not pokemon_data or len(pokemon_data) <= 3:
            return None
        image_url = (pokemon_data[3] or "").strip()
        if not image_url or image_url.startswith(("http://", "https://")):
            return None
        return image_url

    def _get_costume_record(self, costume_id):
        if costume_id is None:
            return None
        return self.costume_by_id.get(int(costume_id))

    @staticmethod
    def _get_costume_preview_paths(costume_row):
        preview_paths = []
        for index in (6, 8, 7, 9):
            value = (costume_row[index] or "").strip()
            if value and value not in preview_paths:
                preview_paths.append(value)
        return preview_paths

    def _set_preview_label_image(self, label, image_url, size):
        preview_image = None
        if image_url:
            normalized = image_url.strip()
            if normalized and not normalized.startswith(("http://", "https://")):
                absolute_path = os.path.join(
                    self.details_window.relative_path_to_images,
                    normalized.lstrip("\\/"),
                )
                preview_image = self.details_window.preview_cache.get_resized_image(absolute_path, size)

        if preview_image is None:
            preview_image = self.details_window.preview_cache.get_placeholder(size)

        photo = ImageTk.PhotoImage(preview_image)
        label.configure(image=photo)
        label.image = photo

    def _schedule_preview_refresh(self, entry_widget, preview_label):
        after_id = self.preview_after_ids.get(entry_widget)
        if after_id is not None:
            self.after_cancel(after_id)
        self.preview_after_ids[entry_widget] = self.after(
            self.PREVIEW_DELAY_MS,
            lambda: self._flush_preview_refresh(entry_widget, preview_label),
        )

    def _flush_preview_refresh(self, entry_widget, preview_label):
        self.preview_after_ids.pop(entry_widget, None)
        if not self._widget_exists(entry_widget) or not self._widget_exists(preview_label):
            return
        self._update_preview(preview_label, entry_widget.get().strip())

    @staticmethod
    def _widget_exists(widget):
        if widget is None:
            return False
        if not hasattr(widget, "winfo_exists"):
            return True
        try:
            return bool(widget.winfo_exists())
        except Exception:
            return False

    def _clear_destroyed_link_row_state(self):
        stale_refreshers = [
            widget for widget in list(self.costume_entry_refreshers.keys())
            if not self._widget_exists(widget)
        ]
        for widget in stale_refreshers:
            self.costume_entry_refreshers.pop(widget, None)

        stale_previews = [
            widget for widget in list(self.preview_after_ids.keys())
            if not self._widget_exists(widget)
        ]
        for widget in stale_previews:
            after_id = self.preview_after_ids.pop(widget, None)
            if after_id is not None:
                try:
                    self.after_cancel(after_id)
                except Exception:
                    pass

        if not self._widget_exists(self.active_costume_entry):
            self.active_costume_entry = None

    def _update_preview(self, label, image_url):
        self._set_preview_label_image(label, image_url, self.PREVIEW_SIZE)

    def _option_from_background_id(self, background_id):
        background = self.background_by_id.get(background_id)
        if not background:
            return str(background_id)
        name = background["name"] or ""
        return f"{background_id}: {name}"

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

    def _run_with_preserved_viewport(self, callback):
        preserve = getattr(self.details_window, "preserve_scroll_position", None)
        if callable(preserve):
            return preserve(callback)
        return callback()
