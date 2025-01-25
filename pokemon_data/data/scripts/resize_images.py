import os
from PIL import Image

def resize_image(image_path, size=(240, 240)):
    """
    Resize the image to the specified size and overwrite the original image.

    Parameters:
    - image_path (str): Path to the image to be resized.
    - size (tuple): Desired size for the image (width, height).
    """
    try:
        # Open the image
        with Image.open(image_path) as img:
            # Convert image to RGBA to preserve transparency if necessary
            img = img.convert("RGBA")
            # Resize the image
            img_resized = img.resize(size, Image.ANTIALIAS)
            # Overwrite the original image with the resized image
            img_resized.save(image_path, format=img.format)
            print(f"Resized and saved: {image_path}")
    except Exception as e:
        print(f"Failed to resize {image_path}: {e}")

def resize_directory(input_dir, size=(240, 240)):
    """
    Iterate through all images in the input directory and resize them.

    Parameters:
    - input_dir (str): Path to the directory containing images to be resized.
    - size (tuple): Desired size for the images (width, height).
    """
    if not os.path.isdir(input_dir):
        print(f"Input directory does not exist: {input_dir}")
        return

    # Supported image extensions
    supported_extensions = ('.png', '.jpg', '.jpeg', '.bmp', '.gif', '.tiff')

    # Iterate over all files in the input directory and its subdirectories
    for root, dirs, files in os.walk(input_dir):
        for file in files:
            if file.lower().endswith(supported_extensions):
                image_path = os.path.join(root, file)
                resize_image(image_path, size)
            else:
                print(f"Skipped unsupported file: {os.path.join(root, file)}")

def main():
    """
    Main function to set up paths and start the resizing process.
    """
    # ======= Configuration =======

    # Path to the directory containing images to be resized
    input_dir = r'A:\Visual-Studio-Code\Go\frontend\public\images\gigantamax'  # Update this path

    # Desired size for the images
    desired_size = (240, 240)  # Width, Height

    # =============================

    # Start resizing
    resize_directory(input_dir, desired_size)

if __name__ == "__main__":
    main()
