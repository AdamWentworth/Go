import requests
from PIL import Image
from io import BytesIO

# URL of the image
image_url = "https://static.wikia.nocookie.net/pokemongo/images/6/65/Icon_Water.png/revision/latest?cb=20171219195830"

# Fetch the image
response = requests.get(image_url)

# Check if the request was successful
if response.status_code == 200:
    # Open the image using PIL
    image = Image.open(BytesIO(response.content))
    
    # Resize the image to 240x240 pixels
    image_resized = image.resize((62, 62))
    
    # Save the resized image as a .png
    image_resized.save("shiny.png", "PNG")
    print("Image downloaded and resized successfully!")
else:
    print("Failed to fetch the image.")
