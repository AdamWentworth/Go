# db_utils.py

from __future__ import annotations

import re
import sqlite3
from typing import Any


def is_postgres_target(target: str) -> bool:
    normalized = target.strip().lower()
    return normalized.startswith(("postgres://", "postgresql://"))


class DatabaseConnection:
    PERFORMANCE_INDEXES = {
        "costume_pokemon": (
            "CREATE INDEX IF NOT EXISTS idx_costume_pokemon_pokemon_id ON costume_pokemon(pokemon_id)",
        ),
        "pokemon_backgrounds": (
            "CREATE INDEX IF NOT EXISTS idx_pokemon_backgrounds_pokemon_id ON pokemon_backgrounds(pokemon_id)",
            "CREATE INDEX IF NOT EXISTS idx_pokemon_backgrounds_background_id ON pokemon_backgrounds(background_id)",
        ),
        "pokemon_moves": (
            "CREATE INDEX IF NOT EXISTS idx_pokemon_moves_pokemon_id ON pokemon_moves(pokemon_id)",
        ),
        "female_pokemon": (
            "CREATE INDEX IF NOT EXISTS idx_female_pokemon_pokemon_id ON female_pokemon(pokemon_id)",
        ),
    }

    def __new__(cls, target: str):
        if cls is DatabaseConnection and is_postgres_target(target):
            return super().__new__(PostgresDatabaseConnection)
        return super().__new__(cls)

    def __init__(self, db_path: str):
        self.dialect = "sqlite"
        self.conn = sqlite3.connect(db_path)
        self.ensure_performance_indexes()

    def get_cursor(self):
        return self.conn.cursor()

    def commit(self):
        self.conn.commit()

    def ensure_performance_indexes(self):
        cursor = self.conn.cursor()
        existing_tables = {
            row[0]
            for row in cursor.execute(
                "SELECT name FROM sqlite_master WHERE type = 'table'"
            ).fetchall()
        }
        for table_name, statements in self.PERFORMANCE_INDEXES.items():
            if table_name not in existing_tables:
                continue
            for statement in statements:
                cursor.execute(statement)
        self.conn.commit()

    def close(self):
        self.conn.close()

    @property
    def is_postgres(self) -> bool:
        return False

    def bool_value(self, value: Any) -> Any:
        return value

    def legacy_scalar_value(self, value: Any) -> Any:
        return value

    def next_identifier(self, table_name: str, column_name: str) -> int | None:
        return None

    def insert_returning_id(self, cursor, query: str, params: tuple[Any, ...], column_name: str):
        cursor.execute(query, params)
        return cursor.lastrowid


class PostgresCursor:
    """Small DB-API adapter for the editor's established qmark SQL."""

    def __init__(self, cursor):
        self._cursor = cursor

    def execute(self, query: str, params: Any = None):
        translated = re.sub(r"\?", "%s", query)
        if params is None:
            self._cursor.execute(translated)
        else:
            self._cursor.execute(translated, params)
        return self

    def fetchone(self):
        return self._cursor.fetchone()

    def fetchall(self):
        return self._cursor.fetchall()

    def close(self):
        self._cursor.close()

    def __getattr__(self, name: str):
        return getattr(self._cursor, name)


class PostgresDatabaseConnection(DatabaseConnection):
    """PostgreSQL editor connection with the catalog schema on the search path."""

    def __init__(self, database_url: str):
        try:
            import psycopg
        except ImportError as error:  # pragma: no cover - local dependency state
            raise RuntimeError(
                "PostgreSQL editor support requires psycopg. "
                "Install editor requirements before using POKEGO_EDITOR_DATABASE_URL."
            ) from error

        self.dialect = "postgres"
        self.conn = psycopg.connect(
            database_url,
            options="-c search_path=pokemon_catalog,public",
            application_name="pokegonexus-catalog-editor",
        )

    @property
    def is_postgres(self) -> bool:
        return True

    def get_cursor(self):
        return PostgresCursor(self.conn.cursor())

    def ensure_performance_indexes(self):
        # PostgreSQL catalog indexes live in versioned migrations.
        return None

    def bool_value(self, value: Any) -> Any:
        if value is None or isinstance(value, bool):
            return value
        if isinstance(value, (int, float)):
            return value != 0
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"1", "true", "t", "yes", "y", "on"}:
                return True
            if normalized in {"0", "false", "f", "no", "n", "off", "", "none", "null"}:
                return False
        return value

    def legacy_scalar_value(self, value: Any) -> Any:
        if value is None or isinstance(value, str):
            return value
        if isinstance(value, bool):
            return "1" if value else "0"
        return str(value)

    def next_identifier(self, table_name: str, column_name: str) -> int:
        # Legacy SQLite tables own several explicit integer identifiers.
        # The editor is a single-operator tool; a transaction-local advisory
        # lock keeps its compatible MAX+1 allocation safe for these writes.
        cursor = self.get_cursor()
        try:
            lock_key = f"pokemon_catalog:{table_name}:{column_name}"
            cursor.execute("SELECT pg_advisory_xact_lock(hashtext(%s))", (lock_key,))
            cursor.execute(f"SELECT COALESCE(MAX({column_name}), 0) + 1 FROM {table_name}")
            value = cursor.fetchone()[0]
            return int(value)
        finally:
            cursor.close()

    def insert_returning_id(self, cursor, query: str, params: tuple[Any, ...], column_name: str):
        statement = query.strip().rstrip(";") + f" RETURNING {column_name}"
        cursor.execute(statement, params)
        row = cursor.fetchone()
        return row[0] if row else None
