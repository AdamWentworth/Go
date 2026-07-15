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
        parameters = list(data)
        # data excludes fusion_id: available and shiny_available are positions
        # 13 and 14. Keep shiny_rarity and the availability dates untouched.
        parameters[13] = self.conn.bool_value(parameters[13])
        parameters[14] = self.conn.bool_value(parameters[14])
        parameters = tuple(parameters) + (fusion_id,)
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
                        (self.conn.bool_value(is_legacy), fusion_id, move_id),
                    )
            else:
                cursor.execute(
                    """
                    INSERT INTO fusion_moveset (fusion_id, move_id, legacy)
                    VALUES (?, ?, ?)
                    """,
                    (fusion_id, move_id, self.conn.bool_value(is_legacy)),
                )

            processed_moves.add(move_id)

        for move_id in current_moves:
            if move_id not in processed_moves:
                cursor.execute(
                    "DELETE FROM fusion_moveset WHERE fusion_id = ? AND move_id = ?",
                    (fusion_id, move_id),
                )

        self.conn.commit()

    def _ensure_fusion_background_combo_rules_table(self):
        if self.conn.is_postgres:
            return
        cursor = self.conn.get_cursor()
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS fusion_background_combo_rules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                fusion_id INTEGER NOT NULL,
                member1_background_id INTEGER NOT NULL,
                member2_background_id INTEGER NOT NULL,
                combo_background_id INTEGER NOT NULL,
                is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
                notes TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (fusion_id, member1_background_id, member2_background_id, combo_background_id)
            )
            """
        )
        cursor.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_fusion_bg_combo_rules_fusion_id
            ON fusion_background_combo_rules (fusion_id)
            """
        )
        self.conn.commit()

    def fetch_fusion_background_rule_rows(self, fusion_id):
        self._ensure_fusion_background_combo_rules_table()
        cursor = self.conn.get_cursor()
        cursor.execute(
            """
            SELECT
                r.id,
                r.fusion_id,
                r.member1_background_id,
                b1.name AS member1_background_name,
                b1.image_url AS member1_background_image_url,
                r.member2_background_id,
                b2.name AS member2_background_name,
                b2.image_url AS member2_background_image_url,
                r.combo_background_id,
                b3.name AS combo_background_name,
                b3.image_url AS combo_background_image_url,
                COALESCE(r.is_active, 1) AS is_active,
                r.notes
            FROM fusion_background_combo_rules r
            LEFT JOIN backgrounds b1
                ON b1.background_id = r.member1_background_id
            LEFT JOIN backgrounds b2
                ON b2.background_id = r.member2_background_id
            LEFT JOIN backgrounds b3
                ON b3.background_id = r.combo_background_id
            WHERE r.fusion_id = ?
            ORDER BY r.id
            """,
            (int(fusion_id),),
        )
        return cursor.fetchall()

    def add_fusion_background_rule(
        self,
        fusion_id,
        member1_background_id,
        member2_background_id,
        combo_background_id,
        is_active=1,
        notes=None,
    ):
        self._ensure_fusion_background_combo_rules_table()
        fusion_id = int(fusion_id)
        member1_background_id = int(member1_background_id)
        member2_background_id = int(member2_background_id)
        combo_background_id = int(combo_background_id)
        active_value = self.conn.bool_value(1 if int(is_active) else 0)

        cursor = self.conn.get_cursor()
        cursor.execute(
            """
            INSERT INTO fusion_background_combo_rules (
                fusion_id,
                member1_background_id,
                member2_background_id,
                combo_background_id,
                is_active,
                notes
            )
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(fusion_id, member1_background_id, member2_background_id, combo_background_id)
            DO UPDATE SET
                is_active = excluded.is_active,
                notes = excluded.notes,
                updated_at = CURRENT_TIMESTAMP
            """,
            (
                fusion_id,
                member1_background_id,
                member2_background_id,
                combo_background_id,
                active_value,
                notes,
            ),
        )
        self.conn.commit()

        cursor.execute(
            """
            SELECT id
            FROM fusion_background_combo_rules
            WHERE fusion_id = ?
              AND member1_background_id = ?
              AND member2_background_id = ?
              AND combo_background_id = ?
            """,
            (
                fusion_id,
                member1_background_id,
                member2_background_id,
                combo_background_id,
            ),
        )
        row = cursor.fetchone()
        return row[0] if row else None

    def update_fusion_background_rule(
        self,
        rule_id,
        member1_background_id,
        member2_background_id,
        combo_background_id,
        is_active=1,
        notes=None,
    ):
        self._ensure_fusion_background_combo_rules_table()
        cursor = self.conn.get_cursor()
        cursor.execute(
            """
            UPDATE fusion_background_combo_rules
            SET member1_background_id = ?,
                member2_background_id = ?,
                combo_background_id = ?,
                is_active = ?,
                notes = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (
                int(member1_background_id),
                int(member2_background_id),
                int(combo_background_id),
                self.conn.bool_value(1 if int(is_active) else 0),
                notes,
                int(rule_id),
            ),
        )
        self.conn.commit()

    def delete_fusion_background_rule(self, rule_id):
        self._ensure_fusion_background_combo_rules_table()
        cursor = self.conn.get_cursor()
        cursor.execute(
            "DELETE FROM fusion_background_combo_rules WHERE id = ?",
            (int(rule_id),),
        )
        self.conn.commit()
