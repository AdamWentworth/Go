# db_utils.py

from __future__ import annotations

import re
from typing import Any


def is_postgres_target(target: str) -> bool:
    normalized = target.strip().lower()
    return normalized.startswith(("postgres://", "postgresql://"))


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

    def executemany(self, query: str, params_seq):
        translated = re.sub(r"\?", "%s", query)
        self._cursor.executemany(translated, params_seq)
        return self

    def fetchone(self):
        row = self._cursor.fetchone()
        return self._legacy_row(row)

    def fetchall(self):
        return [self._legacy_row(row) for row in self._cursor.fetchall()]

    def close(self):
        self._cursor.close()

    def __getattr__(self, name: str):
        return getattr(self._cursor, name)

    @staticmethod
    def _legacy_row(row):
        if row is None:
            return None
        return tuple(1 if value is True else 0 if value is False else value for value in row)


class DatabaseConnection:
    """PostgreSQL editor connection with the catalog schema on the search path."""

    def __init__(self, database_url: str):
        if not is_postgres_target(database_url):
            raise ValueError("The catalog editor requires a PostgreSQL database URL.")
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

    def legacy_boolean_scalar(self, value: Any) -> Any:
        """Expose legacy text-backed flags as the editor's historical 0/1 values."""
        normalized = self.bool_value(value)
        if isinstance(normalized, bool):
            return 1 if normalized else 0
        return value

    def next_identifier(self, table_name: str, column_name: str) -> int:
        # Several catalog tables retain explicit integer identifiers for
        # compatibility with the published catalog contract.
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

    def commit(self):
        self.conn.commit()

    def close(self):
        self.conn.close()


# Kept as a clear explicit name for callers outside the editor package.
PostgresDatabaseConnection = DatabaseConnection
