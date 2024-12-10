const { Client } = require('pg'); // PostgreSQL client for database connection

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

(async function checkDuplicates() {
    try {
        console.log('Connecting to the database...');
        await client.connect();

        console.log('Checking for duplicates in the cities table...');
        
        // Query to find duplicates based on name and country_id
        const duplicateQuery = `
            SELECT name, country_id, COUNT(*)
            FROM cities
            GROUP BY name, country_id
            HAVING COUNT(*) > 1
        `;
        
        const result = await client.query(duplicateQuery);
        
        if (result.rows.length > 0) {
            console.log(`Found ${result.rows.length} duplicates:`);
            result.rows.forEach(row => {
                console.log(`City: ${row.name}, Country ID: ${row.country_id}, Occurrences: ${row.count}`);
            });
        } else {
            console.log('No duplicates found in the cities table.');
        }
    } catch (error) {
        console.error('Error checking for duplicates:', error.message);
    } finally {
        console.log('Closing database connection.');
        await client.end();
    }
})();
