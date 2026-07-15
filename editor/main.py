"""Entrypoint for the Pokemon catalog editor."""

from __future__ import annotations

import os
import sys
from pathlib import Path


EDITOR_DIR = Path(__file__).resolve().parent


def reexec_with_editor_venv() -> None:
    """Make ``python main.py`` use the editor dependencies when available."""
    if os.environ.get("POKEGO_EDITOR_VENV_REEXEC") == "1":
        return

    venv_python = EDITOR_DIR / ".venv" / "bin" / "python"
    if not venv_python.is_file():
        return

    try:
        already_using_venv = Path(sys.executable).resolve() == venv_python.resolve()
    except OSError:
        already_using_venv = False
    if already_using_venv:
        return

    environment = os.environ.copy()
    environment["POKEGO_EDITOR_VENV_REEXEC"] = "1"
    os.execvpe(str(venv_python), [str(venv_python), *sys.argv], environment)


def run_editor() -> None:
    import tkinter as tk

    from pokemon_database_app import PokemonDatabaseApp

    root = tk.Tk()
    PokemonDatabaseApp(root)
    root.mainloop()


def main() -> None:
    reexec_with_editor_venv()

    from config import editor_mode, load_editor_environment, production_editor_settings

    load_editor_environment()
    if editor_mode() == "production":
        from production_session import ProductionCatalogSession

        with ProductionCatalogSession(production_editor_settings()):
            run_editor()
        return

    run_editor()


if __name__ == "__main__":
    main()
