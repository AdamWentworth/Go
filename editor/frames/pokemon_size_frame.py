# frames/pokemon_size_frame.py
import tkinter as tk


class PokemonSizeFrame(tk.LabelFrame):
    """12-field size editor laid out in three logical columns."""

    # ──────────────────────────────────────────────────────────────
    COLS = (
        # meta + σ
        "Pokedex Height", "Pokedex Weight",
        "Height σ",       "Weight σ",
        # height thresholds
        "Height XXS", "Height XS",
        "Height XL",  "Height XXL",
        # weight thresholds
        "Weight XXS", "Weight XS",
        "Weight XL",  "Weight XXL",
    )

    LEFT   = {"Pokedex Height", "Pokedex Weight", "Height σ", "Weight σ"}
    MID    = {"Height XXS", "Height XS", "Height XL", "Height XXL"}
    RIGHT  = {"Weight XXS", "Weight XS", "Weight XL", "Weight XXL"}

    # ──────────────────────────────────────────────────────────────
    def __init__(self, parent, pokemon_id, size_data):
        super().__init__(                     # ← now a LabelFrame
            parent,
            text="Size Info",                 # title similar to “General Info”
            padx=10,
            pady=10,
            borderwidth=2,
            relief=tk.GROOVE,
        )
        self.pid     = pokemon_id
        self.entries = {}

        # three inner frames = three columns
        frames = [tk.Frame(self) for _ in range(3)]
        for col, f in enumerate(frames):
            f.grid(row=0, column=col, sticky="nsew", padx=5)  # first row (no header)
            self.columnconfigure(col, weight=1)               # outer flex
            f.columnconfigure(1, weight=1)                    # entry flex

        def _col_frame(label: str) -> tk.Frame:
            if label in self.LEFT:
                return frames[0]
            if label in self.MID:
                return frames[1]
            return frames[2]

        # build widgets
        counters = {f: 0 for f in frames}                     # per-column row index
        for label, value in zip(self.COLS, size_data):
            f = _col_frame(label)
            r = counters[f]

            tk.Label(f, text=f"{label}:").grid(
                row=r, column=0, sticky="e", pady=2, padx=(0, 4)
            )
            ent = tk.Entry(f)                                 # stretchable
            ent.insert(0, "" if value is None else str(value))
            ent.grid(row=r, column=1, sticky="ew", pady=2)    # fill horizontally
            self.entries[label] = ent
            counters[f] += 1

    # ──────────────────────────────────────────────────────────────
    def get_data(self):
        """Return values in DB-column order."""
        vals = []
        for lbl in self.COLS:
            raw = self.entries[lbl].get().strip()
            vals.append(None if raw == "" else float(raw))
        return tuple(vals)
