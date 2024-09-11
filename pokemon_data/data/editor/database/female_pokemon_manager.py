# female_pokemon_manager.py

class FemalePokemonManager:
    def __init__(self, db_conn):
        self.conn = db_conn

    def fetch_female_pokemon(self):
        """
        Fetch all Pokémon IDs that have a unique female form along with their image URLs.
        """
        cursor = self.conn.get_cursor()
        cursor.execute("""
            SELECT pokemon_id, image_url, shiny_image_url, shadow_image_url, shiny_shadow_image_url
            FROM female_pokemon
        """)
        result = cursor.fetchall()
        return result

    def fetch_female_pokemon_image_data(self, pokemon_id):
        """
        Fetch the image data for a specific Pokémon with a unique female form.
        """
        cursor = self.conn.get_cursor()
        cursor.execute("""
            SELECT image_url, shiny_image_url, shadow_image_url, shiny_shadow_image_url
            FROM female_pokemon
            WHERE pokemon_id = ?
        """, (pokemon_id,))
        result = cursor.fetchone()
        if result:
            return {
                'image_url': result[0],
                'shiny_image_url': result[1],
                'shadow_image_url': result[2],
                'shiny_shadow_image_url': result[3]
            }
        else:
            return {
                'image_url': None,
                'shiny_image_url': None,
                'shadow_image_url': None,
                'shiny_shadow_image_url': None
            }

    def update_female_pokemon_images(self, pokemon_id, image_data):
        """
        Update image URLs for the Pokémon with a unique female form.
        image_data should be a dictionary with keys: image_url, shiny_image_url, shadow_image_url, shiny_shadow_image_url.
        """
        cursor = self.conn.get_cursor()

        # Fetch the current image data to prevent overwriting existing URLs with NULL
        current_data = self.fetch_female_pokemon_image_data(pokemon_id)

        # Only update the fields that are provided in image_data, keep others unchanged
        updated_image_data = {
            'image_url': image_data.get('image_url', current_data['image_url']),
            'shiny_image_url': image_data.get('shiny_image_url', current_data['shiny_image_url']),
            'shadow_image_url': image_data.get('shadow_image_url', current_data['shadow_image_url']),
            'shiny_shadow_image_url': image_data.get('shiny_shadow_image_url', current_data['shiny_shadow_image_url'])
        }

        cursor.execute("""
            UPDATE female_pokemon
            SET image_url = ?, shiny_image_url = ?, shadow_image_url = ?, shiny_shadow_image_url = ?
            WHERE pokemon_id = ?
        """, (updated_image_data['image_url'], 
              updated_image_data['shiny_image_url'], 
              updated_image_data['shadow_image_url'], 
              updated_image_data['shiny_shadow_image_url'], 
              pokemon_id))
        self.conn.commit()