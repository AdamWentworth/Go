import os
import re

def extract_pokemon_id(filename):
    """Extracts the pokemon_id from the filename."""
    match = re.search(r'pokemon_(\d+)', filename)
    if match:
        return int(match.group(1))
    return None

def main():
    shiny_folder = "D:/Visual-Studio-Code/Go/images/costumes_shiny"
    default_folder = "D:/Visual-Studio-Code/Go/images/costumes"

    shiny_files = os.listdir(shiny_folder)
    default_files = os.listdir(default_folder)

    # Group files by pokemon_id
    shiny_grouped = {}
    for file in shiny_files:
        pid = extract_pokemon_id(file)
        if pid:
            shiny_name = file.replace(f'pokemon_{pid}_', '').replace('_shiny.png', '')
            shiny_grouped[pid] = shiny_name

    default_grouped = {}
    for file in default_files:
        pid = extract_pokemon_id(file)
        if pid:
            default_name = file.replace(f'pokemon_{pid}_', '').replace('_default.png', '')
            default_grouped.setdefault(pid, []).append(default_name)

    # Identify and rename files
    for pid, default_names in default_grouped.items():
        if pid in shiny_grouped and len(default_names) == 1:
            old_name = default_names[0]
            new_name = shiny_grouped[pid]
            if old_name != new_name:
                old_path = os.path.join(default_folder, f"pokemon_{pid}_{old_name}_default.png")
                new_path = os.path.join(default_folder, f"pokemon_{pid}_{new_name}_default.png")
                os.rename(old_path, new_path)
                print(f"Renamed: {old_name} to {new_name}")

if __name__ == "__main__":
    main()
