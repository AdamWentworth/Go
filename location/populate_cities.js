const axios = require('axios');
const { Client } = require('pg'); // PostgreSQL client for database insertion

// Database configuration
const dbConfig = {
    user: 'postgres',
    host: 'localhost',
    database: 'locations',
    password: 'REMOVED_PASSWORD',
    port: 5433
};

// GeoNames API configuration
const geoNamesConfig = {
    username: 'adamzilla', // Replace with your GeoNames username
    featureClass: 'P', // Cities
    maxRows: 1000 // Max rows per page (GeoNames limit)
};

// Connect to PostgreSQL
const client = new Client(dbConfig);

(async function fetchAndInsertCities() {
    try {
        console.log('Connecting to the database...');
        await client.connect();

        let totalCities = 0;
        let skippedCities = 0;
        let startRow = 0;
        let hasMoreData = true;

        console.log('Fetching city data from GeoNames...');

        while (hasMoreData) {
            console.log(`Fetching cities starting from row ${startRow}...`);

            const response = await axios.get('http://api.geonames.org/searchJSON', {
                params: {
                    q: '', // Empty query
                    startRow: startRow,
                    maxRows: geoNamesConfig.maxRows,
                    featureClass: geoNamesConfig.featureClass,
                    username: geoNamesConfig.username
                }
            });

            // Safely access geonames array
            const cities = response.data && Array.isArray(response.data.geonames)
                ? response.data.geonames
                : [];

            if (cities.length === 0) {
                hasMoreData = false;
                break;
            }

            console.log(`Fetched ${cities.length} cities from GeoNames.`);

            for (const city of cities) {
                const cityName = city.name;
                const stateOrProvince = city.adminName1 || null;
                const latitude = city.lat;
                const longitude = city.lng;
                const countryName = city.countryName;

                const countryResult = await client.query(
                    `SELECT id FROM countries WHERE name = $1`,
                    [countryName]
                );

                if (countryResult.rows.length === 0) {
                    console.warn(`Skipping ${cityName}: Country ${countryName} not found.`);
                    skippedCities++;
                    continue;
                }

                const countryId = countryResult.rows[0].id;

                const query = `
                    INSERT INTO cities (name, state_or_province, country_id, latitude, longitude, distance_threshold)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    ON CONFLICT (name, country_id) DO NOTHING
                `;
                const values = [cityName, stateOrProvince, countryId, latitude, longitude, 50];

                try {
                    await client.query(query, values);
                } catch (insertError) {
                    console.error(`Error inserting city ${cityName}:`, insertError.message);
                }
            }

            totalCities += cities.length;
            startRow += geoNamesConfig.maxRows; // Go to the next page
        }

        console.log('City data processing completed.');
        console.log(`Total cities processed: ${totalCities}`);
        console.log(`${skippedCities} cities were skipped due to missing countries.`);
    } catch (error) {
        console.error('Error fetching or inserting cities:', error.message);
    } finally {
        console.log('Closing database connection.');
        await client.end();
    }
})();
