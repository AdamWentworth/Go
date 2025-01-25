import os
from PIL import Image

def combine_images(base_image_path, shiny_icon_path, output_path, size=(240, 240)):
    """
    Combine the base Pokémon image with the shiny icon.

    Parameters:
    - base_image_path (str): Path to the base Pokémon image.
    - shiny_icon_path (str): Path to the shiny icon image.
    - output_path (str): Path where the combined image will be saved.
    - size (tuple): Desired size for the base image (width, height).
    """
    try:
        # Open and resize the base image
        base_image = Image.open(base_image_path).convert("RGBA")
        base_image = base_image.resize(size, Image.ANTIALIAS)

        # Open the shiny icon
        shiny_icon = Image.open(shiny_icon_path).convert("RGBA")
        # Optionally, resize the shiny icon if it's not the desired size
        # shiny_icon = shiny_icon.resize((desired_width, desired_height), Image.ANTIALIAS)

        # Combine images
        combined_image = base_image.copy()
        combined_image.paste(shiny_icon, (0, 0), shiny_icon)  # Adjust position as needed

        # Ensure the output directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        # Save the combined image in PNG format to preserve transparency
        combined_image.save(output_path, "PNG")
        print(f"Processed and saved: {output_path}")
    except Exception as e:
        print(f"Failed to process {base_image_path}: {e}")

def process_directory(input_dir, shiny_icon_path, output_dir=None):
    """
    Process all images in the input directory by applying the shiny icon.

    Parameters:
    - input_dir (str): Path to the directory containing original images.
    - shiny_icon_path (str): Path to the shiny icon image.
    - output_dir (str, optional): Path to save processed images. Defaults to 'output' folder inside input_dir.
    """
    if not os.path.isdir(input_dir):
        print(f"Input directory does not exist: {input_dir}")
        return

    if not os.path.isfile(shiny_icon_path):
        print(f"Shiny icon file does not exist: {shiny_icon_path}")
        return

    if output_dir is None:
        output_dir = os.path.join(input_dir, 'output')

    # Supported image extensions
    supported_extensions = ('.png', '.jpg', '.jpeg', '.bmp', '.gif', '.tiff')

    # Iterate over all files in the input directory
    for root, dirs, files in os.walk(input_dir):
        for file in files:
            if file.lower().endswith(supported_extensions):
                base_image_path = os.path.join(root, file)
                # Determine relative path to maintain directory structure in output
                relative_path = os.path.relpath(root, input_dir)
                output_subdir = os.path.join(output_dir, relative_path)
                # Change file extension to .png to ensure consistency
                file_name, _ = os.path.splitext(file)
                output_file_name = f"{file_name}_shiny.png"
                output_path = os.path.join(output_subdir, output_file_name)
                combine_images(base_image_path, shiny_icon_path, output_path)
            else:
                print(f"Skipped unsupported file: {os.path.join(root, file)}")

def main():
    """
    Main function to set up paths and start processing.
    """
    # ======= Configuration =======
    
    # Path to the directory containing original Pokémon images
    input_dir = r'A:\\Visual-Studio-Code\\Go\\frontend\\public\\images\\shiny_gigantamax'  # e.g., r'C:\Users\YourName\Pictures\Pokemon'

    # Path to the shiny icon image
    shiny_icon_path = r'A:\\Visual-Studio-Code\\Go\\frontend\\public\\images\\shiny_icon.png'  # e.g., r'C:\Users\YourName\Pictures\Icons\shiny_icon.png'

    # Path to save processed images
    # If set to None, an 'output' folder will be created inside the input directory
    output_dir = r'A:\\Visual-Studio-Code\\Go\\frontend\\public\\images\\shiny_gigantamax_2'  # e.g., r'C:\Users\YourName\Pictures\Processed_Pokemon'
    # To use the default 'output' directory inside input_dir, set to None:
    # output_dir = None

    # =============================

    # Start processing
    process_directory(input_dir, shiny_icon_path, output_dir)

if __name__ == "__main__":
    main()
