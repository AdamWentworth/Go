import os
import requests
from PIL import Image
from io import BytesIO

def download_image(url, save_folder):
    try:
        # Fetch the image
        response = requests.get(url, stream=True)
        response.raise_for_status()  # Raise an exception for HTTP errors

        # Create a generic filename
        filename = "pokemon_1172.png"
        save_path = os.path.join(save_folder, filename)

        # Resize and save the image
        image = Image.open(BytesIO(response.content))
        image_resized = image.resize((240, 240))
        image_resized.save(save_path, "PNG")
        print(f"Image downloaded, resized, and saved to {save_path}")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    image_url = "https://static.wikia.nocookie.net/pokemongo/images/e/e4/Vivillon.png/revision/latest?cb=20221203131823"
    save_folder = "D:/Visual-Studio-Code/Go/frontend/public/images/default"

    download_image(image_url, save_folder)
