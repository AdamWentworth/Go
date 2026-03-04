# fusion_pokemon_manager.py

from __future__ import annotations


class FusionPokemonManager:
    _ALLOWED_SORT_COLUMNS = {
        'fusion_id',
        'name',
        'pokedex_number',
        'generation',
        'date_available',
        'date_shiny_available',
        'base_pokemon_id1',
        'base_pokemon_id2',
    }

    def __init__(self, db_conn):
        self.conn = db_conn

    def fetch_all_fusions_sorted(self, sort_by='fusion_id'):
        cursor = self.conn.get_cursor()
        sort_column = sort_by if sort_by in self._ALLOWED_SORT_COLUMNS else 'fusion_id'
        query = f"SELECT fusion_id, name FROM fusion_pokemon ORDER BY {sort_column}"
        cursor.execute(query)
        return ["{}: {}".format(row[0], row[1] or '') for row in cursor.fetchall()]

    def fetch_fusion_details(self, fusion_id):
        cursor = self.conn.get_cursor()
        fusion_id = int(fusion_id)

        cursor.execute("SELECT * FROM fusion_pokemon WHERE fusion_id = ?", (fusion_id,))
        row = cursor.fetchone()
        if row is None:
            return None, []

        fusion_data = list(row)

        # Replace type IDs with type names for display/edit UX parity with pokemon editor.
        for index in (11, 12):  # type_1_id, type_2_id
            type_id = fusion_data[index]
            if type_id:
                cursor.execute("SELECT name FROM types WHERE type_id = ?", (type_id,))
                type_name = cursor.fetchone()
                fusion_data[index] = type_name[0] if type_name else None

        cursor.execute(
            """
            SELECT m.name, t.name, m.is_fast, fm.legacy
            FROM fusion_moveset fm
            INNER JOIN moves m ON m.move_id = fm.move_id
            INNER JOIN types t ON m.type_id = t.type_id
            WHERE fm.fusion_id = ?
            ORDER BY m.is_fast DESC, m.name
            """,
            (fusion_id,),
        )
        moves = cursor.fetchall()

        return fusion_data, moves

    def fetch_fusion_moves(self, fusion_id):
        cursor = self.conn.get_cursor()
        cursor.execute("SELECT move_id FROM fusion_moveset WHERE fusion_id = ?", (fusion_id,))
        return [row[0] for row in cursor.fetchall()]

    def update_fusion_data(self, fusion_id, data):
        cursor = self.conn.get_cursor()
        update_query = """
        UPDATE fusion_pokemon
        SET base_pokemon_id1=?, base_pokemon_id2=?, name=?, pokedex_number=?, image_url=?,
            image_url_shiny=?, sprite_url=?, attack=?, defense=?, stamina=?, type_1_id=?, type_2_id=?,
            generation=?, available=?, shiny_available=?, shiny_rarity=?, date_available=?, date_shiny_available=?
        WHERE fusion_id=?
        """
        parameters = tuple(data) + (fusion_id,)
        cursor.execute(update_query, parameters)
        self.conn.commit()

    def update_fusion_moveset(self, fusion_id, move_data):
        cursor = self.conn.get_cursor()

        cursor.execute(
            "SELECT move_id, legacy FROM fusion_moveset WHERE fusion_id = ?",
            (fusion_id,),
        )
        current_moves = {move_id: legacy for move_id, legacy in cursor.fetchall()}
        processed_moves = set()

        for move_id, is_legacy in move_data:
            if move_id in current_moves:
                if current_moves[move_id] != is_legacy:
                    cursor.execute(
                        """
                        UPDATE fusion_moveset
                        SET legacy = ?
                        WHERE fusion_id = ? AND move_id = ?
                        """,
                        (is_legacy, fusion_id, move_id),
                    )
            else:
                cursor.execute(
                    """
                    INSERT INTO fusion_moveset (fusion_id, move_id, legacy)
                    VALUES (?, ?, ?)
                    """,
                    (fusion_id, move_id, is_legacy),
                )

            processed_moves.add(move_id)

        for move_id in current_moves:
            if move_id not in processed_moves:
                cursor.execute(
                    "DELETE FROM fusion_moveset WHERE fusion_id = ? AND move_id = ?",
                    (fusion_id, move_id),
                )

        self.conn.commit()

