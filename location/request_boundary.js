import pkg from 'pg';
const { Client } = pkg;
import fetch from 'node-fetch';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Database configuration
const dbConfig = {
    user: 'postgres',
    host: 'localhost',
    database: 'locations',
    password: 'REMOVED_PASSWORD',
    port: 5432,
};

const client = new Client(dbConfig);

async function getCitiesWithoutBoundary(limit = 20, countryName) {
    const query = `
        SELECT c.id AS city_id, c.name AS city_name, co.name AS country_name
        FROM cities c
        JOIN countries co ON c.country_id = co.id
        WHERE c.boundary IS NULL
          AND co.name = $1
        ORDER BY co.name, c.name
        LIMIT $2
    `;
    const res = await client.query(query, [countryName, limit]);
    return res.rows;
}

function buildOverpassQuery(countryName, cityName) {
    return `
[out:json];
area["name"="${countryName}"]->.searchArea;
relation["boundary"="administrative"]["name"="${cityName}"](area.searchArea);
out body;
>;
out skel qt;
    `;
}

async function fetchCityPolygon(countryName, cityName) {
    console.log(`[INFO] Fetching Overpass data for ${cityName}, ${countryName}`);
    const query = buildOverpassQuery(countryName, cityName);
    const url = "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query);

    try {
        const response = await fetch(url, { timeout: 60000 });
        if (response.ok) {
            const data = await response.json();
            if (data && data.elements.length > 0) {
                return data; // Return successfully fetched data
            }
        }
    } catch (error) {
        console.error(`[ERROR] Overpass query failed for ${cityName}, ${countryName}: ${error.message}`);
    }
    return null;
}

function parsePolygon(data) {
    const relation = data.elements.find(el => el.type === 'relation');
    if (!relation) return null;

    const ways = {};
    const nodes = {};

    for (const el of data.elements) {
        if (el.type === 'way') {
            ways[el.id] = el;
        } else if (el.type === 'node') {
            nodes[el.id] = el;
        }
    }

    const outerWays = relation.members
        .filter(m => m.type === 'way' && m.role === 'outer')
        .map(m => ways[m.ref])
        .filter(Boolean);

    if (outerWays.length === 0) return null;

    function wayToCoords(way) {
        return way.nodes.map(nodeId => {
            const n = nodes[nodeId];
            return [n.lon, n.lat];
        });
    }

    let outerCoords = [];
    for (const way of outerWays) {
        const coords = wayToCoords(way);
        outerCoords = outerCoords.concat(coords);
    }

    const first = outerCoords[0];
    const last = outerCoords[outerCoords.length - 1];
    if (first && (first[0] !== last[0] || first[1] !== last[1])) {
        outerCoords.push(first);
    }

    if (outerCoords.length < 4) return null;

    const wktPolygon = `POLYGON((${outerCoords.map(c => c.join(' ')).join(',')}))`;
    return wktPolygon;
}

async function updateCityBoundary(cityId, wktPolygon) {
    const updateQuery = `
        UPDATE cities
        SET boundary = ST_GeomFromText($1, 4326)
        WHERE id = $2
    `;
    await client.query(updateQuery, [wktPolygon, cityId]);
}

(async function main() {
    const countryName = process.argv[2];
    if (!countryName) {
        console.error("[ERROR] Please provide a country name as the first argument.");
        process.exit(1);
    }

    try {
        console.log('Connecting to the database...');
        await client.connect();
        console.log('Connected.');

        while (true) {
            const cities = await getCitiesWithoutBoundary(20, countryName);
            if (cities.length === 0) {
                console.log(`No more cities without boundaries found in ${countryName}. Exiting.`);
                break;
            }

            console.log(`Processing ${cities.length} cities...`);
            let updatedCount = 0;

            for (const city of cities) {
                const { city_id, city_name, country_name } = city;
                console.log(`\n[INFO] Fetching boundary for city: ${city_name}, Country: ${country_name}`);

                await sleep(5000);

                let data;
                try {
                    data = await fetchCityPolygon(country_name, city_name);
                    if (!data) {
                        console.log(`[WARN] No polygon found for ${city_name}, ${country_name}. Skipping.`);
                        continue;
                    }
                } catch (err) {
                    console.error(`[ERROR] Failed to fetch data from Overpass for ${city_name}, ${country_name}: ${err.message}`);
                    continue;
                }

                const wktPolygon = parsePolygon(data);
                if (!wktPolygon) {
                    console.log(`[WARN] Parsed polygon is invalid for ${city_name}, ${country_name}. Skipping.`);
                    continue;
                }

                try {
                    await updateCityBoundary(city_id, wktPolygon);
                    console.log(`[SUCCESS] Updated boundary for ${city_name}, ${country_name}.`);
                    updatedCount++;
                } catch (err) {
                    console.error(`[ERROR] Failed to update boundary in DB for ${city_name}, ${country_name}: ${err.message}`);
                }
            }

            if (updatedCount === 0) {
                console.log('No boundaries updated this iteration. Stopping.');
                break;
            }
        }

        console.log(`\nCompleted processing all possible cities in ${countryName}.`);
    } catch (error) {
        console.error('Error during execution:', error.message);
    } finally {
        console.log('Closing database connection.');
        await client.end();
    }
})();
