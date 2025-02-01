import requests

# API URL
API_URL = "https://pogoapi.net/api/v1/pokemon_height_weight_scale.json"

def fetch_pokemon_data():
    """Fetch Pokémon size data from the API."""
    try:
        response = requests.get(API_URL)
        response.raise_for_status()  # Raises HTTPError for bad responses
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")
        return []

def tally_forms(data):
    """
    Iterate over all entries in the data, tallying the count for each 
    unique value found in the 'form' key.
    """
    form_counts = {}
    for entry in data:
        # Get the form value; if missing, default to 'unknown'
        form_value = entry.get("form", "unknown")
        form_counts[form_value] = form_counts.get(form_value, 0) + 1
    return form_counts

def main():
    print("Fetching Pokémon data...")
    data = fetch_pokemon_data()
    
    if not data:
        print("No data fetched. Exiting.")
        return

    # Tally the forms in the raw JSON data
    forms_tally = tally_forms(data)
    
    print("\nTally of 'form' values in the data:")
    for form, count in forms_tally.items():
        print(f"  {form}: {count}")

if __name__ == "__main__":
    main()
