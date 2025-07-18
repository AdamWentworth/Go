"""Editor for the **max_pokemon** row in the Pokémon-details window."""

import os
from io import BytesIO
import tkinter as tk
from tkinter import messagebox, simpledialog
from PIL import Image, ImageTk
import requests


class PokemonMaxFrame(tk.Frame):
    # ───────────────────── static config ────────────────────────
    BOOL_FIELDS  = ("Dynamax", "Gigantamax")
    ENTRY_FIELDS = (
        "Dynamax Release Date",
        "Gigantamax Release Date",
        "Gigantamax Image URL",
        "Shiny Gigantamax Image URL",
    )
    IMG = 240  # file & preview size (px)

    # ─────────────────────────────────────────────────────────────
    def __init__(self, parent, pid, max_row, db, details_win):
        super().__init__(parent)

        self.pid  = int(pid)
        self.db   = db
        self.dw   = details_win
        self.widgets = {}         # label → widget/variable
        self.ready   = False

        self.shiny_icon = os.path.join(
            details_win.relative_path_to_images, "images", "shiny_icon.png"
        )

        if max_row is None:
            tk.Button(
                self,
                text="Create Max Pokemon entry",
                command=self._create_entry,
            ).pack(padx=20, pady=20)
        else:
            self._build_editor(max_row)

    # ─────────────────── DB helper ───────────────────────────────
    def _create_entry(self):
        self.db.insert_max_pokemon(self.pid)
        for w in self.winfo_children():
            w.destroy()
        self._build_editor(self.db.fetch_max_pokemon(self.pid))

    # ─────────────────── UI builder ──────────────────────────────
    def _build_editor(self, row):
        """
        ┌─────────────────────────────── LabelFrame “Max Info” ───────────────────────────────┐
        │   column-0                |         column-1          |          column-2           │
        │  (all labelled fields)    |   [Gigantamax preview]    |   [Shiny-Gigantamax preview]│
        └──────────────────────────────────────────────────────────────────────────────────────┘
        """
        ( _,
          dyn, giga,
          dyn_dt, giga_dt,
          g_img, sg_img) = row

        outer = tk.LabelFrame(self, text="Max Info", bd=2, relief=tk.GROOVE, padx=8, pady=8)
        outer.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)

        for c in (0, 1, 2):
            outer.columnconfigure(c, weight=1)

        # ── column-0 : fields frame ──────────────────────────────────────────────
        fields = tk.Frame(outer)
        fields.grid(row=0, column=0, sticky="nsew", padx=(0, 8))
        fields.columnconfigure(1, weight=1)

        # check-boxes
        for r, (lbl, val) in enumerate(zip(self.BOOL_FIELDS, (dyn, giga))):
            var = tk.IntVar(value=1 if val else 0)
            tk.Checkbutton(fields, text=lbl, variable=var)\
                .grid(row=r, column=0, columnspan=2, sticky="w", pady=2)
            self.widgets[lbl] = var

        row_start = len(self.BOOL_FIELDS)
        entries_values = (dyn_dt, giga_dt, g_img, sg_img)
        for i, (lbl, val) in enumerate(zip(self.ENTRY_FIELDS, entries_values), row_start):
            tk.Label(fields, text=f"{lbl}:").grid(row=i, column=0, sticky="e", padx=(0, 4), pady=1)
            ent = tk.Entry(fields)
            ent.insert(0, val or "")
            ent.grid(row=i, column=1, sticky="ew", pady=1)
            self.widgets[lbl] = ent

        # ── image columns ────────────────────────────────────────────────────────
        self._build_image_box(
            outer, col=1,
            title="Gigantamax",
            rel_url=g_img,
            shiny=False,
        )
        self._build_image_box(
            outer, col=2,
            title="Shiny Gigantamax",
            rel_url=sg_img,
            shiny=True,
        )

        self.ready = True

    # ─────────────────── image helper boxes ─────────────────────
    def _build_image_box(self, parent, col, title, rel_url, shiny):
        box = tk.LabelFrame(parent, text=title, bd=1, relief=tk.RIDGE)
        box.grid(row=0, column=col, rowspan=99, sticky="nsew", padx=4)

        lbl = tk.Label(box, relief="groove")
        lbl.pack(fill=tk.BOTH, expand=True, padx=2, pady=2)

        btn = tk.Button(
            box,
            text="Download image" if not shiny else "Download shiny",
            command=lambda s=shiny: self._download_image(s),
        )
        btn.pack(side=tk.BOTTOM, pady=4)

        if shiny:
            self.preview_shiny = lbl
        else:
            self.preview_normal = lbl

        self._load_preview(rel_url, lbl)

    def _load_preview(self, rel_url, lbl):
        if rel_url:
            abs_path = os.path.join(
                self.dw.relative_path_to_images, rel_url.lstrip("\\/")
            )
            img = Image.open(abs_path) if os.path.exists(abs_path) else None
        else:
            img = None

        if img is None:
            img = Image.new("RGBA", (self.IMG, self.IMG), (200, 200, 200, 255))

        tk_img = ImageTk.PhotoImage(img.resize((self.IMG, self.IMG)))
        lbl.configure(image=tk_img)
        lbl.image = tk_img

    # ─────────────────── download helper ────────────────────────
    def _download_image(self, shiny=False):
        url = simpledialog.askstring(
            "Download", f"Remote image URL{' (shiny)' if shiny else ''}:"
        )
        if not url:
            return
        try:
            rsp = requests.get(url, timeout=10)
            rsp.raise_for_status()
            img = Image.open(BytesIO(rsp.content)).convert("RGBA").resize(
                (self.IMG, self.IMG), Image.Resampling.LANCZOS
            )
            if shiny:
                img = self._overlay_shiny(img)

            key = "Shiny Gigantamax Image URL" if shiny else "Gigantamax Image URL"
            entry: tk.Entry = self.widgets[key]  # type: ignore[assignment]
            default_rel = f"/images/max/{'shiny_' if shiny else ''}gigantamax_{self.pid}.png"
            rel_path = entry.get().strip() or default_rel
            if not entry.get().strip():
                entry.insert(0, rel_path)

            abs_path = os.path.join(
                self.dw.relative_path_to_images, rel_path.lstrip("\\/")
            )
            os.makedirs(os.path.dirname(abs_path), exist_ok=True)
            img.save(abs_path)

            if shiny:
                self._load_preview(rel_path, self.preview_shiny)
            else:
                self._load_preview(rel_path, self.preview_normal)

            messagebox.showinfo("Saved", f"Image saved to\n{abs_path}", parent=self.dw.window)
            self.dw.react_to_image_update()

        except Exception as exc:
            messagebox.showerror("Error", str(exc), parent=self.dw.window)

    def _overlay_shiny(self, base):
        try:
            icon = Image.open(self.shiny_icon).convert("RGBA")
            base.paste(icon, (0, 0), icon)
            return base
        except Exception:
            return base

    # ─────────────────── public API ─────────────────────────────-
    def get_data(self):
        """Return a tuple for update_max_pokemon(), or **None** if no editor."""
        if not self.ready:
            return None
        return (
            self.widgets["Dynamax"].get(),
            self.widgets["Gigantamax"].get(),
            self.widgets["Dynamax Release Date"].get().strip() or None,
            self.widgets["Gigantamax Release Date"].get().strip() or None,
            self.widgets["Gigantamax Image URL"].get().strip() or None,
            self.widgets["Shiny Gigantamax Image URL"].get().strip() or None,
        )
