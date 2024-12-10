import psycopg2
import fiona
from fiona.crs import from_epsg

# Database connection details
DB_NAME = "locations"
DB_USER = "postgres"
DB_HOST = "localhost"
DB_PORT = "5433"
DB_PASSWORD = "REMOVED_PASSWORD"

# SQL query to fetch data
SQL_QUERY = """
SELECT id, name, ST_AsGeoJSON(boundary) AS geometry
FROM cities
WHERE country_id = 298;
"""

# Output shapefile path
OUTPUT_FILE = r".\japanese_locations.shp"

def main():
    try:
        # Connect to PostgreSQL database
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=REMOVED_PASSWORD
            host=DB_HOST,
            port=DB_PORT
        )
        cur = conn.cursor()

        # Execute the SQL query
        cur.execute(SQL_QUERY)
        rows = cur.fetchall()

        # Define shapefile schema
        schema = {
            'geometry': 'Polygon',
            'properties': {'id': 'int', 'name': 'str'}
        }

        # Open shapefile for writing
        with fiona.open(
            OUTPUT_FILE,
            mode='w',
            driver='ESRI Shapefile',
            schema=schema,
            crs=from_epsg(4326)  # Assuming WGS84 (EPSG:4326)
        ) as shp:
            for row in rows:
                id, name, geom = row
                shp.write({
                    'geometry': eval(geom),  # Convert GeoJSON string to dict
                    'properties': {'id': id, 'name': name}
                })

        print(f"Shapefile successfully created at {OUTPUT_FILE}")

    except Exception as e:
        print(f"An error occurred: {e}")

    finally:
        # Clean up
        cur.close()
        conn.close()

if __name__ == "__main__":
    main()
