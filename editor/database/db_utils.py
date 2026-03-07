# db_utils.py

import sqlite3


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

    def __init__(self, db_path):
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
