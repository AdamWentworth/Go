import psycopg2
import fiona
from fiona.crs import from_epsg
import json

# Database connection details
DB_NAME = "locations"
DB_USER = "postgres"
DB_HOST = "localhost"
DB_PORT = "5432"
DB_PASSWORD = "REMOVED_PASSWORD"

# SQL query to fetch data for Salmon Arm
SQL_QUERY = """
SELECT id, name, ST_AsGeoJSON(boundary) AS geometry
FROM cities
WHERE LOWER(name) = 'salmon arm' 
  AND LOWER(state_or_province) = 'british columbia' 
  AND country_id = 264;
"""

# Output shapefile path
OUTPUT_FILE = r"./salmon_arm_boundary.shp"

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

        if not rows:
            print("No data found for Salmon Arm, British Columbia.")
            return

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
                # Convert GeoJSON string to dictionary
                geometry = json.loads(geom)
                # Ensure the GeoJSON structure matches Fiona's expectations
                shp.write({
                    'geometry': geometry,
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
