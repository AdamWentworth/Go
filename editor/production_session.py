"""Production PostgreSQL session lifecycle for the catalog editor."""

from __future__ import annotations

import os
import shlex
import socket
import subprocess
import time
from pathlib import Path
from typing import Mapping


EDITOR_DIR = Path(__file__).resolve().parent
REPO_ROOT = EDITOR_DIR.parent
BACKUP_SCRIPT = REPO_ROOT / "ops" / "pokemon-catalog" / "backup-editor-session-prod.sh"
CACHE_REFRESH_SCRIPT = REPO_ROOT / "ops" / "pokemon-catalog" / "refresh-api-cache-prod.sh"
FRONTEND_DIR = REPO_ROOT / "frontend"
SSH_CONNECT_TIMEOUT_SECONDS = 10
REMOTE_SCRIPT_TIMEOUT_SECONDS = 120
REMOTE_READ_TIMEOUT_SECONDS = 30
TUNNEL_READY_TIMEOUT_SECONDS = 10
TUNNEL_READY_RETRY_SECONDS = 0.1


class ProductionCatalogSession:
    """Create a local SSH tunnel and refresh the API after a clean GUI exit."""

    def __init__(self, settings: Mapping[str, str], *, refresh_on_success: bool = True):
        self.host = settings["host"]
        self.ssh_key = settings.get("ssh_key", "")
        self.deploy_root = settings["deploy_root"]
        self.publisher_env = settings.get("publisher_env") or (
            f"{self.deploy_root}/pokemon/catalog-publisher.env"
        )
        self.local_port = settings["local_port"]
        self.catalog_api_url = settings.get("catalog_api_url") or (
            "https://pokegonexus.com/api/pokemon"
        )
        self.refresh_on_success = refresh_on_success
        self.tunnel: subprocess.Popen[bytes] | None = None
        self.previous_database_url: str | None = None
        self.previous_database_label: str | None = None

    def _ssh_args(self) -> list[str]:
        args = [
            "ssh",
            "-o",
            "BatchMode=yes",
            "-o",
            f"ConnectTimeout={SSH_CONNECT_TIMEOUT_SECONDS}",
            "-o",
            "ConnectionAttempts=1",
            "-o",
            "ExitOnForwardFailure=yes",
            "-o",
            "ServerAliveInterval=30",
            "-o",
            "ServerAliveCountMax=3",
        ]
        if self.ssh_key:
            key_path = Path(self.ssh_key)
            if not key_path.is_file():
                raise RuntimeError(f"SSH key is missing: {key_path}")
            args.extend(["-i", str(key_path)])
        return args

    def _run_remote_script(self, script_path: Path) -> None:
        if not script_path.is_file():
            raise RuntimeError(f"Required production helper is missing: {script_path}")
        try:
            subprocess.run(
                [
                    *self._ssh_args(),
                    self.host,
                    f"bash -s -- {shlex.quote(self.deploy_root)}",
                ],
                input=script_path.read_bytes(),
                check=True,
                timeout=REMOTE_SCRIPT_TIMEOUT_SECONDS,
            )
        except subprocess.TimeoutExpired as error:
            raise RuntimeError(
                f"Production helper {script_path.name} timed out after "
                f"{REMOTE_SCRIPT_TIMEOUT_SECONDS} seconds. Check the server connection "
                "and retry."
            ) from error

    def _read_publisher_database_url(self) -> str:
        command = (
            f"set -a; . {shlex.quote(self.publisher_env)}; "
            "printf '%s' \"$CATALOG_PUBLISHER_DATABASE_URL\""
        )
        try:
            completed = subprocess.run(
                [*self._ssh_args(), self.host, command],
                check=True,
                stdout=subprocess.PIPE,
                text=True,
                timeout=REMOTE_READ_TIMEOUT_SECONDS,
            )
        except subprocess.TimeoutExpired as error:
            raise RuntimeError(
                "Reading production catalog settings timed out. Check the server "
                "connection and retry."
            ) from error
        database_url = completed.stdout.strip()
        if not database_url.startswith(("postgres://", "postgresql://")):
            raise RuntimeError("Production publisher settings did not provide a PostgreSQL URL.")
        return database_url

    def _validate_live_rankings(self) -> None:
        environment = os.environ.copy()
        environment.pop("POKEGO_EDITOR_DATABASE_URL", None)
        environment["RAID_CATALOG_VALIDATION_URL"] = self.catalog_api_url
        subprocess.run(
            ["npm", "--workspace", "apps/web", "run", "test:raid-model:live"],
            cwd=FRONTEND_DIR,
            env=environment,
            check=True,
        )

    def _wait_for_tunnel(self) -> None:
        deadline = time.monotonic() + TUNNEL_READY_TIMEOUT_SECONDS
        last_error: OSError | None = None
        while time.monotonic() < deadline:
            if self.tunnel is None or self.tunnel.poll() is not None:
                raise RuntimeError("Production PostgreSQL SSH tunnel failed to start.")
            try:
                with socket.create_connection(
                    ("127.0.0.1", int(self.local_port)),
                    timeout=1,
                ):
                    return
            except OSError as error:
                last_error = error
                time.sleep(TUNNEL_READY_RETRY_SECONDS)
        raise RuntimeError(
            "Production PostgreSQL SSH tunnel did not become ready within "
            f"{TUNNEL_READY_TIMEOUT_SECONDS} seconds."
        ) from last_error

    def __enter__(self):
        print("Creating production catalog safety backup...", flush=True)
        self._run_remote_script(BACKUP_SCRIPT)
        print("Opening secure production catalog connection...", flush=True)
        database_url = self._read_publisher_database_url()

        self.tunnel = subprocess.Popen(
            [
                *self._ssh_args(),
                "-N",
                "-L",
                f"127.0.0.1:{self.local_port}:127.0.0.1:5433",
                self.host,
            ]
        )
        self._wait_for_tunnel()

        self.previous_database_url = os.environ.get("POKEGO_EDITOR_DATABASE_URL")
        self.previous_database_label = os.environ.get("POKEGO_EDITOR_DATABASE_LABEL")
        os.environ["POKEGO_EDITOR_DATABASE_URL"] = database_url
        os.environ["POKEGO_EDITOR_DATABASE_LABEL"] = "PRODUCTION PostgreSQL catalog"
        return self

    def __exit__(self, exception_type, _exception, _traceback) -> None:
        try:
            if exception_type is None and self.refresh_on_success:
                self._run_remote_script(CACHE_REFRESH_SCRIPT)
                self._validate_live_rankings()
        finally:
            self._restore_environment()
            if self.tunnel is not None:
                self.tunnel.terminate()
                try:
                    self.tunnel.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    self.tunnel.kill()
                    self.tunnel.wait(timeout=5)

    def _restore_environment(self) -> None:
        if self.previous_database_url is None:
            os.environ.pop("POKEGO_EDITOR_DATABASE_URL", None)
        else:
            os.environ["POKEGO_EDITOR_DATABASE_URL"] = self.previous_database_url

        if self.previous_database_label is None:
            os.environ.pop("POKEGO_EDITOR_DATABASE_LABEL", None)
        else:
            os.environ["POKEGO_EDITOR_DATABASE_LABEL"] = self.previous_database_label
