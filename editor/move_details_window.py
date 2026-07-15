import tkinter as tk
from tkinter import messagebox, ttk

from database_manager import DatabaseManager
from config import catalog_database_target


class MoveDetailsWindow:
    def __init__(self, parent, move_id, details, db_manager=None, on_commit=None):
        self.db_manager = db_manager if db_manager is not None else DatabaseManager(catalog_database_target())
        self.on_commit = on_commit
        self.move_id = int(move_id) if move_id is not None else None
        self.details = details
        self.is_new = self.move_id is None or details is None

        self.type_ids = self.db_manager.fetch_type_ids()
        self.type_id_to_name = {type_id: name for name, type_id in self.type_ids.items()}

        self.window = tk.Toplevel(parent)
        self.window.title("New Move" if self.is_new else f"Move Details: {self.move_id}")
        self.window.geometry("560x620")

        self._build_ui()
        if self.details:
            self._populate_fields(self.details)
        self._refresh_usage()

    def _build_ui(self):
        container = tk.Frame(self.window, padx=14, pady=12)
        container.pack(fill=tk.BOTH, expand=True)

        self.entries = {}
        self.bool_dropdowns = {}

        self._create_entry(container, "Move ID", "move_id", row=0)
        self._create_entry(container, "Name", "name", row=1)

        tk.Label(container, text="Type").grid(row=2, column=0, sticky="w", pady=4, padx=(0, 8))
        self.type_var = tk.StringVar()
        self.type_dropdown = ttk.Combobox(
            container,
            textvariable=self.type_var,
            values=sorted(self.type_ids.keys()),
            state="readonly",
            width=30,
        )
        self.type_dropdown.grid(row=2, column=1, sticky="w", pady=4)

        numeric_fields = [
            ("Raid Power", "raid_power"),
            ("PVP Power", "pvp_power"),
            ("Raid Energy", "raid_energy"),
            ("PVP Energy", "pvp_energy"),
            ("Raid Cooldown", "raid_cooldown"),
            ("PVP Turns", "pvp_turns"),
            ("Fusion ID", "fusion_id"),
        ]
        row = 3
        for label, key in numeric_fields:
            self._create_entry(container, label, key, row=row)
            row += 1

        tk.Label(container, text="Is Fast").grid(row=row, column=0, sticky="w", pady=4, padx=(0, 8))
        self.is_fast_var = tk.IntVar(value=0)
        ttk.Checkbutton(container, variable=self.is_fast_var).grid(row=row, column=1, sticky="w", pady=4)
        row += 1

        self._create_bool_dropdown(container, "Shadow", "shadow", row)
        row += 1
        self._create_bool_dropdown(container, "Purified", "purified", row)
        row += 1
        self._create_bool_dropdown(container, "Apex", "apex", row)
        row += 1

        self.usage_var = tk.StringVar(value="Usage: -")
        tk.Label(container, textvariable=self.usage_var, fg="#444").grid(
            row=row,
            column=0,
            columnspan=2,
            sticky="w",
            pady=(12, 4),
        )
        row += 1

        button_row = tk.Frame(container)
        button_row.grid(row=row, column=0, columnspan=2, sticky="w", pady=(10, 0))

        self.save_button = tk.Button(button_row, text="Save", width=12, command=self._save)
        self.save_button.pack(side=tk.LEFT, padx=(0, 8))

        self.delete_button = tk.Button(
            button_row,
            text="Delete",
            width=12,
            command=self._delete,
            state=tk.NORMAL if not self.is_new else tk.DISABLED,
        )
        self.delete_button.pack(side=tk.LEFT, padx=(0, 8))

        self.refresh_button = tk.Button(button_row, text="Refresh Usage", width=12, command=self._refresh_usage)
        self.refresh_button.pack(side=tk.LEFT)

        if not self.is_new:
            self.entries["move_id"].insert(0, str(self.move_id))
            self.entries["move_id"].config(state="disabled")

    def _create_entry(self, parent, label, key, row):
        tk.Label(parent, text=label).grid(row=row, column=0, sticky="w", pady=4, padx=(0, 8))
        entry = tk.Entry(parent, width=34)
        entry.grid(row=row, column=1, sticky="w", pady=4)
        self.entries[key] = entry

    def _create_bool_dropdown(self, parent, label, key, row):
        tk.Label(parent, text=label).grid(row=row, column=0, sticky="w", pady=4, padx=(0, 8))
        var = tk.StringVar(value="None")
        dropdown = ttk.Combobox(
            parent,
            textvariable=var,
            values=["None", "0", "1"],
            state="readonly",
            width=10,
        )
        dropdown.grid(row=row, column=1, sticky="w", pady=4)
        self.bool_dropdowns[key] = var

    def _populate_fields(self, details):
        (
            move_id,
            name,
            type_id,
            raid_power,
            pvp_power,
            raid_energy,
            pvp_energy,
            raid_cooldown,
            pvp_turns,
            is_fast,
            fusion_id,
            shadow,
            purified,
            apex,
        ) = details

        self.entries["name"].insert(0, name or "")
        self.entries["raid_power"].insert(0, "" if raid_power is None else str(raid_power))
        self.entries["pvp_power"].insert(0, "" if pvp_power is None else str(pvp_power))
        self.entries["raid_energy"].insert(0, "" if raid_energy is None else str(raid_energy))
        self.entries["pvp_energy"].insert(0, "" if pvp_energy is None else str(pvp_energy))
        self.entries["raid_cooldown"].insert(0, "" if raid_cooldown is None else str(raid_cooldown))
        self.entries["pvp_turns"].insert(0, "" if pvp_turns is None else str(pvp_turns))
        self.entries["fusion_id"].insert(0, "" if fusion_id is None else str(fusion_id))
        self.is_fast_var.set(1 if is_fast else 0)

        if type_id is not None and type_id in self.type_id_to_name:
            self.type_var.set(self.type_id_to_name[type_id])

        self.bool_dropdowns["shadow"].set(self._format_bool_value(shadow))
        self.bool_dropdowns["purified"].set(self._format_bool_value(purified))
        self.bool_dropdowns["apex"].set(self._format_bool_value(apex))

        if self.move_id is None:
            self.move_id = move_id

    def _format_bool_value(self, value):
        if value is None:
            return "None"
        return "1" if int(value) else "0"

    def _parse_int_or_none(self, raw_value, field_label):
        value = raw_value.strip()
        if value == "":
            return None
        try:
            return int(value)
        except ValueError:
            raise ValueError(f"{field_label} must be an integer or blank.")

    def _parse_bool_nullable(self, key):
        value = self.bool_dropdowns[key].get().strip()
        if value == "None":
            return None
        return int(value)

    def _collect_move_payload(self):
        name = self.entries["name"].get().strip()
        if not name:
            raise ValueError("Name is required.")

        type_name = self.type_var.get().strip()
        type_id = self.type_ids.get(type_name) if type_name else None

        return (
            name,
            type_id,
            self._parse_int_or_none(self.entries["raid_power"].get(), "Raid Power"),
            self._parse_int_or_none(self.entries["pvp_power"].get(), "PVP Power"),
            self._parse_int_or_none(self.entries["raid_energy"].get(), "Raid Energy"),
            self._parse_int_or_none(self.entries["pvp_energy"].get(), "PVP Energy"),
            self._parse_int_or_none(self.entries["raid_cooldown"].get(), "Raid Cooldown"),
            self._parse_int_or_none(self.entries["pvp_turns"].get(), "PVP Turns"),
            int(self.is_fast_var.get()),
            self._parse_int_or_none(self.entries["fusion_id"].get(), "Fusion ID"),
            self._parse_bool_nullable("shadow"),
            self._parse_bool_nullable("purified"),
            self._parse_bool_nullable("apex"),
        )

    def _save(self):
        try:
            payload = self._collect_move_payload()
            if self.is_new:
                move_id_input = self.entries["move_id"].get().strip()
                requested_move_id = int(move_id_input) if move_id_input else None
                self.move_id = self.db_manager.add_move(requested_move_id, payload)
                self.is_new = False
                self.entries["move_id"].delete(0, tk.END)
                self.entries["move_id"].insert(0, str(self.move_id))
                self.entries["move_id"].config(state="disabled")
                self.delete_button.config(state=tk.NORMAL)
                self.window.title(f"Move Details: {self.move_id}")
                messagebox.showinfo("Created", f"Move {self.move_id} created successfully.")
            else:
                self.db_manager.update_move(self.move_id, payload)
                messagebox.showinfo("Updated", f"Move {self.move_id} updated successfully.")

            self._refresh_usage()
            if callable(self.on_commit):
                self.on_commit()
        except Exception as exc:
            messagebox.showerror("Save Error", str(exc))

    def _delete(self):
        if self.move_id is None:
            return

        usage = self.db_manager.count_move_usage(self.move_id)
        confirm_message = (
            f"Delete move {self.move_id}?\n\n"
            f"Usage in pokemon_moves: {usage['pokemon_moves']}\n"
            f"Usage in fusion_moveset: {usage['fusion_moveset']}\n\n"
            "This also removes those move assignments."
        )
        if not messagebox.askyesno("Confirm Delete", confirm_message):
            return

        try:
            self.db_manager.delete_move(self.move_id)
            if callable(self.on_commit):
                self.on_commit()
            messagebox.showinfo("Deleted", f"Move {self.move_id} deleted.")
            self.window.destroy()
        except Exception as exc:
            messagebox.showerror("Delete Error", str(exc))

    def _refresh_usage(self):
        if self.move_id is None:
            self.usage_var.set("Usage: not saved yet")
            return

        usage = self.db_manager.count_move_usage(self.move_id)
        self.usage_var.set(
            "Usage: "
            f"pokemon_moves={usage['pokemon_moves']} | "
            f"fusion_moveset={usage['fusion_moveset']} | "
            f"total={usage['total']}"
        )
