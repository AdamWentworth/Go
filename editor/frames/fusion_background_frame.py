import os
import tkinter as tk
from tkinter import messagebox, ttk

from PIL import Image, ImageTk

from frames.pokemon_background_frame import PokemonBackgroundFrame


class FusionBackgroundFrame(tk.Frame):
    PREVIEW_SIZE = 80

    def __init__(
        self,
        parent,
        fusion_id,
        base_pokemon_id1,
        base_pokemon_id2,
        db_manager,
        details_window,
        base_pokemon_name1=None,
        base_pokemon_name2=None,
    ):
        super().__init__(parent)

        self.fusion_id = int(fusion_id)
        self.base_pokemon_id1 = int(base_pokemon_id1)
        self.base_pokemon_id2 = int(base_pokemon_id2)
        self.base_pokemon_name1 = base_pokemon_name1 or f"Pokemon #{self.base_pokemon_id1}"
        self.base_pokemon_name2 = base_pokemon_name2 or f"Pokemon #{self.base_pokemon_id2}"
        self.db_manager = db_manager
        self.details_window = details_window

        self.all_backgrounds = []
        self.background_by_id = {}
        self.background_options = []
        self.member_background_frames = []

        self._setup_ui()
        self.refresh_combo_rules()

    def _setup_ui(self):
        self.outer = tk.LabelFrame(self, text="Fusion Backgrounds", padx=10, pady=10)
        self.outer.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        self.notebook = ttk.Notebook(self.outer)
        self.notebook.pack(fill=tk.BOTH, expand=True)

        self._build_inherited_tab(
            self.base_pokemon_id1,
            self.base_pokemon_name1,
            "Inherited / Member 1",
        )
        self._build_inherited_tab(
            self.base_pokemon_id2,
            self.base_pokemon_name2,
            "Inherited / Member 2",
        )
        self._build_combo_tab()

        self.notebook.bind("<<NotebookTabChanged>>", self._on_tab_changed)

    def _build_inherited_tab(self, pokemon_id, pokemon_name, title):
        tab = ttk.Frame(self.notebook)
        self.notebook.add(tab, text=title)

        tk.Label(
            tab,
            text=f"Editing backgrounds inherited from: {pokemon_name} (ID {pokemon_id})",
            anchor="w",
        ).pack(fill=tk.X, padx=6, pady=(6, 0))

        member_frame = PokemonBackgroundFrame(
            tab,
            pokemon_id,
            self.db_manager,
            self.details_window,
        )
        member_frame.pack(fill=tk.BOTH, expand=True, padx=6, pady=6)
        self.member_background_frames.append(member_frame)

    def _build_combo_tab(self):
        self.combo_tab = ttk.Frame(self.notebook)
        self.notebook.add(self.combo_tab, text="Combo Rules")

        toolbar = tk.Frame(self.combo_tab)
        toolbar.pack(fill=tk.X, pady=(6, 0))
        tk.Button(
            toolbar,
            text="Refresh Combo Rules",
            command=self.refresh_combo_rules,
        ).pack(side=tk.LEFT)

        add_section = tk.LabelFrame(
            self.combo_tab,
            text="Create Combo Rule",
            padx=8,
            pady=8,
        )
        add_section.pack(fill=tk.X, pady=(8, 8))

        tk.Label(add_section, text="Member 1 Background").grid(row=0, column=0, sticky="e", padx=(0, 4), pady=1)
        self.add_member1_var = tk.StringVar()
        self.add_member1_combo = ttk.Combobox(
            add_section,
            textvariable=self.add_member1_var,
            state="readonly",
            width=34,
        )
        self.add_member1_combo.grid(row=0, column=1, sticky="ew", padx=(0, 8), pady=1)

        tk.Label(add_section, text="Member 2 Background").grid(row=1, column=0, sticky="e", padx=(0, 4), pady=1)
        self.add_member2_var = tk.StringVar()
        self.add_member2_combo = ttk.Combobox(
            add_section,
            textvariable=self.add_member2_var,
            state="readonly",
            width=34,
        )
        self.add_member2_combo.grid(row=1, column=1, sticky="ew", padx=(0, 8), pady=1)

        tk.Label(add_section, text="Combo Background").grid(row=2, column=0, sticky="e", padx=(0, 4), pady=1)
        self.add_combo_var = tk.StringVar()
        self.add_combo_combo = ttk.Combobox(
            add_section,
            textvariable=self.add_combo_var,
            state="readonly",
            width=34,
        )
        self.add_combo_combo.grid(row=2, column=1, sticky="ew", padx=(0, 8), pady=1)

        self.add_active_var = tk.BooleanVar(value=True)
        tk.Checkbutton(
            add_section,
            text="Active",
            variable=self.add_active_var,
        ).grid(row=0, column=2, sticky="w", padx=(0, 8), pady=1)

        tk.Label(add_section, text="Notes").grid(row=1, column=2, sticky="e", padx=(0, 4), pady=1)
        self.add_notes_entry = tk.Entry(add_section, width=28)
        self.add_notes_entry.grid(row=1, column=3, sticky="ew", pady=1)

        tk.Button(
            add_section,
            text="Add Combo Rule",
            command=self._add_combo_rule,
        ).grid(row=2, column=3, sticky="e", pady=1)

        add_section.columnconfigure(1, weight=1)
        add_section.columnconfigure(3, weight=1)

        self.rule_rows_container = tk.Frame(self.combo_tab)
        self.rule_rows_container.pack(fill=tk.BOTH, expand=True, pady=(0, 6))

    def _on_tab_changed(self, _event):
        current_tab = self.notebook.select()
        combo_tab_path = str(self.combo_tab)
        if current_tab == combo_tab_path:
            self.refresh_combo_rules()

    def refresh_combo_rules(self):
        self._refresh_background_cache()
        self._refresh_combo_dropdowns()
        self._render_combo_rows()

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

    def _refresh_combo_dropdowns(self):
        values = self.background_options
        self.add_member1_combo["values"] = values
        self.add_member2_combo["values"] = values
        self.add_combo_combo["values"] = values

        if values and self.add_member1_var.get() not in values:
            self.add_member1_var.set(values[0])
        if values and self.add_member2_var.get() not in values:
            self.add_member2_var.set(values[0])
        if values and self.add_combo_var.get() not in values:
            self.add_combo_var.set(values[0])

    def _render_combo_rows(self):
        for child in self.rule_rows_container.winfo_children():
            child.destroy()

        rows = self.db_manager.fetch_fusion_background_rule_rows(self.fusion_id)
        if not rows:
            tk.Label(
                self.rule_rows_container,
                text="No combo rules for this fusion yet.",
            ).pack(anchor="w")
            return

        for row in rows:
            self._create_combo_rule_row(row)

    def _create_combo_rule_row(self, row):
        (
            rule_id,
            _fusion_id,
            member1_background_id,
            _member1_background_name,
            _member1_background_image_url,
            member2_background_id,
            _member2_background_name,
            _member2_background_image_url,
            combo_background_id,
            _combo_background_name,
            _combo_background_image_url,
            is_active,
            notes,
        ) = row

        frame = tk.LabelFrame(
            self.rule_rows_container,
            text=f"Rule #{rule_id}",
            padx=8,
            pady=8,
        )
        frame.pack(fill=tk.X, expand=False, pady=(0, 8))

        tk.Label(frame, text="Member 1 Background").grid(row=0, column=0, sticky="e", padx=(0, 4), pady=1)
        member1_var = tk.StringVar(value=self._option_from_background_id(member1_background_id))
        member1_combo = ttk.Combobox(
            frame,
            textvariable=member1_var,
            values=self.background_options,
            state="readonly",
            width=34,
        )
        member1_combo.grid(row=0, column=1, sticky="ew", padx=(0, 8), pady=1)

        member1_preview = tk.Label(frame)
        member1_preview.grid(row=0, column=2, rowspan=2, padx=(0, 8), pady=2)

        tk.Label(frame, text="Member 2 Background").grid(row=1, column=0, sticky="e", padx=(0, 4), pady=1)
        member2_var = tk.StringVar(value=self._option_from_background_id(member2_background_id))
        member2_combo = ttk.Combobox(
            frame,
            textvariable=member2_var,
            values=self.background_options,
            state="readonly",
            width=34,
        )
        member2_combo.grid(row=1, column=1, sticky="ew", padx=(0, 8), pady=1)

        member2_preview = tk.Label(frame)
        member2_preview.grid(row=0, column=3, rowspan=2, padx=(0, 8), pady=2)

        tk.Label(frame, text="Combo Background").grid(row=2, column=0, sticky="e", padx=(0, 4), pady=1)
        combo_var = tk.StringVar(value=self._option_from_background_id(combo_background_id))
        combo_combo = ttk.Combobox(
            frame,
            textvariable=combo_var,
            values=self.background_options,
            state="readonly",
            width=34,
        )
        combo_combo.grid(row=2, column=1, sticky="ew", padx=(0, 8), pady=1)

        combo_preview = tk.Label(frame)
        combo_preview.grid(row=2, column=2, columnspan=2, padx=(0, 8), pady=2)

        active_var = tk.BooleanVar(value=bool(is_active))
        tk.Checkbutton(
            frame,
            text="Active",
            variable=active_var,
        ).grid(row=0, column=4, sticky="w", padx=(0, 8), pady=1)

        tk.Label(frame, text="Notes").grid(row=1, column=4, sticky="e", padx=(0, 4), pady=1)
        notes_entry = tk.Entry(frame, width=28)
        notes_entry.insert(0, "" if notes is None else str(notes))
        notes_entry.grid(row=1, column=5, sticky="ew", pady=1)

        button_row = tk.Frame(frame)
        button_row.grid(row=2, column=4, columnspan=2, sticky="e", pady=(4, 0))

        tk.Button(
            button_row,
            text="Save Rule",
            command=lambda: self._save_combo_rule_row(
                rule_id,
                member1_var,
                member2_var,
                combo_var,
                active_var,
                notes_entry,
            ),
        ).pack(side=tk.LEFT, padx=(0, 6))

        tk.Button(
            button_row,
            text="Delete Rule",
            command=lambda: self._delete_combo_rule(rule_id),
        ).pack(side=tk.LEFT)

        member1_combo.bind(
            "<<ComboboxSelected>>",
            lambda _event: self._update_preview_from_selection(member1_preview, member1_var.get()),
        )
        member2_combo.bind(
            "<<ComboboxSelected>>",
            lambda _event: self._update_preview_from_selection(member2_preview, member2_var.get()),
        )
        combo_combo.bind(
            "<<ComboboxSelected>>",
            lambda _event: self._update_preview_from_selection(combo_preview, combo_var.get()),
        )

        self._update_preview_from_selection(member1_preview, member1_var.get())
        self._update_preview_from_selection(member2_preview, member2_var.get())
        self._update_preview_from_selection(combo_preview, combo_var.get())

        frame.columnconfigure(1, weight=1)
        frame.columnconfigure(5, weight=1)

    def _add_combo_rule(self):
        member1_background_id = self._parse_selected_background_id(self.add_member1_var.get())
        member2_background_id = self._parse_selected_background_id(self.add_member2_var.get())
        combo_background_id = self._parse_selected_background_id(self.add_combo_var.get())

        if member1_background_id is None or member2_background_id is None or combo_background_id is None:
            messagebox.showerror(
                "Missing Background",
                "Select all three backgrounds for the combo rule.",
                parent=self.details_window.window,
            )
            return

        notes = self.add_notes_entry.get().strip() or None
        self.db_manager.add_fusion_background_rule(
            self.fusion_id,
            member1_background_id,
            member2_background_id,
            combo_background_id,
            1 if self.add_active_var.get() else 0,
            notes,
        )
        self.add_notes_entry.delete(0, tk.END)
        self.refresh_combo_rules()

    def _save_combo_rule_row(
        self,
        rule_id,
        member1_var,
        member2_var,
        combo_var,
        active_var,
        notes_entry,
    ):
        member1_background_id = self._parse_selected_background_id(member1_var.get())
        member2_background_id = self._parse_selected_background_id(member2_var.get())
        combo_background_id = self._parse_selected_background_id(combo_var.get())
        if member1_background_id is None or member2_background_id is None or combo_background_id is None:
            messagebox.showerror(
                "Missing Background",
                "Select all three backgrounds for the combo rule.",
                parent=self.details_window.window,
            )
            return

        notes = notes_entry.get().strip() or None
        self.db_manager.update_fusion_background_rule(
            rule_id,
            member1_background_id,
            member2_background_id,
            combo_background_id,
            1 if active_var.get() else 0,
            notes,
        )
        self.refresh_combo_rules()

    def _delete_combo_rule(self, rule_id):
        if not messagebox.askyesno(
            "Delete Combo Rule",
            f"Delete combo rule #{rule_id}?",
            parent=self.details_window.window,
        ):
            return

        self.db_manager.delete_fusion_background_rule(rule_id)
        self.refresh_combo_rules()

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

    def _update_preview_from_selection(self, label, option_value):
        background_id = self._parse_selected_background_id(option_value)
        image_url = None
        if background_id is not None:
            background = self.background_by_id.get(background_id)
            if background:
                image_url = background.get("image_url")
        self._update_preview(label, image_url)

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

        normalized = str(image_url).strip()
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
