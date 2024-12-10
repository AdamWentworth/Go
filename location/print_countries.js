const { Client } = require('pg'); // PostgreSQL client for database access

// Database configuration
const dbConfig = {
    user: 'postgres',
    host: 'localhost',
    database: 'locations',
    password: 'REMOVED_PASSWORD',
    port: 5433
};

// Connect to PostgreSQL
const client = new Client(dbConfig);

(async function fetchCountries() {
    try {
        console.log('Connecting to the database...');
        await client.connect();

        console.log('Fetching country names from the countries table...');
        const result = await client.query('SELECT name FROM countries ORDER BY name');

        console.log('Countries in the database:');
        result.rows.forEach((row, index) => {
            console.log(`${index + 1}. ${row.name}`);
        });

        console.log(`\nTotal countries: ${result.rows.length}`);
    } catch (error) {
        console.error('Error fetching country names:', error.message);
    } finally {
        console.log('Closing database connection.');
        await client.end();
    }
})();
