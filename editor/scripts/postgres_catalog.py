"""Small PostgreSQL compatibility layer for catalog maintenance scripts."""

from __future__ import annotations

import os
import re
from contextlib import contextmanager
from typing import Any, Iterator, Sequence


def _translate_qmarks(query: str) -> str:
    return re.sub(r"\?", "%s", query)


class LegacyRow(tuple):
    """Tuple rows that also support legacy string-key column access."""

    def __new__(cls, values: Sequence[Any], columns: Sequence[str]):
        instance = super().__new__(cls, values)
        instance._columns = {name: index for index, name in enumerate(columns)}
        return instance

    def __getitem__(self, index: int | str):
        if isinstance(index, str):
            return super().__getitem__(self._columns[index])
        return super().__getitem__(index)


class CatalogCursor:
    def __init__(self, cursor):
        self._cursor = cursor

    def execute(self, query: str, params: Sequence[Any] | None = None):
        statement = _translate_qmarks(query)
        if params is None:
            self._cursor.execute(statement)
        else:
            self._cursor.execute(statement, params)
        return self

    def executemany(self, query: str, params_seq):
        self._cursor.executemany(_translate_qmarks(query), params_seq)
        return self

    def fetchone(self):
        row = self._cursor.fetchone()
        return self._row(row)

    def fetchall(self):
        return [self._row(row) for row in self._cursor.fetchall()]

    def __iter__(self):
        return iter(self.fetchall())

    def close(self):
        self._cursor.close()

    def _row(self, values):
        if values is None:
            return None
        columns = [description.name for description in self._cursor.description]
        return LegacyRow(values, columns)


class CatalogConnection:
    def __init__(self, connection):
        self._connection = connection

    def cursor(self):
        return CatalogCursor(self._connection.cursor())

    def execute(self, query: str, params: Sequence[Any] | None = None):
        cursor = self.cursor()
        cursor.execute(query, params)
        return cursor

    def commit(self):
        self._connection.commit()

    def rollback(self):
        self._connection.rollback()

    def close(self):
        self._connection.close()


@contextmanager
def open_catalog_connection(database_url: str) -> Iterator[CatalogConnection]:
    try:
        import psycopg
    except ImportError as error:  # pragma: no cover - environment-specific
        raise RuntimeError("Install editor/requirements.txt before running catalog maintenance scripts.") from error

    connection = CatalogConnection(
        psycopg.connect(
            database_url,
            options="-c search_path=pokemon_catalog,public",
            application_name="pokegonexus-catalog-maintenance",
        )
    )
    try:
        yield connection
    finally:
        connection.close()


def configured_database_url(explicit_url: str | None = None) -> str:
    database_url = explicit_url or os.environ.get("POKEGO_EDITOR_DATABASE_URL")
    if database_url:
        return database_url
    raise RuntimeError(
        "Set POKEGO_EDITOR_DATABASE_URL or pass --database-url to target the PostgreSQL catalog."
    )


@contextmanager
def open_catalog_authoring_connection(database_url: str | None = None) -> Iterator[CatalogConnection]:
    """Open an explicit URL, or use the editor's normal production SSH session."""
    configured_url = database_url or os.environ.get("POKEGO_EDITOR_DATABASE_URL")
    if configured_url:
        with open_catalog_connection(configured_url) as connection:
            yield connection
        return

    from config import load_editor_environment, production_editor_settings
    from production_session import ProductionCatalogSession

    load_editor_environment()
    with ProductionCatalogSession(production_editor_settings()):
        with open_catalog_connection(configured_database_url()) as connection:
            yield connection
