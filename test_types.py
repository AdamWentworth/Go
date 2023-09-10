import requests

def fetch_pokemon_types():
    print("Starting to fetch Pokémon types...")

    # Define the endpoint URL
    url = "https://pogoapi.net/api/v1/pokemon_types.json"

    # Send a GET request to the endpoint
    try:
        response = requests.get(url)
        # Raise an exception for HTTP errors, if any
        response.raise_for_status()
    except requests.RequestException as e:
        print(f"Error occurred while fetching data: {e}")
        return []

    # Check if the response has valid JSON content
    if not response.headers.get('content-type') == 'application/json':
        print("Unexpected content received. Expected JSON.")
        return []

    # Load the response JSON data
    data = response.json()

    # Debug: print the type and the first 10 items of the data
    print("Data type:", type(data))
    print("First 10 items in data:", data[:10])

    print(f"Fetched data for {len(data)} Pokémon types successfully!")
    return data

if __name__ == "__main__":
    print("Script has started.")
    types = fetch_pokemon_types()
    if types:
        for type_data in types:
            # Printing each Pokémon type's data
            print(type_data)
    else:
        print("No Pokémon type data retrieved.")
