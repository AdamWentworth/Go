import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


EDITOR_DIR = Path(__file__).resolve().parents[1]
if str(EDITOR_DIR) not in sys.path:
    sys.path.insert(0, str(EDITOR_DIR))

import main


class EditorEntrypointTests(unittest.TestCase):
    def test_reexecs_system_python_into_editor_virtual_environment(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            editor_dir = Path(temp_dir)
            venv_python = editor_dir / ".venv" / "bin" / "python"
            venv_python.parent.mkdir(parents=True)
            venv_python.touch()

            with patch.object(main, "EDITOR_DIR", editor_dir), patch.object(
                main.sys, "prefix", "/usr"
            ), patch.object(main.sys, "argv", ["main.py"]), patch.dict(
                main.os.environ, {}, clear=True
            ), patch.object(main.os, "execvpe") as execvpe:
                main.reexec_with_editor_venv()

        execvpe.assert_called_once_with(
            str(venv_python),
            [str(venv_python), "main.py"],
            {"POKEGO_EDITOR_VENV_REEXEC": "1"},
        )

    def test_does_not_reexec_when_already_running_inside_editor_virtual_environment(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            editor_dir = Path(temp_dir)
            venv_dir = editor_dir / ".venv"
            venv_python = venv_dir / "bin" / "python"
            venv_python.parent.mkdir(parents=True)
            venv_python.touch()

            with patch.object(main, "EDITOR_DIR", editor_dir), patch.object(
                main.sys, "prefix", str(venv_dir)
            ), patch.object(main.os, "execvpe") as execvpe:
                main.reexec_with_editor_venv()

        execvpe.assert_not_called()
