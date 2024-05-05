import os

from PIL import Image


def combine_images(pokemon_image_path, shadow_icon_path, output_path):
    """
    Combine Pokemon image with a shadow icon.

    Args:
    - pokemon_image_path: The path to the main Pokemon .png image.
    - shadow_icon_path: The path to the .png image for the shadow icon.
    - output_path: The path where the final combined image should be saved.

    Returns:
    - Saves the combined image to the specified output_path.
    """

    # Open both the images
    pokemon_image = Image.open(pokemon_image_path).convert("RGBA")
    shadow_icon = Image.open(shadow_icon_path).convert("RGBA")

    # Place shadow icon at the top left on top of the Pokemon image
    base_image = pokemon_image.copy()
    base_image.paste(shadow_icon, (0, 0), shadow_icon)

    # Save the combined image
    base_image.save(output_path, "PNG")

# Directory paths
pokemon_directory = "D:\\Visual-Studio-Code\\Go\\frontend\\public\\images\\backup\\shiny"
output_directory = "D:\\Visual-Studio-Code\\Go\\frontend\\public\\images\\shiny"

# Path to shadow icon
shiny_icon_path = "D:\\Visual-Studio-Code\\Go\\frontend\\public\\images\\shiny_icon.png"

# Loop through each file in the pokemon_directory
for pokemon_file_name in os.listdir(pokemon_directory):
    pokemon_image_path = os.path.join(pokemon_directory, pokemon_file_name)

    # Update output file name to inject 'shadow_' after 'shiny_'
    output_file_name = pokemon_file_name
    output_image_path = os.path.join(output_directory, output_file_name)

    # Combine the images
    combine_images(pokemon_image_path, shiny_icon_path, output_image_path)

print(f"Processed Pokémon images!")
