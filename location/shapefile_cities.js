import * as shapefile from 'shapefile';
import * as turf from '@turf/turf';
import transliteration from 'transliteration';
import pkg from 'pg';
import path from 'path';
const { Client } = pkg;

// Shapefile path
const shapefilePath = './japan/jp.shp';

// Database configuration
const dbConfig = {
    user: 'postgres',
    host: 'localhost',
    database: 'locations',
    password: 'REMOVED_PASSWORD',
    port: 5432
};

// Connect to PostgreSQL
const client = new Client(dbConfig);

// Clean function to sanitize strings and remove null bytes
function cleanString(input) {
    if (!input) return null;
    return input.replace(/\x00/g, '').trim();
}

// Function to transliterate names to Latin characters
function transliterateName(name) {
    return transliteration.transliterate(name || '');
}

async function processShapefile(filePath, countryId) {
    console.log(`Reading shapefile: ${filePath}`);
    const source = await shapefile.open(filePath);

    let record;
    let count = 0;

    while (!(record = await source.read()).done) {
        const properties = record.value.properties;
        const geometry = record.value.geometry;

        // Log properties to understand the structure
        console.log('Record properties:', properties);

        // Extract city and prefecture based on available fields
        const cityNameOriginal = cleanString(properties.name); // Assuming 'name' field contains city or prefecture name
        const cityName = transliterateName(cityNameOriginal);

        if (!cityName) {
            console.warn('Skipping record: Missing city name.');
            continue;
        }

        if (!geometry) {
            console.warn(`Skipping ${cityName}: Missing geometry.`);
            continue;
        }

        // Convert geometry to GeoJSON string
        const boundaryGeoJSON = JSON.stringify(geometry);

        // Calculate centroid using Turf.js
        let centroid;
        try {
            centroid = turf.centroid(geometry);
        } catch (centroidError) {
            console.error(`Error calculating centroid for ${cityName}:`, centroidError.message);
            continue;
        }

        if (!centroid || !centroid.geometry || !centroid.geometry.coordinates) {
            console.warn(`Skipping ${cityName}: Unable to determine centroid.`);
            continue;
        }

        const [longitude, latitude] = centroid.geometry.coordinates;

        const query = `
            INSERT INTO cities (name, state_or_province, country_id, latitude, longitude, boundary, distance_threshold)
            VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_GeomFromGeoJSON($6), 4326), 50)
            ON CONFLICT (name, state_or_province, country_id) DO UPDATE
            SET 
                latitude = EXCLUDED.latitude,
                longitude = EXCLUDED.longitude,
                boundary = EXCLUDED.boundary,
                distance_threshold = EXCLUDED.distance_threshold
        `;
        const values = [cityName, cityName, countryId, latitude, longitude, boundaryGeoJSON];

        try {
            await client.query(query, values);
            count++;
            console.log(`Processed: ${cityName}`);
        } catch (dbError) {
            console.error(`Error inserting/updating ${cityName}:`, dbError.message);
        }
    }

    console.log(`Shapefile processing completed for ${filePath}. Processed ${count} records.`);
}

(async function processShapefileForJapan() {
    try {
        console.log('Connecting to the database...');
        await client.connect();

        // Fetch country_id for 'Japan'
        const countryName = 'Japan';
        const countryQuery = `
            SELECT id FROM countries WHERE name ILIKE $1
        `;
        const countryResult = await client.query(countryQuery, [countryName]);

        if (countryResult.rows.length === 0) {
            throw new Error(`Country '${countryName}' not found in the database.`);
        }

        const countryId = countryResult.rows[0].id;
        console.log(`Fetched country_id for '${countryName}': ${countryId}`);

        const filePath = path.resolve(shapefilePath);

        console.log(`Processing shapefile: ${filePath}`);
        await processShapefile(filePath, countryId);

        console.log('Shapefile processing completed successfully.');
    } catch (error) {
        console.error('Error processing shapefile:', error.message);
    } finally {
        console.log('Closing database connection.');
        await client.end();
    }
})();
