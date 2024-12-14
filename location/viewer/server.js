import express from 'express';
import pkg from 'pg';
const { Client } = pkg;

const app = express();
const PORT = 4000;

// Database configuration
const dbConfig = {
    user: 'postgres',
    host: 'localhost',
    database: 'locations',
    password: 'REMOVED_PASSWORD',
    port: 5432,
};

const client = new Client(dbConfig);

// Middleware for CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Allow requests from any origin
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); // Allow all HTTP methods
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.options('*', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.sendStatus(200); // Respond to preflight with success
});

// Connect to the database
client.connect()
    .then(() => console.log('Connected to the database.'))
    .catch(err => console.error('Database connection error:', err));

// Updated route to fetch GeoJSON polygon for city, country pairs with optional state
app.get('/city/:country/:state?/:name?', async (req, res) => {
    const countryName = req.params.country;
    const stateName = req.params.state || null;
    const cityName = req.params.name || null;

    // console.log('Received params:', { countryName, stateName, cityName });

    try {
        let query;
        let params;

        if (cityName && stateName) {
            query = `
                SELECT ST_AsGeoJSON(places.boundary) AS geojson
                FROM places
                INNER JOIN countries ON places.country_id = countries.id
                WHERE LOWER(places.name) = LOWER($1)
                  AND LOWER(places.state_or_province) = LOWER($2)
                  AND LOWER(countries.name) = LOWER($3)
            `;
            params = [cityName, stateName, countryName];
        } else if (cityName) {
            query = `
                SELECT ST_AsGeoJSON(places.boundary) AS geojson
                FROM places
                INNER JOIN countries ON places.country_id = countries.id
                WHERE LOWER(places.name) = LOWER($1)
                  AND LOWER(countries.name) = LOWER($2)
            `;
            params = [cityName, countryName];
        } else {
            query = `
                SELECT ST_AsGeoJSON(countries.boundary) AS geojson
                FROM countries
                WHERE LOWER(countries.name) = LOWER($1)
            `;
            params = [countryName];
        }

        // console.log('Executing query:', query, 'with params:', params);
        const result = await client.query(query, params);

        if (result.rows.length > 0) {
            const geojson = JSON.parse(result.rows[0].geojson);
            res.json({
                type: 'Feature',
                geometry: geojson,
                properties: { country: countryName, state: stateName, city: cityName }
            });
        } else {
            res.status(404).json({ error: 'Boundary not found for the specified location.' });
        }
    } catch (error) {
        console.error('Error fetching boundary:', error.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
