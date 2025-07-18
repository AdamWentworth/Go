# database/size_pokemon_manager.py
class SizePokemonManager:
    """Wrapper around the `pokemon_sizes` table."""

    COLS = (
        "pokedex_height", "pokedex_weight",
        "height_standard_deviation", "weight_standard_deviation",
        "height_xxs_threshold", "height_xs_threshold",
        "height_xl_threshold", "height_xxl_threshold",
        "weight_xxs_threshold", "weight_xs_threshold",
        "weight_xl_threshold", "weight_xxl_threshold",
    )

    def __init__(self, db_conn):
        self.conn = db_conn

    # ── Fetch ──────────────────────────────────────────────────────────────
    def fetch_size_data(self, pokemon_id):
        cur = self.conn.get_cursor()
        cur.execute("SELECT * FROM pokemon_sizes WHERE pokemon_id = ?", (pokemon_id,))
        row = cur.fetchone()
        if row:
            # drop the leading pokemon_id
            return row[1:]
        # empty row → return placeholder list of None
        return [None] * len(self.COLS)

    # ── Upsert ─────────────────────────────────────────────────────────────
    def upsert_size_data(self, pokemon_id, data_tuple):
        cur = self.conn.get_cursor()
        cur.execute("SELECT 1 FROM pokemon_sizes WHERE pokemon_id = ?", (pokemon_id,))
        exists = cur.fetchone() is not None

        if exists:
            set_clause = ", ".join(f"{col}=?" for col in self.COLS)
            cur.execute(
                f"UPDATE pokemon_sizes SET {set_clause} WHERE pokemon_id = ?",
                (*data_tuple, pokemon_id),
            )
        else:
            placeholders = ", ".join(["?"] * (1 + len(self.COLS)))
            cur.execute(
                f"INSERT INTO pokemon_sizes VALUES ({placeholders})",
                (pokemon_id, *data_tuple),
            )
        self.conn.commit()
