import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


EDITOR_DIR = Path(__file__).resolve().parents[1]
if str(EDITOR_DIR) not in sys.path:
    sys.path.insert(0, str(EDITOR_DIR))

from config import editor_mode, load_editor_environment, production_editor_settings


class EditorConfigTests(unittest.TestCase):
    def test_load_editor_environment_preserves_explicit_shell_values(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            env_path = Path(temp_dir) / ".env"
            env_path.write_text(
                "POKEGO_EDITOR_MODE=production\n"
                "POKEGO_EDITOR_PROD_HOST=from-file@example.test\n",
                encoding="utf-8",
            )
            with patch.dict(os.environ, {"POKEGO_EDITOR_MODE": "production"}, clear=True):
                load_editor_environment(env_path)
                self.assertEqual(os.environ["POKEGO_EDITOR_MODE"], "production")
                self.assertEqual(os.environ["POKEGO_EDITOR_PROD_HOST"], "from-file@example.test")

    def test_editor_mode_rejects_unknown_values(self):
        with patch.dict(os.environ, {"POKEGO_EDITOR_MODE": "unknown"}, clear=True):
            with self.assertRaisesRegex(ValueError, "POKEGO_EDITOR_MODE"):
                editor_mode()

    def test_editor_mode_rejects_removed_local_recovery_mode(self):
        with patch.dict(os.environ, {"POKEGO_EDITOR_MODE": "local"}, clear=True):
            with self.assertRaisesRegex(ValueError, "production"):
                editor_mode()

    def test_production_settings_resolve_ssh_key_and_validate_port(self):
        with patch.dict(
            os.environ,
            {
                "POKEGO_EDITOR_PROD_HOST": "adam@example.test",
                "POKEGO_EDITOR_SSH_KEY": "~/.ssh/editor-test",
                "POKEGO_EDITOR_POSTGRES_PORT": "6543",
            },
            clear=True,
        ):
            settings = production_editor_settings()
        self.assertEqual(settings["host"], "adam@example.test")
        self.assertTrue(settings["ssh_key"].endswith("/.ssh/editor-test"))
        self.assertEqual(settings["local_port"], "6543")

    def test_production_settings_require_host(self):
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaisesRegex(ValueError, "POKEGO_EDITOR_PROD_HOST"):
                production_editor_settings()
