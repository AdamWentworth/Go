import fs from 'fs';
import pkg from 'pg';
const { Client } = pkg;

// Database configuration
const dbConfig = {
    user: 'postgres',
    host: 'localhost',
    database: 'locations',
    password: 'REMOVED_PASSWORD',
    port: 5433,
};

const client = new Client(dbConfig);

// Function to ensure rings are closed
function closeRing(ring) {
    const firstCoord = ring[0];
    const lastCoord = ring[ring.length - 1];
    if (firstCoord[0] !== lastCoord[0] || firstCoord[1] !== lastCoord[1]) {
        ring.push(firstCoord); // Close the ring by appending the first coordinate
    }
    return ring;
}

// Function to read and parse the GeoJSON file
async function getCityBoundaryFromGeoJSON(filePath) {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        const geojson = JSON.parse(data);

        // Extract the geometry from the GeoJSON
        if (geojson.type !== 'FeatureCollection' || geojson.features.length === 0) {
            throw new Error('Invalid GeoJSON: No features found');
        }

        const geometry = geojson.features[0].geometry; // Assuming a single feature
        if (geometry.type !== 'Polygon' && geometry.type !== 'MultiPolygon') {
            throw new Error(`Unsupported geometry type: ${geometry.type}`);
        }

        // Ensure all rings are closed and convert to WKT format
        const wktPolygon = geometry.type === 'Polygon'
            ? `POLYGON(${geometry.coordinates
                  .map(
                      ring =>
                          `(${closeRing(ring)
                              .map(coord => coord.join(' '))
                              .join(',')})`
                  )
                  .join(',')})`
            : `MULTIPOLYGON(${geometry.coordinates
                  .map(
                      polygon =>
                          `(${polygon
                              .map(
                                  ring =>
                                      `(${closeRing(ring)
                                          .map(coord => coord.join(' '))
                                          .join(',')})`
                              )
                              .join(',')})`
                  )
                  .join(',')})`;

        console.log('Generated WKT:', wktPolygon); // Log the WKT string for debugging
        return wktPolygon;
    } catch (err) {
        console.error(`[ERROR] Failed to parse GeoJSON file: ${err.message}`);
        throw err;
    }
}

// Function to extract city name from file name
function getCityNameFromFile(filePath) {
    const fileName = filePath.split('/').pop(); // Get the file name from the path
    const cityName = fileName.split('_')[0]; // Extract city name before the first underscore
    return cityName;
}

// Function to insert/update the boundary in the database
async function insertCityBoundary(filePath) {
    try {
        console.log('Connecting to the database...');
        await client.connect();
        console.log('Connected.');

        console.log('Reading GeoJSON file...');
        const wktPolygon = await getCityBoundaryFromGeoJSON(filePath);
        const cityName = getCityNameFromFile(filePath);

        const updateQuery = `
            UPDATE cities
            SET boundary = ST_GeomFromText($1, 4326)
            WHERE name = $2
        `;

        const result = await client.query(updateQuery, [wktPolygon, cityName]);
        if (result.rowCount > 0) {
            console.log(`[SUCCESS] Updated boundary for ${cityName}.`);
        } else {
            console.log(`[WARN] No city found with the name ${cityName}.`);
        }
    } catch (error) {
        console.error('Error inserting city boundary:', error.message);
    } finally {
        console.log('Closing database connection.');
        await client.end();
    }
}

(async function main() {
    const geojsonFilePath = './Kansas City_Boundary.geojson'; // Replace with the desired file path
    await insertCityBoundary(geojsonFilePath);
})();
