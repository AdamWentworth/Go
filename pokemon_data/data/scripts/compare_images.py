import os
import re

def get_normalized_files(folder_path, suffix_to_remove):
    """
    Returns a set of filenames after removing the provided suffix.
    """
    files = os.listdir(folder_path)
    normalized_files = {f.replace(suffix_to_remove, '') for f in files if f.endswith(suffix_to_remove)}
    return normalized_files

def sort_files(files):
    # Extract numeric part from the filename for sorting
    def key_func(filename):
        match = re.search(r'(\d+)', filename)
        if match:
            return int(match.group(1))
        return 0

    return sorted(files, key=key_func)

def main():
    folder1_path = "D:/Visual-Studio-Code/Go/images/costumes_shiny"
    folder2_path = "D:/Visual-Studio-Code/Go/images/costumes"

    shiny_files = get_normalized_files(folder1_path, "_shiny.png")
    default_files = get_normalized_files(folder2_path, "_default.png")

    unique_to_shiny = sort_files(shiny_files - default_files)
    unique_to_default = sort_files(default_files - shiny_files)

    print("Files unique to costumes_shiny:")
    for f in unique_to_shiny:
        print(f + "_shiny.png")
        
    print("\nFiles unique to costumes:")
    for f in unique_to_default:
        print(f + "_default.png")

if __name__ == "__main__":
    main()
