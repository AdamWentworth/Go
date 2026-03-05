class MoveManager:
    ALLOWED_SORT_FIELDS = {
        "move_id",
        "name",
        "type_id",
        "is_fast",
        "fusion_id",
        "raid_power",
        "pvp_power",
    }

    def __init__(self, db_conn):
        self.conn = db_conn

    def fetch_all_moves_sorted(self, sort_by="move_id"):
        safe_sort = sort_by if sort_by in self.ALLOWED_SORT_FIELDS else "move_id"
        cursor = self.conn.get_cursor()
        cursor.execute(
            f"""
            SELECT m.move_id, m.name, m.is_fast, t.name
            FROM moves m
            LEFT JOIN types t
                ON t.type_id = m.type_id
            ORDER BY m.{safe_sort}, m.move_id
            """
        )
        rows = cursor.fetchall()

        formatted = []
        for move_id, name, is_fast, type_name in rows:
            speed_label = "Fast" if is_fast else "Charged"
            type_label = type_name if type_name else "Unknown"
            formatted.append(f"{move_id}: {name} ({speed_label}, {type_label})")
        return formatted

    def fetch_move_details(self, move_id):
        cursor = self.conn.get_cursor()
        cursor.execute(
            """
            SELECT
                move_id,
                name,
                type_id,
                raid_power,
                pvp_power,
                raid_energy,
                pvp_energy,
                raid_cooldown,
                pvp_turns,
                is_fast,
                fusion_id,
                shadow,
                purified,
                apex
            FROM moves
            WHERE move_id = ?
            """,
            (int(move_id),),
        )
        return cursor.fetchone()

    def add_move(self, move_id, data):
        cursor = self.conn.get_cursor()
        if move_id is None:
            cursor.execute(
                """
                INSERT INTO moves (
                    name,
                    type_id,
                    raid_power,
                    pvp_power,
                    raid_energy,
                    pvp_energy,
                    raid_cooldown,
                    pvp_turns,
                    is_fast,
                    fusion_id,
                    shadow,
                    purified,
                    apex
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                data,
            )
            new_move_id = cursor.lastrowid
        else:
            cursor.execute(
                """
                INSERT INTO moves (
                    move_id,
                    name,
                    type_id,
                    raid_power,
                    pvp_power,
                    raid_energy,
                    pvp_energy,
                    raid_cooldown,
                    pvp_turns,
                    is_fast,
                    fusion_id,
                    shadow,
                    purified,
                    apex
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (int(move_id),) + tuple(data),
            )
            new_move_id = int(move_id)
        self.conn.commit()
        return new_move_id

    def update_move(self, move_id, data):
        cursor = self.conn.get_cursor()
        cursor.execute(
            """
            UPDATE moves
            SET
                name = ?,
                type_id = ?,
                raid_power = ?,
                pvp_power = ?,
                raid_energy = ?,
                pvp_energy = ?,
                raid_cooldown = ?,
                pvp_turns = ?,
                is_fast = ?,
                fusion_id = ?,
                shadow = ?,
                purified = ?,
                apex = ?
            WHERE move_id = ?
            """,
            tuple(data) + (int(move_id),),
        )
        self.conn.commit()

    def delete_move(self, move_id):
        move_id_int = int(move_id)
        cursor = self.conn.get_cursor()
        cursor.execute("DELETE FROM pokemon_moves WHERE move_id = ?", (move_id_int,))
        cursor.execute("DELETE FROM fusion_moveset WHERE move_id = ?", (move_id_int,))
        cursor.execute("DELETE FROM moves WHERE move_id = ?", (move_id_int,))
        self.conn.commit()

    def count_move_usage(self, move_id):
        move_id_int = int(move_id)
        cursor = self.conn.get_cursor()

        cursor.execute(
            "SELECT COUNT(*) FROM pokemon_moves WHERE move_id = ?",
            (move_id_int,),
        )
        pokemon_count = cursor.fetchone()[0]

        cursor.execute(
            "SELECT COUNT(*) FROM fusion_moveset WHERE move_id = ?",
            (move_id_int,),
        )
        fusion_count = cursor.fetchone()[0]

        return {
            "pokemon_moves": pokemon_count,
            "fusion_moveset": fusion_count,
            "total": pokemon_count + fusion_count,
        }
