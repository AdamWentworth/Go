import requests

def fetch_pokemon_data():
    print("Starting to fetch Pokémon names...")

    # Define the endpoint URL
    url = "https://pogoapi.net/api/v1/pokemon_names.json"

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

    # Debug: print the type, keys, and values of data
    print("Data type:", type(data))
    print("First 10 keys in data:", list(data.keys())[:10])
    print("First 10 values in data:", list(data.values())[:10])

    # Extract Pokémon names
    pokemon_data = [data[str(key)] for key in sorted(map(int, data.keys()))]

    print(f"Fetched data for {len(pokemon_data)} Pokémon successfully!")
    return pokemon_data

if __name__ == "__main__":
    print("Script has started.")
    pokemons = fetch_pokemon_data()
    if pokemons:
        for pokemon in pokemons:
            # Printing each Pokémon's data
            print(pokemon)
    else:
        print("No Pokémon data retrieved.")
