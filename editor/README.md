# Pokémon Database Editor

This is a custom-built **Tkinter-based GUI application** for visually editing and managing data in the `pokego.db` SQLite database used by the Pokémon Go Nexus backend.

It serves as an internal tool for editing Pokémon records, evolutions, shadow data, costumes, moves, mega evolutions, and female-specific assets through a user-friendly interface.

---

## 🖥️ Features

- View and sort all Pokémon in the database
- Click to open detailed view per Pokémon
- Edit general Pokémon data (types, pokédex, availability dates, generation, etc.)
- Manage Pokémon moves (fast/charged)
- Edit and create evolutions
- Manage shadow attributes, shiny/shadow images
- Add/update costumes (including image URLs and availability)
- Edit Mega Evolutions and add new entries
- Manage gender-specific (female-only) Pokémon images
- Save changes directly to the SQLite database

> ⚠️ **Note:** This is an internal utility designed to operate directly on the `pokego.db` used in the `pokemon_data` service. Backup your database before making changes.

---

## 📁 Project Structure

```plaintext
editor/
├── main.py                          # Launch entry point
├── pokemon_database_app.py          # Main Tkinter app UI
├── pokemon_details_window.py        # Scrollable detailed editor per Pokémon
├── database_manager.py              # Central DB abstraction layer
│
├── database/                        # Managers for DB table operations
│   ├── pokemon_manager.py
│   ├── evolution_manager.py
│   ├── shadow_pokemon_manager.py
│   ├── costume_pokemon_manager.py
│   ├── mega_evolution_manager.py
│   ├── female_pokemon_manager.py
│   └── db_utils.py
│
├── frames/                          # UI components grouped by feature
│   ├── pokemon_info_frames.py
│   ├── pokemon_moves_frame.py
│   ├── pokemon_evolutions_frame.py
│   ├── pokemon_shadow_frame.py
│   ├── pokemon_image_frame.py
│   ├── pokemon_shiny_image_frame.py
│   ├── pokemon_shadow_image_frames.py
│   ├── pokemon_shadow_costume_frame.py
│   ├── pokemon_costume_image_frame.py
│   ├── pokemon_mega_frame.py
│   └── pokemon_female_image_frame.py
│
├── details_window/
│   └── ui_setup.py                  # Scrollable window helpers
└── .gitignore
```

---

## 🚀 Getting Started

### 1. **Install Dependencies**

This is a Tkinter app with a small set of Python package dependencies for image handling, HTTP requests, and the optional background sync script.

Ensure you are using **Python 3.11+** with Tkinter included.

> If you're on Linux and don’t have Tkinter:
```bash
sudo apt install python3-pip python3-tk
```

Install the Python package dependencies from the editor directory:

```bash
python -m pip install -r requirements.txt
```

---

### 2. **Run the Application**

From the `editor/` directory:

```bash
python main.py
```

This will launch the Pokémon Database Editor window in full screen (`zoomed`) mode.

---

### 3. **Database Path**

The editor expects your database at this relative path:
```
../pokemon_data/data/pokego.db
```

If you're running the editor from a different location, adjust the path inside `database_manager.py` or `pokemon_database_app.py`.

---

## 🧱 Core Components

### 🔍 Main UI: `pokemon_database_app.py`

- Lists all Pokémon with a sortable dropdown (by `pokemon_id`, `name`, `generation`, etc.)
- Selecting a Pokémon opens the detailed editing view

### 📝 Details Window: `pokemon_details_window.py`

Laid out in vertical containers:
- **Info & Moves** – editable text fields + move pickers
- **Evolutions & Shadows** – editable evolution chains and shadow attributes
- **Images** – main, shiny, shadow, shiny shadow
- **Mega Evolutions** – editable + add new megas
- **Costumes** – image URLs, shiny support, date available
- **Female Variants** – displays and updates unique female-only images

### 💾 Database Layer: `database_manager.py`

A single point of access to all low-level managers:
- Handles fetching, updating, inserting across evolutions, shadows, costumes, megas, and more
- Wraps around SQLite logic via `db_utils.py`

---

## 💡 Tips & Notes

- The editor auto-fetches **move names**, **type names**, and **available options** for dropdowns using database joins.
- Make sure any image file paths or URLs you provide will match the frontend usage in the public folder.
- Use the “Save Changes” button at the bottom of each Pokémon's detail window to persist updates to the database.
- You can add new mega evolutions on the fly with the “Add Mega Evolution” button — this creates a blank record.

---

## 🧪 Development Status

This editor is stable and used in production to manage the `pokego.db` database. It is a critical part of the Pokémon Go Nexus data editing workflow.

There is currently **no undo**, so always **backup your DB** before performing batch edits.

---

## 📌 Future Enhancements

- Add Dynamax/Gigantamax Pokemon editing.
- Add CP per level editing (most exist in the database but for newer pokemon, a script needs to be run separate from this after the base stats have been added)
- Add Move editing (not per pokemon but the moves themselves)


---

## 👨‍💻 Author Notes

This project was created to streamline the manual data work involved in managing a highly structured Pokémon Go database. Instead of editing SQLite tables directly, this editor provides a visual layer built around the specific data relationships and constraints of the `pokemon_data` service.

It’s not intended for public use, but it’s a reliable and fast way to manage a complex game dataset in a way that scales cleanly over time.
