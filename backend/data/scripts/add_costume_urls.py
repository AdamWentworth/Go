import sqlite3

# Database connection
db_path = 'backend/data/pokego.db'  # Update with the path to your database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Fetch all costumes from the costume_pokemon table
cursor.execute("SELECT costume_id, pokemon_id, costume_name FROM costume_pokemon")
costumes = cursor.fetchall()

# Update each costume with the new image URLs
for costume in costumes:
    costume_id, pokemon_id, costume_name = costume

    # Define the new URLs
    image_url = f"/images/costumes/pokemon_{pokemon_id}_{costume_name}_default.png"
    shiny_image_url = f"/images/costumes_shiny/pokemon_{pokemon_id}_{costume_name}_shiny.png"

    # Replace spaces with underscores in URLs for consistency
    image_url = image_url.replace(" ", "_")
    shiny_image_url = shiny_image_url.replace(" ", "_")

    # Update the costume_pokemon table with the new URLs
    update_query = """
    UPDATE costume_pokemon
    SET image_url_costume = ?, image_url_shiny_costume = ?
    WHERE costume_id = ?
    """
    cursor.execute(update_query, (image_url, shiny_image_url, costume_id))

# Commit changes and close the connection
conn.commit()
conn.close()

print("All costume image URLs have been updated.")
