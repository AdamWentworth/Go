class BackgroundPokemonManager:
    def __init__(self, db_conn):
        self.conn = db_conn

    def fetch_all_backgrounds(self):
        cursor = self.conn.get_cursor()
        cursor.execute(
            """
            SELECT background_id, name, location, image_url, date
            FROM backgrounds
            ORDER BY background_id
            """
        )
        return cursor.fetchall()

    def fetch_pokemon_background_rows(self, pokemon_id):
        cursor = self.conn.get_cursor()
        link_row_id = "pb.id" if self.conn.is_postgres else "pb.rowid"
        cursor.execute(
            f"""
            SELECT
                {link_row_id} AS link_row_id,
                pb.pokemon_id,
                pb.background_id,
                pb.costume_id,
                b.name,
                b.location,
                b.image_url,
                b.date
            FROM pokemon_backgrounds pb
            INNER JOIN backgrounds b
                ON b.background_id = pb.background_id
            WHERE pb.pokemon_id = ?
            ORDER BY b.background_id, COALESCE(pb.costume_id, 0)
            """,
            (pokemon_id,),
        )
        return cursor.fetchall()

    def add_background(self, name, location, image_url, date_value):
        cursor = self.conn.get_cursor()
        background_id = self.conn.next_identifier("backgrounds", "background_id")
        if background_id is not None:
            cursor.execute(
                """
                INSERT INTO backgrounds (background_id, name, location, image_url, date)
                VALUES (?, ?, ?, ?, ?)
                """,
                (background_id, name, location, image_url, date_value),
            )
            self.conn.commit()
            return background_id
        cursor.execute(
            """
            INSERT INTO backgrounds (name, location, image_url, date)
            VALUES (?, ?, ?, ?)
            """,
            (name, location, image_url, date_value),
        )
        self.conn.commit()
        return cursor.lastrowid

    def update_background(self, background_id, name, location, image_url, date_value):
        cursor = self.conn.get_cursor()
        cursor.execute(
            """
            UPDATE backgrounds
            SET name = ?, location = ?, image_url = ?, date = ?
            WHERE background_id = ?
            """,
            (name, location, image_url, date_value, background_id),
        )
        self.conn.commit()

    def delete_background(self, background_id):
        cursor = self.conn.get_cursor()
        cursor.execute(
            "DELETE FROM pokemon_backgrounds WHERE background_id = ?",
            (background_id,),
        )
        cursor.execute(
            "DELETE FROM backgrounds WHERE background_id = ?",
            (background_id,),
        )
        self.conn.commit()

    def count_background_usage(self, background_id):
        cursor = self.conn.get_cursor()
        cursor.execute(
            "SELECT COUNT(*) FROM pokemon_backgrounds WHERE background_id = ?",
            (background_id,),
        )
        row = cursor.fetchone()
        return row[0] if row else 0

    def add_pokemon_background_link(self, pokemon_id, background_id, costume_id):
        cursor = self.conn.get_cursor()
        return_id = self.conn.insert_returning_id(
            cursor,
            """
            INSERT INTO pokemon_backgrounds (pokemon_id, background_id, costume_id)
            VALUES (?, ?, ?)
            """,
            (pokemon_id, background_id, costume_id),
            "id",
        )
        self.conn.commit()
        return return_id

    def update_pokemon_background_link(self, link_row_id, background_id, costume_id):
        cursor = self.conn.get_cursor()
        link_column = "id" if self.conn.is_postgres else "rowid"
        cursor.execute(
            f"""
            UPDATE pokemon_backgrounds
            SET background_id = ?, costume_id = ?
            WHERE {link_column} = ?
            """,
            (background_id, costume_id, link_row_id),
        )
        self.conn.commit()

    def delete_pokemon_background_link(self, link_row_id):
        cursor = self.conn.get_cursor()
        link_column = "id" if self.conn.is_postgres else "rowid"
        cursor.execute(
            f"DELETE FROM pokemon_backgrounds WHERE {link_column} = ?",
            (link_row_id,),
        )
        self.conn.commit()
