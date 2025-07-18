# frames/pokemon_mega_frame.py
import os
from io import BytesIO
import tkinter as tk
from tkinter import filedialog, messagebox, simpledialog
from PIL import Image, ImageTk
import requests


class PokemonMegaFrame:
    """
    One-row mega editor laid out as:
        [labeled fields] | [Mega image] | [Shiny-Mega image]
    """

    IMG = 240  # image size (px)

    # ──────────────────────────────────────────────────────────────
    def __init__(self, parent, mega_id, pid, mega_data, details_win):
        self.mega_id   = mega_id
        self.pid       = pid
        self.dw        = details_win

        (
            self.cost,
            self.atk,
            self.defn,
            self.hp,
            self.img_url,
            self.shiny_url,
            self.sprite_url,
            self.primal,
            self.form,
            self.type1_id,
            self.type2_id,
        ) = mega_data

        # ── outer row frame ───────────────────────────────────────
        self.frame = tk.Frame(parent, bd=2, relief=tk.GROOVE, padx=6, pady=6)
        self.frame.pack(side=tk.TOP, fill=tk.X, expand=True, padx=5, pady=3)
        for c in (0, 1, 2):
            self.frame.columnconfigure(c, weight=1)

        # columns
        self._build_fields_col()
        self._build_image_col(col=1, shiny=False)
        self._build_image_col(col=2, shiny=True)

        # path to shiny icon
        root = os.path.normpath(
            os.path.join(os.path.dirname(__file__), "../../frontend/public/images")
        )
        self.shiny_icon_path = os.path.join(root, "shiny_icon.png")

        # preload
        self._load_image(self.img_url,   self.img_lbl)
        self._load_image(self.shiny_url, self.shiny_lbl)

    # ──────────────────────────────────────────────────────────
    # column 0  –  labeled editable fields
    # ──────────────────────────────────────────────────────────
    def _build_fields_col(self):
        col = tk.Frame(self.frame)
        col.grid(row=0, column=0, sticky="nsew", padx=4)

        # title
        tk.Label(col, text=f"Mega ID {self.mega_id}", font=("Arial", 10, "bold"))\
            .grid(row=0, column=0, columnspan=2, sticky="w", pady=(0, 4))
        col.columnconfigure(1, weight=1)

        self.entries = {}

        def add(r, label, value=""):
            tk.Label(col, text=f"{label}:").grid(row=r, column=0, sticky="e", padx=(0, 4), pady=1)
            ent = tk.Entry(col)
            ent.insert(0, "" if value is None else str(value))
            ent.grid(row=r, column=1, sticky="ew", pady=1)
            self.entries[label] = ent

        add(1, "Energy Cost", self.cost)
        add(2, "Attack",      self.atk)
        add(3, "Defense",     self.defn)
        add(4, "Stamina",     self.hp)
        add(5, "Primal",      self.primal)
        add(6, "Form",        self.form or "")
        add(7, "Type 1",      self._type_name(self.type1_id))
        add(8, "Type 2",      self._type_name(self.type2_id))

    def _type_name(self, tid):
        rev = {v: k for k, v in self.dw.db_manager.fetch_type_ids().items()}
        return rev.get(tid, "")

    # ──────────────────────────────────────────────────────────
    # columns 1 & 2  –  images + download buttons
    # ──────────────────────────────────────────────────────────
    def _build_image_col(self, *, col: int, shiny: bool):
        box = tk.Frame(self.frame)
        box.grid(row=0, column=col, sticky="nsew", padx=4)

        lbl = tk.Label(box)
        lbl.pack(fill=tk.BOTH, expand=True)
        btn = tk.Button(
            box,
            text="Download Shiny" if shiny else "Download Mega",
            command=lambda s=shiny: self._download_image(s),
        )
        btn.pack(side=tk.BOTTOM, pady=2)

        if shiny:
            self.shiny_lbl = lbl
        else:
            self.img_lbl = lbl

    def _load_image(self, url, label):
        if not label:
            return
        if url:
            fp = os.path.join(self.dw.relative_path_to_images, url.lstrip("\\/"))
            img = Image.open(fp) if os.path.exists(fp) else Image.new("RGB", (self.IMG, self.IMG), "grey")
        else:
            img = Image.new("RGB", (self.IMG, self.IMG), "grey")

        tk_img = ImageTk.PhotoImage(img.resize((self.IMG, self.IMG)))
        label.configure(image=tk_img)
        label.image = tk_img

    # ──────────────────────────────────────────────────────────
    # download / save helpers
    # ──────────────────────────────────────────────────────────
    def _download_image(self, shiny=False):
        url = simpledialog.askstring("Download Image", "Remote image URL:")
        if not url:
            return
        try:
            img = Image.open(BytesIO(requests.get(url).content)).resize((self.IMG, self.IMG))
            if shiny:
                img = self._overlay_shiny(img)

            rel_dir = "images/shiny_mega" if shiny else "images/mega"
            suffix  = f"_{self.entries['Form'].get().strip()}" if self.entries["Form"].get().strip() else ""
            fname   = ("shiny_" if shiny else "") + f"mega_{self.pid}{suffix}.png"
            abs_fp  = os.path.join(self.dw.relative_path_to_images, rel_dir, fname)
            os.makedirs(os.path.dirname(abs_fp), exist_ok=True)
            img.save(abs_fp)

            rel_path = "/" + os.path.join(rel_dir, fname).replace("\\", "/")
            if shiny:
                self.shiny_url = rel_path
                self._load_image(self.shiny_url, self.shiny_lbl)
            else:
                self.img_url = rel_path
                self._load_image(self.img_url, self.img_lbl)

            messagebox.showinfo("Saved", f"Image saved to:\n{abs_fp}", parent=self.dw.window)
            self.dw.react_to_image_update()
        except Exception as exc:
            messagebox.showerror("Error", str(exc), parent=self.dw.window)

    def _overlay_shiny(self, base):
        try:
            icon = Image.open(self.shiny_icon_path).convert("RGBA")
            out  = base.convert("RGBA")
            out.paste(icon, (0, 0), icon)
            return out
        except Exception:
            return base

    # ──────────────────────────────────────────────────────────
    # gather data for bulk-save
    # ──────────────────────────────────────────────────────────
    def get_mega_data(self):
        type_map = self.dw.db_manager.fetch_type_ids()
        t1 = type_map.get(self.entries["Type 1"].get().strip() or None)
        t2 = type_map.get(self.entries["Type 2"].get().strip() or None)

        return (
            self.entries["Energy Cost"].get() or None,
            self.entries["Attack"].get()      or None,
            self.entries["Defense"].get()     or None,
            self.entries["Stamina"].get()     or None,
            self.img_url   or None,
            self.shiny_url or None,
            self.sprite_url or None,
            self.entries["Primal"].get() or None,
            self.entries["Form"].get().strip() or None,
            t1, t2,
            self.mega_id,
        )
