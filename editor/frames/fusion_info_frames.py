# frames/fusion_info_frames.py
import tkinter as tk


class FusionInfoFrames:
    def __init__(self, parent, fusion_data):
        self.parent = parent
        self.fusion_data = fusion_data
        self.entry_widgets = {}

        self.general_attributes = [
            "Fusion ID",
            "Base Pokemon ID 1",
            "Base Pokemon ID 2",
            "Name",
            "Pokedex Number",
            "Image URL",
            "Image URL Shiny",
            "Sprite URL",
            "Attack",
            "Defense",
            "Stamina",
            "Type 1",
            "Type 2",
        ]

        self.additional_attributes = [
            "Generation",
            "Available",
            "Shiny Available",
            "Shiny Rarity",
            "Date Available",
            "Date Shiny Available",
        ]

        self._index_map = {
            "Fusion ID": 0,
            "Base Pokemon ID 1": 1,
            "Base Pokemon ID 2": 2,
            "Name": 3,
            "Pokedex Number": 4,
            "Image URL": 5,
            "Image URL Shiny": 6,
            "Sprite URL": 7,
            "Attack": 8,
            "Defense": 9,
            "Stamina": 10,
            "Type 1": 11,
            "Type 2": 12,
            "Generation": 13,
            "Available": 14,
            "Shiny Available": 15,
            "Shiny Rarity": 16,
            "Date Available": 17,
            "Date Shiny Available": 18,
        }

    def create_info_frames(self):
        info_container = tk.Frame(self.parent)
        info_container.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        self._create_general_info_frame(info_container)
        self._create_additional_info_frame(info_container)

    def _create_general_info_frame(self, container):
        frame = tk.LabelFrame(container, text="Fusion General Info", padx=10, pady=10)
        frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True, padx=5)
        frame.columnconfigure(1, weight=1)

        for i, attr in enumerate(self.general_attributes):
            tk.Label(frame, text=f"{attr}:").grid(row=i, column=0, sticky="e", padx=(0, 4))
            entry = tk.Entry(frame)
            val = self.fusion_data[self._index_map[attr]]
            entry.insert(0, "" if val is None else str(val))
            entry.grid(row=i, column=1, sticky="ew", pady=1)
            if attr == "Fusion ID":
                entry.config(state="readonly")
            self.entry_widgets[attr] = entry

    def _create_additional_info_frame(self, container):
        frame = tk.LabelFrame(container, text="Fusion Additional Info", padx=10, pady=10)
        frame.pack(side=tk.RIGHT, fill=tk.BOTH, expand=True, padx=5)
        frame.columnconfigure(1, weight=1)

        for i, attr in enumerate(self.additional_attributes):
            tk.Label(frame, text=f"{attr}:").grid(row=i, column=0, sticky="e", padx=(0, 4))
            entry = tk.Entry(frame)
            val = self.fusion_data[self._index_map[attr]]
            entry.insert(0, "" if val is None else str(val))
            entry.grid(row=i, column=1, sticky="ew", pady=1)
            self.entry_widgets[attr] = entry

