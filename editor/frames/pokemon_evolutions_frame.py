# frames/pokemon_evolutions_frame.py
import tkinter as tk
from tkinter import ttk


class PokemonEvolutionsFrame(tk.Frame):
    """
    Stacked evolution editor:
        • Top:  “Evolves from / Evolves to” list & controls
        • Bottom: Detail fields for the selected evolution
    All DB writes happen through `save_evolutions()`.
    """

    def __init__(self, parent, db_manager, pokemon_id, evolutions):
        super().__init__(parent)

        self.db = db_manager
        self.pid = int(pokemon_id)
        self.evolutions = evolutions

        self.pending_add = []
        self.pending_remove = []

        self.current_evolution_id = None
        self.detail_entries = {}

        self._build()

    # ──────────────────────────────────────────────────────────────
    # GUI builder
    # ──────────────────────────────────────────────────────────────
    def _build(self):
        outer = tk.LabelFrame(self, text="Evolutions", padx=10, pady=10)
        outer.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        # —— top area (list & controls) ————————————————
        self._build_list_area(outer)

        # —— bottom area (detail editor) ————————————————
        self.detail_frame = tk.Frame(outer)
        self.detail_frame.pack(side=tk.TOP, fill=tk.BOTH, expand=True, pady=(10, 0))

        # show first evolution (if any)
        first_id = self.evolutions["evolves_to"][0][0] if self.evolutions["evolves_to"] else None
        if first_id:
            self._load_details(first_id)

    def _build_list_area(self, parent):
        all_pokemon = self.db.fetch_all_pokemon_sorted()

        list_area = tk.Frame(parent)
        list_area.pack(side=tk.TOP, fill=tk.X, expand=False)

        # Evolves-from label
        from_lbl_var = tk.StringVar()
        tk.Label(list_area, textvariable=from_lbl_var).grid(row=0, column=0, columnspan=3, sticky="w")

        if self.evolutions["evolves_from"]:
            fid, fname = self.evolutions["evolves_from"][0]
            from_lbl_var.set(f"Evolves From: {fname} (ID {fid})")
        else:
            from_lbl_var.set("Evolves From: —")

        # Listbox for evolves-to
        tk.Label(list_area, text="Evolves To:").grid(row=1, column=0, sticky="nw")
        self.to_list = tk.Listbox(list_area, height=4)
        self.to_list.grid(row=1, column=1, sticky="nsew")
        list_area.rowconfigure(1, weight=1)
        list_area.columnconfigure(1, weight=1)

        yscroll = tk.Scrollbar(list_area, orient="vertical", command=self.to_list.yview)
        yscroll.grid(row=1, column=2, sticky="ns")
        self.to_list.configure(yscrollcommand=yscroll.set)

        for tid, tname in self.evolutions["evolves_to"]:
            self.to_list.insert(tk.END, f"{tid}: {tname}")

        self.to_list.bind("<<ListboxSelect>>", self._on_select)

        # Add / Remove controls
        self.new_to_var = tk.StringVar()
        ttk.Combobox(list_area, textvariable=self.new_to_var, values=all_pokemon)\
            .grid(row=2, column=1, sticky="ew", pady=2)

        tk.Button(list_area, text="Add", command=self._add)\
            .grid(row=2, column=2, sticky="w", padx=4)

        tk.Button(list_area, text="Remove", command=self._remove_selected)\
            .grid(row=3, column=1, sticky="w", pady=2)

    # ──────────────────────────────────────────────────────────────
    # Detail editor helpers
    # ──────────────────────────────────────────────────────────────
    FIELD_ORDER = (
        "Evolution ID", "Evolves To",
        "Candies Needed", "Trade Discount",
        "Item ID", "Other",
    )

    def _load_details(self, evolves_to_id: int):
        """Populate lower editor with DB data for this evolves_to_id."""
        for w in self.detail_frame.winfo_children():
            w.destroy()
        self.detail_entries.clear()

        details = self.db.fetch_evolution_details_for_evolves_to(self.pid, evolves_to_id)
        if details:
            evo_id, ev_to, candies, trade, item, other = details[0]
        else:  # brand-new placeholder
            evo_id, ev_to, candies, trade, item, other = (None, evolves_to_id, "", "", "", "")

        values = (
            evo_id, ev_to,
            candies, trade,
            item, other,
        )
        self.current_evolution_id = evo_id

        for i, (label, val) in enumerate(zip(self.FIELD_ORDER, values)):
            tk.Label(self.detail_frame, text=f"{label}:").grid(row=i, column=0, sticky="e", padx=(0, 4), pady=2)
            ent = tk.Entry(self.detail_frame)
            ent.insert(0, "" if val is None else str(val))
            ent.grid(row=i, column=1, sticky="ew", pady=2)
            self.detail_frame.columnconfigure(1, weight=1)
            self.detail_entries[label] = ent

    # ──────────────────────────────────────────────────────────────
    # Listbox callbacks
    # ──────────────────────────────────────────────────────────────
    def _on_select(self, _evt):
        if not self.to_list.curselection():
            return
        txt = self.to_list.get(self.to_list.curselection())
        tgt_id = self._parse_id(txt)
        if tgt_id:
            self._load_details(tgt_id)

    # ──────────────────────────────────────────────────────────────
    # Add / Remove buttons
    # ──────────────────────────────────────────────────────────────
    def _add(self):
        txt = self.new_to_var.get()
        tgt_id = self._parse_id(txt)
        if tgt_id and tgt_id not in [self._parse_id(x) for x in self.to_list.get(0, tk.END)]:
            new_evo_id = self.db.add_evolves_to(self.pid, tgt_id)
            self.to_list.insert(tk.END, f"{new_evo_id}: {txt}")
            self.pending_add.append(tgt_id)
            self.to_list.selection_clear(0, tk.END)
            self.to_list.selection_set(tk.END)
            self._load_details(tgt_id)

    def _remove_selected(self):
        sel = self.to_list.curselection()
        if not sel:
            return
        idx = sel[0]
        txt = self.to_list.get(idx)
        tgt_id = self._parse_id(txt)
        if tgt_id:
            self.pending_remove.append(tgt_id)
            self.to_list.delete(idx)
            self.detail_entries.clear()
            for w in self.detail_frame.winfo_children():
                w.destroy()

    # ──────────────────────────────────────────────────────────────
    # Data persistence
    # ──────────────────────────────────────────────────────────────
    def save_evolutions(self):
        """Called by PokemonDetailsWindow.Save → commits list + detail edits."""
        # 1) add/remove links
        for tid in self.pending_add:
            self.db.add_evolves_to(self.pid, tid)
        for tid in self.pending_remove:
            self.db.remove_evolves_to(self.pid, tid)
        self.pending_add.clear()
        self.pending_remove.clear()

        # 2) commit detail edits for the currently shown evolution
        if not self.detail_entries:
            return

        try:
            evo_id = self._int_or_none(self.detail_entries["Evolution ID"].get())
            ev_to  = self._int_or_none(self.detail_entries["Evolves To"].get())
            candies = self._int_or_none(self.detail_entries["Candies Needed"].get())
            trade   = self._int_or_none(self.detail_entries["Trade Discount"].get())
            item    = self._int_or_none(self.detail_entries["Item ID"].get())
            other   = self.detail_entries["Other"].get().strip() or None

            if evo_id is None:
                # New row – insert then fetch its ID
                evo_id = self.db.add_evolves_to(self.pid, ev_to)

            self.db.update_evolution_details(
                evo_id, ev_to, candies, trade, item, other
            )
        except Exception as exc:
            tk.messagebox.showerror("Evolution Save Error", str(exc))

    # ──────────────────────────────────────────────────────────────
    # small helpers
    # ──────────────────────────────────────────────────────────────
    @staticmethod
    def _parse_id(text: str):
        try:
            return int(text.split(":")[0].strip())
        except (ValueError, IndexError):
            return None

    @staticmethod
    def _int_or_none(s: str):
        s = s.strip()
        return None if s == "" else int(s)
