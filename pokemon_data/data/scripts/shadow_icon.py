from PIL import Image

def average_color(image_path):
    """
    Compute the average color of an image.

    Args:
    - image_path: The path to the input .png image.
    
    Returns:
    - A tuple representing the average color in the format (R, G, B).
    """

    # Open the image
    image = Image.open(image_path)
    image_data = image.getdata()

    r_total, g_total, b_total = 0, 0, 0
    count = 0

    for pixel in image_data:
        if pixel[3] > 0:  # Ensure it's not a transparent pixel
            r_total += pixel[0]
            g_total += pixel[1]
            b_total += pixel[2]
            count += 1

    # Calculate the average color
    avg_r = r_total // count
    avg_g = g_total // count
    avg_b = b_total // count

    return (avg_r, avg_g, avg_b)

def recolor_image(input_image_path, output_image_path, color):
    """
    Recolor an image with a given color.

    Args:
    - input_image_path: The path to the input .png image.
    - output_image_path: The path where the processed image should be saved.
    - color: A tuple representing the color to be used for recoloring.
    """

    # Open the image
    image = Image.open(input_image_path).convert("RGBA")
    datas = image.getdata()

    new_data = []
    for item in datas:
        # Preserve alpha value (transparency) but replace color
        new_data.append((color[0], color[1], color[2], item[3]))

    image.putdata(new_data)
    image.save(output_image_path, "PNG")

def middle_color(color1, color2):
    """
    Compute the average of two colors.

    Args:
    - color1, color2: Two tuples representing the colors in the format (R, G, B).
    
    Returns:
    - A tuple representing the average color in the format (R, G, B).
    """
    r_avg = (color1[0] + color2[0]) // 2
    g_avg = (color1[1] + color2[1]) // 2
    b_avg = (color1[2] + color2[2]) // 2

    return (r_avg, g_avg, b_avg)

# Get the average color from shadow_effect.png
avg_color_shadow_effect = average_color("D:\\Visual-Studio-Code\\Go\\frontend\\public\\images\\shadow_effect.png")

# Get the average color from the original shadow_icon_smooth.png
avg_color_original = average_color("D:\\Visual-Studio-Code\\Go\\frontend\\public\\images\\shadow_icon_smooth.png")

# Compute the middle ground color
middle_ground_color = middle_color(avg_color_shadow_effect, avg_color_original)

# Recolor the shadow_icon_smooth.png using the middle ground color
recolor_image("D:\\Visual-Studio-Code\\Go\\frontend\\public\\images\\shadow_icon_smooth.png",
              "D:\\Visual-Studio-Code\\Go\\frontend\\public\\images\\shadow_icon_middle_ground.png",
              middle_ground_color)
