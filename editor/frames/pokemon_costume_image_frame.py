# frames/pokemon_costume_image_frame.py
import os
from io import BytesIO
import tkinter as tk
from tkinter import ttk, filedialog, messagebox, simpledialog

import requests
from PIL import Image, ImageTk


class PokemonCostumeImageFrame(tk.Frame):
    """
    Costume editor — logic unchanged, UI widened & preview thumbs smaller.
    """

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

    PREVIEW = 120   # thumbnail size shown in UI (px)
    SAVE_SZ = 240   # size written to disk (px)

    # ──────────────────────────────────────────────────────────
    def __init__(self, parent, pokemon_id, details_window):
        super().__init__(parent)

        self.pokemon_id     = pokemon_id
        self.details_window = details_window
        self.db_manager     = details_window.db_manager

        script_dir = os.path.dirname(os.path.realpath(__file__))
        go_dir     = os.path.normpath(os.path.join(script_dir, "../../"))
        self.img_root = os.path.join(go_dir, "frontend", "public")

        self.costumes = self.db_manager.fetch_pokemon_costumes(pokemon_id)

        self.images           = {}  # cached PhotoImages
        self.costume_entries  = {}  # (cid,label) → ttk.Entry
        self.costume_frames   = []  # keep refs for later

        self._build_ui()
        self._load_costume_images()

    # ───────────────────────── UI BUILDERS ─────────────────────
    def _build_ui(self):
        for c in self.costumes:
            self._create_costume_frame(c, is_new=False)
        tk.Button(self, text="Add Costume", command=self._add_costume)\
          .pack(side=tk.TOP, pady=4)

    def _create_costume_frame(self, costume, *, is_new):
        cid   = "new" if is_new else costume[0]
        title = "New Costume" if is_new else f"Costume ID: {cid}"

        frame = tk.LabelFrame(self, text=title, bd=2, relief=tk.GROOVE)
        frame.pack(side=tk.TOP, fill=tk.X, padx=5, pady=5)
        frame.costume_id = cid
        frame.columnconfigure(1, weight=1)          # widen entry column

        # labelled fields
        for i, lbl in enumerate(self.LABELS):
            tk.Label(frame, text=lbl).grid(row=i, column=0, sticky="e")
            ent = ttk.Entry(frame, width=60)         # << wider >>
            ent.grid(row=i, column=1, sticky="ew")
            if not is_new:
                ent.insert(0, str(costume[i + 2]) if costume[i + 2] else "")
            self.costume_entries[(cid, lbl)] = ent

        # save / delete buttons
        tk.Button(frame, text="Save Changes",
                  command=lambda f=frame: self._save_costume(f))\
          .grid(row=8, column=1, sticky="ew")
        if not is_new:
            tk.Button(frame, text="Delete Costume",
                      command=lambda f=frame: self._delete_costume(f.costume_id))\
              .grid(row=8, column=0)

        # preview labels + DL buttons
        img_lbl, shiny_lbl, fem_lbl, shiny_fem_lbl = self._make_image_controls(frame)
        self.costume_frames.append(
            (frame, img_lbl, shiny_lbl, fem_lbl, shiny_fem_lbl, cid)
        )

    def _make_image_controls(self, f):
        lbls = [tk.Label(f) for _ in range(4)]
        for col, lbl in enumerate(lbls, start=2):
            lbl.grid(row=0, column=col, rowspan=6, padx=6, pady=6)

        buttons = [
            ("Download Image",                False, False, 2),
            ("Download Shiny Image",          True,  False, 3),
            ("Download Female Image",         False, True,  4),
            ("Download Shiny Female Image",   True,  True,  5),
        ]
        for txt, sh, fe, col in buttons:
            tk.Button(f, text=txt,
                      command=lambda fr=f, s=sh, e=fe:
                          self._download_remote(fr, is_shiny=s, is_female=e))\
              .grid(row=6, column=col, sticky="ew")

        return lbls  # unpacked later

    # ───────────────────────── IMAGE HELPERS ────────────────────
    def _open_local(self, rel):
        if not rel:
            return None
        path = os.path.join(self.img_root, rel.lstrip("\\/"))
        try:
            img = Image.open(path).resize((self.PREVIEW, self.PREVIEW))
            return ImageTk.PhotoImage(img)
        except IOError:
            return None

    def _placeholder(self):
        return ImageTk.PhotoImage(
            Image.new("RGB", (self.PREVIEW, self.PREVIEW), "grey")
        )

    def _load_costume_images(self):
        for fr, reg, sh, fem, shf, cid in self.costume_frames:
            if cid == "new":
                continue
            c = next((x for x in self.costumes if x[0] == cid), None)
            if not c:
                continue
            paths = c[6:10]
            for pth, lbl in zip(paths, (reg, sh, fem, shf)):
                img = self._open_local(pth) or self._placeholder()
                lbl.configure(image=img)
                lbl.image = img

    # ───────────────────────── BUTTON ACTIONS ──────────────────
    def _download_remote(self, frame, *, is_shiny=False, is_female=False):
        cid = frame.costume_id
        url = simpledialog.askstring("Download Image", "Remote image URL (http…):")
        if not url:
            return

        try:
            rsp = requests.get(url, timeout=10)
            rsp.raise_for_status()
            img = Image.open(BytesIO(rsp.content)).resize((self.SAVE_SZ, self.SAVE_SZ))
            if is_shiny:
                img = self._overlay_shiny_icon(img) or img

            key = (
                ("Shiny " if is_shiny else "") +
                ("Female " if is_female else "") +
                "Image URL"
            )
            ent = self.costume_entries.get((cid, key))
            if not ent or not ent.get().strip():
                messagebox.showerror("Missing Path",
                                     f"Fill the '{key}' field before downloading.")
                return
            rel = ent.get().strip()
            abs_p = os.path.join(self.img_root, rel.lstrip("\\/"))
            os.makedirs(os.path.dirname(abs_p), exist_ok=True)
            img.save(abs_p)

            # show thumbnail
            thumb = ImageTk.PhotoImage(img.resize((self.PREVIEW, self.PREVIEW)))
            for fr, reg, sh, fem, shf, c in self.costume_frames:
                if str(c) != str(cid):
                    continue
                tgt = shf if (is_shiny and is_female) else \
                      fem if (is_female and not is_shiny) else \
                      sh  if (is_shiny and not is_female) else reg
                tgt.configure(image=thumb)
                tgt.image = thumb
                break

            messagebox.showinfo("Saved", "Image saved & preview updated.",
                                parent=self.details_window.window)
        except Exception as e:
            messagebox.showerror("Error", f"Download failed: {e}",
                                 parent=self.details_window.window)

    def _overlay_shiny_icon(self, base):
        try:
            ico = Image.open(os.path.join(self.img_root, "images", "shiny_icon.png"))\
                      .convert("RGBA")
            out = Image.new("RGBA", base.size, (0, 0, 0, 0))
            out.paste(base, (0, 0))
            out.paste(ico, (0, 0), ico)
            return out
        except Exception:
            return None

    # ───────────────────────── CRUD HELPERS (logic same) ─────────
    def _save_costume(self, frame):
        cid = frame.costume_id
        data = {}
        for lbl in self.LABELS:
            w = self.costume_entries.get((cid, lbl))
            val = w.get().strip() if w else ""
            if lbl == "Shiny Available":
                val = 1 if val.lower() in ("1", "true") else 0 if val.lower() in ("0", "false") else None
            data[lbl] = val

        if cid == "new":
            new_id = self.db_manager.add_costume(self.pokemon_id, data)
            self._swap_entry_keys("new", new_id)
            frame.costume_id = new_id
        else:
            vals = [data[l] for l in self.LABELS]
            self.db_manager.update_pokemon_costume(cid, vals)

        self.costumes = self.db_manager.fetch_pokemon_costumes(self.pokemon_id)
        messagebox.showinfo("Saved", "Costume saved.", parent=self.details_window.window)

    def _delete_costume(self, cid):
        if cid != "new":
            if not messagebox.askyesno("Delete", "Delete this costume?",
                                       parent=self.details_window.window):
                return
            self.db_manager.delete_costume(cid)
            self.costumes = [c for c in self.costumes if c[0] != cid]

        for fr, *_ , c in self.costume_frames[:]:
            if c == cid:
                fr.destroy()
                self.costume_frames.remove((fr, *_ , c))

    def _add_costume(self):
        self._create_costume_frame(["new"] + [""] * 7, is_new=True)

    def _swap_entry_keys(self, old, new):
        for lbl in self.LABELS:
            if (old, lbl) in self.costume_entries:
                self.costume_entries[(new, lbl)] = self.costume_entries.pop((old, lbl))
