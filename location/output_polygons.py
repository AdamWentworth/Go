import os
import json

def parse_osm_file(osm_file, output_folder):
    """
    Parse an OSM file and write each polygon into its own file.
    
    :param osm_file: Path to the OSM file (in JSON format).
    :param output_folder: Path to the folder where the files will be saved.
    """
    # Create output folder if it doesn't exist
    os.makedirs(output_folder, exist_ok=True)
    
    # Load the OSM JSON file
    with open(osm_file, 'r', encoding='utf-8') as f:
        osm_data = json.load(f)
    
    # Check if the file contains the expected structure
    if 'members' not in osm_data:
        raise ValueError("Invalid OSM file format. Expected 'members' key in the JSON.")
    
    polygons = []
    for member in osm_data['members']:
        if member['type'] == 'way' and 'geometry' in member:
            polygons.append(member)
    
    # Save each polygon to a separate file
    for idx, polygon in enumerate(polygons):
        # Prepare the GeoJSON structure
        geojson = {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [[
                    [point['lon'], point['lat']] for point in polygon['geometry']
                ]]
            },
            "properties": {
                "id": polygon['ref'],
                "role": polygon.get('role', 'unknown')
            }
        }
        
        # Define the output file path
        output_file = os.path.join(output_folder, f"polygon_{idx + 1}.geojson")
        
        # Write the GeoJSON to the file
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(geojson, f, indent=2)
    
    print(f"Extracted {len(polygons)} polygons to '{output_folder}'")

# Example usage
osm_file = "./debug_osm_341906.json"  # Replace with your OSM file path
output_folder = "output_polygons"       # Replace with your desired output folder name
parse_osm_file(osm_file, output_folder)
