import os

# Path to the folder
folder_path = "images/shadow"

# Get all files in the folder
files = os.listdir(folder_path)

# Extract numbers from the file names with exception handling
file_numbers = []
for file in files:
    if file.startswith('shadow_pokemon_'):
        try:
            number = int(file.split('_')[2].split('.')[0])  # Change the index from 1 to 2
            file_numbers.append(number)
        except ValueError:
            # This will handle cases like '718-10' and skip them
            pass

# Check if file_numbers is empty
if not file_numbers:
    print("No valid files found in the directory.")
else:
    # Find the maximum number (assuming you want to check up to the highest number found)
    max_num = max(file_numbers)

    # Find missing numbers
    missing_numbers = set(range(1, max_num + 1)) - set(file_numbers)

    # Print missing numbers
    if missing_numbers:
        print("Missing Pokemon numbers:", sorted(missing_numbers))
    else:
        print("No Pokemon numbers are missing.")
