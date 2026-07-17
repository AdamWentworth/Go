import os
import sys
import unittest
from pathlib import Path
from unittest.mock import Mock, patch


EDITOR_DIR = Path(__file__).resolve().parents[1]
if str(EDITOR_DIR) not in sys.path:
    sys.path.insert(0, str(EDITOR_DIR))

from production_session import ProductionCatalogSession


class ProductionCatalogSessionTests(unittest.TestCase):
    def setUp(self):
        self.settings = {
            "host": "adam@example.test",
            "ssh_key": "",
            "deploy_root": "/srv/pokegonexus",
            "publisher_env": "",
            "local_port": "5433",
            "catalog_api_url": "https://catalog.example.test/api/pokemon",
        }

    def test_reads_publisher_url_without_exposing_it_in_a_command(self):
        session = ProductionCatalogSession(self.settings)
        publisher_url = "postgresql://publisher:secret@127.0.0.1:5433/pokemon_catalog"
        completed = Mock(stdout=publisher_url)
        with patch("production_session.subprocess.run", return_value=completed) as run:
            self.assertEqual(session._read_publisher_database_url(), publisher_url)

        command = run.call_args.args[0]
        self.assertNotIn(publisher_url, command)
        self.assertIn("catalog-publisher.env", command[-1])

    def test_clean_exit_refreshes_cache_and_restores_environment(self):
        session = ProductionCatalogSession(self.settings)
        tunnel = Mock()
        tunnel.poll.return_value = None
        previous_target = os.environ.get("POKEGO_EDITOR_DATABASE_URL")
        previous_label = os.environ.get("POKEGO_EDITOR_DATABASE_LABEL")
        try:
            with patch.object(session, "_run_remote_script") as remote_script, patch.object(
                session, "_read_publisher_database_url", return_value="postgresql://publisher@127.0.0.1/catalog"
            ), patch.object(
                session, "_validate_live_rankings"
            ) as validate_rankings, patch("production_session.subprocess.Popen", return_value=tunnel), patch(
                "production_session.time.sleep"
            ):
                with session:
                    self.assertEqual(os.environ["POKEGO_EDITOR_DATABASE_LABEL"], "PRODUCTION PostgreSQL catalog")

            self.assertEqual(remote_script.call_count, 2)
            validate_rankings.assert_called_once_with()
            tunnel.terminate.assert_called_once()
            tunnel.wait.assert_called_once_with(timeout=5)
        finally:
            if previous_target is None:
                os.environ.pop("POKEGO_EDITOR_DATABASE_URL", None)
            else:
                os.environ["POKEGO_EDITOR_DATABASE_URL"] = previous_target
            if previous_label is None:
                os.environ.pop("POKEGO_EDITOR_DATABASE_LABEL", None)
            else:
                os.environ["POKEGO_EDITOR_DATABASE_LABEL"] = previous_label

    def test_failed_editor_exit_skips_cache_refresh(self):
        session = ProductionCatalogSession(self.settings)
        tunnel = Mock()
        tunnel.poll.return_value = None
        with patch.object(session, "_run_remote_script") as remote_script, patch.object(
            session, "_read_publisher_database_url", return_value="postgresql://publisher@127.0.0.1/catalog"
        ), patch.object(
            session, "_validate_live_rankings"
        ) as validate_rankings, patch("production_session.subprocess.Popen", return_value=tunnel), patch(
            "production_session.time.sleep"
        ):
            with self.assertRaisesRegex(RuntimeError, "editor failed"):
                with session:
                    raise RuntimeError("editor failed")

        self.assertEqual(remote_script.call_count, 1)
        validate_rankings.assert_not_called()
        tunnel.terminate.assert_called_once()

    def test_live_validation_uses_configured_catalog_without_secrets(self):
        session = ProductionCatalogSession(self.settings)
        with patch.dict(
            os.environ,
            {"POKEGO_EDITOR_DATABASE_URL": "postgresql://publisher:secret@db/catalog"},
        ):
            with patch("production_session.subprocess.run") as run:
                session._validate_live_rankings()

        command = run.call_args.args[0]
        environment = run.call_args.kwargs["env"]
        self.assertEqual(
            command,
            ["npm", "--workspace", "apps/web", "run", "test:raid-model:live"],
        )
        self.assertEqual(
            environment["RAID_CATALOG_VALIDATION_URL"],
            "https://catalog.example.test/api/pokemon",
        )
        self.assertNotIn("POKEGO_EDITOR_DATABASE_URL", environment)
        self.assertNotIn("postgresql://", " ".join(command))
