from tkinter import filedialog, messagebox
from PIL import Image, ImageTk
import os

class ImageMethods:
    def open_local_image(self, image_url):
        # Trim leading slash from image_url if present to ensure it's treated as relative
        image_url = image_url.lstrip("\\/")

        # Combine the base path with the specific image URL
        full_image_path = os.path.join(self.relative_path_to_images, image_url)

        # Normalize the path to ensure consistent slashes
        full_image_path = os.path.normpath(full_image_path)

        # Try to open the image from the local filesystem
        try:
            image = Image.open(full_image_path)
            return ImageTk.PhotoImage(image)
        except FileNotFoundError:
            # Instead of showing an error, return None or a placeholder image
            return None  # or return self.get_placeholder_image()
        except Exception as e:
            # Log the error for debugging purposes
            print(f"Failed to open image: {e}")
            return None  # or return self.get_placeholder_image()

    def get_placeholder_image(self):
        # This method returns a placeholder image to be used when the image is missing
        try:
            placeholder = Image.open("path/to/placeholder.png")  # Update this path to your placeholder image
            return ImageTk.PhotoImage(placeholder)
        except IOError:
            # If placeholder is also missing, you can create a blank image or show an error
            return None

    def display_costume_images(self):
        # Update the UI with loaded images
        for frame_tuple in self.costume_frames:
            try:
                frame, image_label, shiny_image_label, costume_id = frame_tuple
                str_costume_id = str(costume_id)  # Ensuring it's a string

                costume = next((c for c in self.costumes if str(c[0]) == str_costume_id), None)
                if costume:
                    regular_image_path = costume[6]  # Regular image path
                    shiny_image_path = costume[7]  # Shiny image path

                    # Only attempt to update the image if a path is available
                    if regular_image_path and regular_image_path in self.images:
                        image = self.images.get(regular_image_path)
                        image_label.configure(image=image)
                        image_label.image = image  # Keep a reference
                    else:
                        image_label.configure(image=None)  # Clear the image or set to a default

                    if shiny_image_path and shiny_image_path in self.images:
                        shiny_image = self.images.get(shiny_image_path)
                        shiny_image_label.configure(image=shiny_image)
                        shiny_image_label.image = shiny_image  # Keep a reference
                    else:
                        shiny_image_label.configure(image=None)  # Clear the image or set to a default

            except Exception as e:
                print(f"Error updating costume image: {e}")

    def upload_costume_image(self, costume_id):
        # Use the existing upload_image method to get the image from the file system
        new_image = self.upload_image()
        if new_image:
            # Here you would update the database with the path of the new image
            # self.db_manager.update_costume_image_file(costume_id, file_path)
            self.images[costume_id] = new_image
            self.display_costume_images()

    def upload_image(self):
        # Upload a new image from the user's device
        file_path = filedialog.askopenfilename()
        if file_path:
            try:
                image = Image.open(file_path)
                return ImageTk.PhotoImage(image)
            except Exception as e:
                messagebox.showerror("Upload Error", f"Failed to open or process the image: {e}")
                return None