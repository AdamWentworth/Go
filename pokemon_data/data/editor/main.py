# main.py

import tkinter as tk
from pokemon_database_app import PokemonDatabaseApp

if __name__ == "__main__":
    root = tk.Tk()
    app = PokemonDatabaseApp(root)
    root.mainloop()
