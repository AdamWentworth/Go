import os

from PIL import Image


def combine_images(pokemon_image_path, shadow_effect_path, shadow_icon_path, output_path):
    """
    Combine Pokemon image with a shadow effect and a shadow icon.

    Args:
    - pokemon_image_path: The path to the main Pokemon .png image.
    - shadow_effect_path: The path to the .png image for the shadow effect.
    - shadow_icon_path: The path to the .png image for the shadow icon.
    - output_path: The path where the final combined image should be saved.

    Returns:
    - Saves the combined image to the specified output_path.
    """

    # Open all the images
    base_image = Image.new("RGBA", (240,240), (0,0,0,0))
    pokemon_image = Image.open(pokemon_image_path).convert("RGBA")
    shadow_effect = Image.open(shadow_effect_path).convert("RGBA")
    shadow_icon = Image.open(shadow_icon_path).convert("RGBA")

    # Resize the shadow_effect
    target_width = 240
    shadow_effect = shadow_effect.resize((target_width, int((target_width/shadow_effect.width)*shadow_effect.height)))

    # Place shadow effect on the base image with a downward offset
    se_width, se_height = shadow_effect.size
    vertical_offset = 20
    se_position = ((base_image.width - se_width) // 2, (base_image.height - se_height) // 2 + vertical_offset)
    base_image.paste(shadow_effect, se_position, shadow_effect)

    # Place Pokemon image on top of the shadow effect
    base_image.paste(pokemon_image, (0, 0), pokemon_image)

    # Place shadow icon at the bottom left on top of the Pokemon image
    si_width, si_height = shadow_icon.size
    si_position = (0, base_image.height - si_height)
    base_image.paste(shadow_icon, si_position, shadow_icon)

    # Save the combined image
    base_image.save(output_path, "PNG")

# Directory paths
pokemon_directory = "D:\\Visual-Studio-Code\\Go\\frontend\\public\\images\\shiny"
output_directory = "D:\\Visual-Studio-Code\\Go\\frontend\\public\\images\\shiny_shadow"

# Paths to shadow effect and shadow icon
shadow_effect_path = "D:\\Visual-Studio-Code\\Go\\frontend\\public\\images\\shadow_effect.png"
shadow_icon_path = "D:\\Visual-Studio-Code\\Go\\frontend\\public\\images\\shadow_icon_middle_ground.png"

# Loop through each file in the pokemon_directory
for pokemon_file_name in os.listdir(pokemon_directory):
    pokemon_image_path = os.path.join(pokemon_directory, pokemon_file_name)

    # Update output file name to inject 'shadow_' after 'shiny_'
    output_file_name = pokemon_file_name.replace('shiny_', 'shiny_shadow_')
    output_image_path = os.path.join(output_directory, output_file_name)

    # Combine the images
    combine_images(pokemon_image_path, shadow_effect_path, shadow_icon_path, output_image_path)

print(f"Processed Pokémon images!")
