import sqlite3

# Database connection
db_path = '../pokego.db'  # Update with the path to your database
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Fetch all costumes with pokemon_id = 25 from the costume_pokemon table
cursor.execute("""
    SELECT costume_id, image_url_costume, image_url_shiny_costume 
    FROM costume_pokemon 
    WHERE pokemon_id = 25
""")
costumes = cursor.fetchall()

# Loop through each costume record
for costume in costumes:
    costume_id, image_url_costume, image_url_shiny_costume = costume

    # Create the female versions of the image URLs
    image_url_costume_female = image_url_costume.replace("/images/costumes/", "/images/female/costumes/female_")
    image_url_shiny_costume_female = image_url_shiny_costume.replace("/images/costumes_shiny/", "/images/female/costumes_shiny/female_")

    # Update the costume_pokemon table with the female version URLs
    update_query = """
    UPDATE costume_pokemon
    SET image_url_costume_female = ?, image_url_shiny_costume_female = ?
    WHERE costume_id = ?
    """
    cursor.execute(update_query, (image_url_costume_female, image_url_shiny_costume_female, costume_id))

# Commit changes and close the connection
conn.commit()
conn.close()

print("Female costume image URLs have been updated for pokemon_id 25.")
