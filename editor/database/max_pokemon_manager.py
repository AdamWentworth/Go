# max_pokemon_manager.py
class MaxPokemonManager:
    """
    Utility wrapper around the **max_pokemon** table.

    Table layout (from PRAGMA table_info):
        pokemon_id                  INTEGER PRIMARY KEY
        dynamax                     BOOLEAN
        gigantamax                  BOOLEAN
        dynamax_release_date        TEXT
        gigantamax_release_date     TEXT
        gigantamax_image_url        TEXT
        shiny_gigantamax_image_url  TEXT
    """

    def __init__(self, db_conn):
        self.conn = db_conn

    # ──────────────────────────────────────────────────────────────────────────
    # Fetch
    # ──────────────────────────────────────────────────────────────────────────
    def fetch_max_pokemon(self, pokemon_id):
        """Return the row (or *None*) for the given Pokémon ID."""
        cur = self.conn.get_cursor()
        cur.execute(
            "SELECT * FROM max_pokemon WHERE pokemon_id = ?",
            (pokemon_id,)
        )
        return cur.fetchone()

    # ──────────────────────────────────────────────────────────────────────────
    # Insert (creates a default/blank row if missing)
    # ──────────────────────────────────────────────────────────────────────────
    def insert_max_pokemon(self, pokemon_id):
        """Ensure a row exists – does **nothing** if it already does."""
        cur = self.conn.get_cursor()
        cur.execute(
            """
            INSERT OR IGNORE INTO max_pokemon (
                pokemon_id,
                dynamax,
                gigantamax,
                dynamax_release_date,
                gigantamax_release_date,
                gigantamax_image_url,
                shiny_gigantamax_image_url
            ) VALUES (?, 0, 0, '', '', '', '')
            """,
            (pokemon_id,)
        )
        self.conn.commit()
        return cur.lastrowid  # 0 → row already present

    # ──────────────────────────────────────────────────────────────────────────
    # Update
    # ──────────────────────────────────────────────────────────────────────────
    def update_max_pokemon(
        self,
        pokemon_id,
        dynamax,
        gigantamax,
        dynamax_release_date,
        gigantamax_release_date,
        gigantamax_image_url,
        shiny_gigantamax_image_url,
    ):
        """Update every column for the specified Pokémon."""
        cur = self.conn.get_cursor()
        cur.execute(
            """
            UPDATE max_pokemon
               SET dynamax                     = ?,
                   gigantamax                  = ?,
                   dynamax_release_date        = ?,
                   gigantamax_release_date     = ?,
                   gigantamax_image_url        = ?,
                   shiny_gigantamax_image_url  = ?
             WHERE pokemon_id = ?
            """,
            (
                dynamax,
                gigantamax,
                dynamax_release_date,
                gigantamax_release_date,
                gigantamax_image_url,
                shiny_gigantamax_image_url,
                pokemon_id,
            ),
        )
        self.conn.commit()