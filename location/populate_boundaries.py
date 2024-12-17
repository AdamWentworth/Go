import psycopg2
from psycopg2 import sql
import requests
import json
import sys
from shapely.geometry import LineString, Polygon, MultiPolygon
from shapely.ops import unary_union, polygonize
from shapely.validation import make_valid
from shapely import wkt
from sqlalchemy import create_engine, Column, Integer, String, Text, Float, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
import os

# ---------------------------
# Configuration
# ---------------------------

# Database configuration
DB_CONFIG = {
    'user': 'postgres',
    'password': 'REMOVED_PASSWORD',
    'host': 'localhost',
    'port': '5432',
    'database': 'locations'
}

# Base declarative class for SQLAlchemy
Base = declarative_base()

# Define the Countries model
class Country(Base):
    __tablename__ = 'countries'
    
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    country_code = Column(String(2), unique=True, nullable=False)
    centroid = Column(Text, nullable=True)  # Assuming WKT representation
    boundary = Column(Text, nullable=True)  # Assuming WKT representation
    places = relationship("Place", back_populates="country")

# Define the Places model
class Place(Base):
    __tablename__ = 'places'
    
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    country_id = Column(Integer, ForeignKey('countries.id'), nullable=False)
    country = relationship("Country", back_populates="places")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    state_or_province = Column(String, nullable=False)
    boundary = Column(String, nullable=False)  # WKT representation
    osm_id = Column(Integer, unique=True, nullable=False)
    population = Column(Integer, nullable=True)
    admin_level = Column(Integer, nullable=True)

def get_countries_without_places(session):
    """
    Fetch countries that do not yet have places populated.

    Args:
        session: SQLAlchemy session

    Returns:
        list: List of country objects with no corresponding places.
    """
    from sqlalchemy.sql import exists
    
    # Subquery to find country IDs present in places
    country_ids_with_places = session.query(Place.country_id).distinct()
    
    # Query countries where no places exist
    countries_without_places = (
        session.query(Country)
        .filter(~Country.id.in_(country_ids_with_places))
        .all()
    )
    
    return countries_without_places

# ---------------------------
# Database Setup
# ---------------------------

def get_db_engine():
    """Create and return a SQLAlchemy engine."""
    db_uri = f"postgresql+psycopg2://{DB_CONFIG['user']}:{DB_CONFIG['password']}@" \
             f"{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}"
    engine = create_engine(db_uri)
    return engine

def create_tables(engine):
    """Create tables in the database based on the models."""
    Base.metadata.create_all(engine)

# ---------------------------
# PolygonProcessor Class
# ---------------------------

class PolygonProcessor:
    def __init__(self):
        """
        Initialize the processor with empty accumulators.
        """
        self.parts = []  # Accumulated LineString parts

    def parse_line_strings(self, place):
        """
        Parse LineStrings from Overpass API data for a given place.

        Args:
            place (dict): A single relation element from Overpass API.

        Returns:
            list: A list of Shapely LineString objects.
        """
        members = place.get('members', [])
        if not members:
            return []

        line_strings = []

        for member in members:
            if member.get('type') != 'way' or 'geometry' not in member:
                continue

            coords = [(float(point['lon']), float(point['lat'])) for point in member['geometry']]

            # Ensure the LineString is valid
            if len(coords) < 2:
                continue  # Not enough points to form a LineString

            try:
                line = LineString(coords)
                if not line.is_valid:
                    line = make_valid(line)
                if isinstance(line, LineString):
                    line_strings.append(line)
            except Exception as e:
                print(f"[WARN] Could not create LineString from way {member.get('id')}: {e}", file=sys.stderr)
                continue

        return line_strings

    def add_line_strings(self, line_strings):
        """
        Add LineStrings to the accumulator and attempt to polygonize.

        Args:
            line_strings (list): List of Shapely LineString objects.

        Returns:
            list: List of Shapely Polygon objects formed during this addition.
        """
        self.parts.extend(line_strings)

        # Attempt to polygonize the current accumulator
        merged = unary_union(self.parts)

        # polygonize expects a list of geometries
        polygons = list(polygonize(merged))

        if polygons:
            new_polygons = polygons
            # Clear parts assuming all LineStrings have been used to form polygons
            self.parts = []
            return new_polygons
        else:
            return []

    def get_remaining_line_strings(self):
        """
        Get the remaining LineStrings that have not been polygonized.

        Returns:
            list: List of remaining Shapely LineString objects.
        """
        return self.parts.copy()

    def reset(self):
        """
        Reset the processor to initial state.
        """
        self.parts = []

# ---------------------------
# Helper Functions
# ---------------------------

def fetch_places_from_overpass(country_code, admin_level):
    """
    Fetch administrative boundaries from Overpass API for a given country and admin level.
    
    Args:
        country_code (str): 2-letter country code.
        admin_level (int): The administrative level to fetch.
        
    Returns:
        list: A list of elements (relations) from the Overpass API response.
    """
    query = f"""
    [out:json][timeout:180];
    area["ISO3166-1"="{country_code}"]->.searchArea;
    (
      relation["boundary"="administrative"]["admin_level"={admin_level}](area.searchArea);
    );
    out center geom;
    """
    url = "https://overpass-api.de/api/interpreter"
    params = {
        'data': query
    }
    
    try:
        response = requests.get(url, params=params, timeout=120)
        response.raise_for_status()
        data = response.json()
        return data.get('elements', [])
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Exception during Overpass API call for {country_code} at admin level {admin_level}: {e}", file=sys.stderr)
        return []

def fetch_province_from_nominatim(lat, lon):
    """
    Fetch state or province information using Nominatim reverse geocoding.

    Args:
        lat (float): Latitude of the centroid.
        lon (float): Longitude of the centroid.

    Returns:
        str: The state or province name, or "Unknown" if not found.
    """
    url = "https://nominatim.openstreetmap.org/reverse"
    params = {
        'format': 'json',
        'lat': lat,
        'lon': lon,
        'addressdetails': 1,
        'accept-language': 'en'
    }
    headers = {
        'User-Agent': 'LocationApp/1.0 (contact@locationapp.com)'  # Replace with your actual contact info
    }
    
    try:
        response = requests.get(url, params=params, headers=headers, timeout=30)
        response.raise_for_status()
        data = response.json()
        address = data.get('address', {})
        state = (address.get('state_en') or address.get('addr:state') or
                 address.get('state') or address.get('province') or "Unknown")
        return state
    except requests.exceptions.RequestException as e:
        print(f"[ERROR] Nominatim API call failed: {e}", file=sys.stderr)
        return "Unknown"

def find_city_by_osm_id_or_name(session, city_name, state_or_province, admin_level, country_id, osm_id):
    """
    Check if a city exists in the database by either its osm_id or a combination of other attributes.
    """
    return session.query(Place).filter(
        (Place.osm_id == str(osm_id)) | 
        (
            (Place.name == city_name) & 
            (Place.state_or_province == state_or_province) & 
            (Place.admin_level == admin_level) & 
            (Place.country_id == country_id)
        )
    ).first()

def add_city(session, city_name, country_id, latitude, longitude, state_or_province, wkt_polygon, osm_id, population, admin_level):
    """
    Add a new city to the database.

    Args:
        session (Session): SQLAlchemy session.
        city_name (str): Name of the city.
        country_id (int): Country ID.
        latitude (float): Latitude of the centroid.
        longitude (float): Longitude of the centroid.
        state_or_province (str): State or province name.
        wkt_polygon (str): WKT representation of the polygon.
        osm_id (int or str): OSM ID.
        population (int or None): Population.
        admin_level (int or None): Administrative level.

    Returns:
        int: The ID of the newly inserted city.
    """
    new_place = Place(
        name=city_name,
        country_id=country_id,
        latitude=latitude,
        longitude=longitude,
        state_or_province=state_or_province,
        boundary=wkt_polygon,
        osm_id=str(osm_id),
        population=population,
        admin_level=admin_level
    )
    session.add(new_place)
    session.commit()
    return new_place.id

def update_city_partial(session, city, updates):
    """
    Update an existing city's data.

    Args:
        session (Session): SQLAlchemy session.
        city (Place): The existing Place object.
        updates (dict): A dictionary of fields to update.
    """
    # Check if boundary is unchanged
    if 'boundary' in updates:
        if city.boundary == updates['boundary']:
            print(f"[INFO] Skipping update for city {city.id} as boundary is unchanged.")
            return

    for key, value in updates.items():
        setattr(city, key, value)
    
    session.commit()

# ---------------------------
# Main Processing Function
# ---------------------------

def process_places(session, country_code, admin_level):
    """
    Process places for a specific country, admin level: fetch, parse, calculate, and store.

    Args:
        session (Session): SQLAlchemy session.
        country_code (str): 2-letter country code.
        admin_level (int): Administrative level to process.
    """
    # Find the country ID based on the country code
    country = session.query(Country).filter(Country.country_code == country_code).first()
    if not country:
        print(f"[ERROR] Country with code {country_code} not found in database.")
        return

    places = fetch_places_from_overpass(country_code, admin_level)
    if not places:
        print(f"No places found for {country_code} at admin level {admin_level}.")
        return

    processor = PolygonProcessor()

    for place in places:

        # Skip places without a name
        tags = place.get('tags', {})
        city_name = tags.get('name:en') or tags.get('name') or 'Unknown'
        if city_name == 'Unknown':
            print(f"[INFO] Skipping place with osm_id {place.get('id')} due to missing name.")
            continue

        osm_id = place.get('id')

        # Parse LineStrings from the place using the processor
        line_strings = processor.parse_line_strings(place)
        if not line_strings:
            print(f"[WARN] No valid LineStrings for {city_name} (osm_id {osm_id})")
            continue

        # Add LineStrings to the processor and attempt polygonization
        new_polygons = processor.add_line_strings(line_strings)

        if not new_polygons:
            print(f"[INFO] No composite polygons formed for {city_name} (osm_id {osm_id})")
            continue

        # Merge all new polygons into a MultiPolygon if necessary
        if len(new_polygons) == 1:
            merged_boundary = new_polygons[0]
        else:
            merged_boundary = MultiPolygon(new_polygons)

        wkt_polygon = merged_boundary.wkt

        # Calculate centroid
        centroid = merged_boundary.centroid
        centroid_lat = centroid.y
        centroid_lon = centroid.x

        # Fetch state or province using centroid
        state_or_province = fetch_province_from_nominatim(centroid_lat, centroid_lon)

        # Extract additional metadata
        population = tags.get('population')
        try:
            population = int(population) if population else None
        except ValueError:
            population = None

        admin_level_tag = tags.get('admin_level')
        try:
            admin_level_tag = int(admin_level_tag) if admin_level_tag else None
        except ValueError:
            admin_level_tag = None

        # Check if the city exists
        existing_city = find_city_by_osm_id_or_name(
            session, city_name, state_or_province, admin_level_tag, country.id, osm_id
        )

        if existing_city:
            print(f"[INFO] Updating {city_name} (osm_id {osm_id}, Admin Level {admin_level})")
            updates = {
                'latitude': centroid_lat,
                'longitude': centroid_lon,
                'state_or_province': state_or_province,
                'osm_id': osm_id,
                'population': population,
                'admin_level': admin_level_tag,
                'boundary': wkt_polygon  # Update boundary with merged polygons
            }
            update_city_partial(session, existing_city, updates)
        else:
            print(f"[INFO] Adding new {city_name} (osm_id {osm_id}, Admin Level {admin_level})")
            add_city(
                session,
                city_name,
                country.id,
                centroid_lat,
                centroid_lon,
                state_or_province,
                wkt_polygon,
                osm_id,
                population,
                admin_level_tag
            )

# ---------------------------
# Main Execution
# ---------------------------

def main():
    """
    Main function to execute the processing loop across countries missing places.
    """
    engine = get_db_engine()
    create_tables(engine)

    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        print('Connected to the database.')
        
        # Define admin levels to process
        admin_levels = [6, 8]
        
        # Fetch countries without places
        countries_to_process = get_countries_without_places(session)
        
        if not countries_to_process:
            print("No countries found that need places processing.")
            return

        print(f"Found {len(countries_to_process)} countries to process.")

        # Process each country dynamically
        for country in countries_to_process:
            print(f"\n--- Processing Country: {country.name} ({country.country_code}) ---")
            for admin_level in admin_levels:
                print(f"\n----- Processing Admin Level {admin_level} -----")
                process_places(session, country.country_code, admin_level)

        print('Processing completed.')
    except Exception as e:
        print(f"[ERROR] Execution failed: {e}", file=sys.stderr)
    finally:
        session.close()
        print('Database connection closed.')


if __name__ == "__main__":
    main()