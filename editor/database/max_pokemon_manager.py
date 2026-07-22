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
        gigantamax_move_name        TEXT
        gigantamax_move_type_id     INTEGER
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
            """
            SELECT pokemon_id, dynamax, gigantamax, dynamax_release_date,
                   gigantamax_release_date, gigantamax_image_url,
                   shiny_gigantamax_image_url, gigantamax_move_name,
                   gigantamax_move_type_id
            FROM max_pokemon
            WHERE pokemon_id = ?
            """,
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
            "SELECT 1 FROM max_pokemon WHERE pokemon_id = ? LIMIT 1",
            (pokemon_id,),
        )
        if cur.fetchone() is not None:
            return 0

        cur.execute(
            """
            INSERT INTO max_pokemon (
                pokemon_id,
                dynamax,
                gigantamax,
                dynamax_release_date,
                gigantamax_release_date,
                gigantamax_image_url,
                shiny_gigantamax_image_url,
                gigantamax_move_name,
                gigantamax_move_type_id
            ) VALUES (?, ?, ?, '', '', '', '', NULL, NULL)
            """,
            (pokemon_id, self.conn.bool_value(0), self.conn.bool_value(0))
        )
        self.conn.commit()
        return pokemon_id

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
        gigantamax_move_name,
        gigantamax_move_type_id,
    ):
        """Update every column for the specified Pokémon."""
        cur = self.conn.get_cursor()
        is_gigantamax = bool(gigantamax)
        cur.execute(
            """
            UPDATE max_pokemon
               SET dynamax                     = ?,
                   gigantamax                  = ?,
                   dynamax_release_date        = ?,
                   gigantamax_release_date     = ?,
                   gigantamax_image_url        = ?,
                   shiny_gigantamax_image_url  = ?,
                   gigantamax_move_name        = ?,
                   gigantamax_move_type_id     = ?
             WHERE pokemon_id = ?
            """,
            (
                self.conn.bool_value(dynamax),
                self.conn.bool_value(gigantamax),
                dynamax_release_date,
                gigantamax_release_date,
                gigantamax_image_url,
                shiny_gigantamax_image_url,
                (gigantamax_move_name or None) if is_gigantamax else None,
                gigantamax_move_type_id if is_gigantamax else None,
                pokemon_id,
            ),
        )
        self.conn.commit()
