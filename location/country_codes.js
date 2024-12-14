require('dotenv').config();
const axios = require('axios');
const { Client } = require('pg');
const stringSimilarity = require('string-similarity');

async function fetchOverpassCountryCodes() {
    const overpassUrl = 'https://overpass-api.de/api/interpreter';
    const query = `
    [out:json];
    area["name"="World"]["admin_level"="2"];
    (relation["admin_level"="2"]["iso3166-1:alpha2"](area););
    out body;
    `;

    try {
        const response = await axios.post(overpassUrl, `data=${encodeURIComponent(query)}`, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const countryCodes = {};
        
        console.log(`Total elements in Overpass response: ${response.data.elements.length}`);

        response.data.elements.forEach(item => {
            const name = item.tags?.name?.trim();
            const code = item.tags?.['iso3166-1:alpha2']?.trim();

            if (name && code) {
                countryCodes[name] = code;
                console.log(`Extracted: ${name} -> ${code}`);
            }
        });

        console.log(`Total country codes extracted: ${Object.keys(countryCodes).length}`);
        return countryCodes;
    } catch (error) {
        console.error('Error fetching country codes:', error);
        return {};
    }
}

function normalizeCountryName(name) {
    return name.trim().toLowerCase();
}

async function updateCountryCodes(client, countryCodes) {
    try {
        // Fetch all countries from the locations database
        const result = await client.query('SELECT name FROM countries');
        const countries = result.rows;

        console.log(`Total countries in database: ${countries.length}`);

        const notFound = [];
        let matchesFound = 0;

        for (const { name } of countries) {
            const normalizedCountry = normalizeCountryName(name);

            // Matching strategies
            const matchingStrategies = [
                // 1. Exact match (case-insensitive)
                (c) => normalizeCountryName(c) === normalizedCountry,
                
                // 2. Partial match
                (c) => normalizeCountryName(c).includes(normalizedCountry),
                
                // 3. Fuzzy matching
                (c) => stringSimilarity.compareTwoStrings(normalizedCountry, normalizeCountryName(c)) > 0.8
            ];

            let matched = false;
            for (const strategy of matchingStrategies) {
                const matchingCountries = Object.keys(countryCodes).filter(strategy);

                if (matchingCountries.length > 0) {
                    const matchedCountry = matchingCountries[0];
                    const code = countryCodes[matchedCountry];

                    await client.query(
                        'UPDATE countries SET country_code = $1 WHERE name = $2', 
                        [code, name]
                    );

                    console.log(`Matched: '${name}' -> '${matchedCountry}' (${code})`);
                    matchesFound++;
                    matched = true;
                    break;
                }
            }

            if (!matched) {
                notFound.push(name);
            }
        }

        // Print summary
        console.log(`\nTotal matches found: ${matchesFound}`);
        console.log('Countries without matching codes:');
        notFound.forEach(country => console.log(country));

        return notFound;
    } catch (error) {
        console.error('Error updating country codes:', error);
        return [];
    }
}

async function main() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    try {
        // Connect to the database
        await client.connect();

        // Fetch country codes
        const countryCodes = await fetchOverpassCountryCodes();

        // Update country codes
        await updateCountryCodes(client, countryCodes);
    } catch (error) {
        console.error('An error occurred:', error);
    } finally {
        // Close the database connection
        await client.end();
    }
}

main();