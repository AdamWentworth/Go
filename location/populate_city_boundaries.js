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
    port: 5433,
};

const client = new Client(dbConfig);

async function getCitiesWithoutBoundary(limit = 20) {
    const query = `
        SELECT c.id AS city_id, c.name AS city_name, co.name AS country_name
        FROM cities c
        JOIN countries co ON c.country_id = co.id
        WHERE c.boundary IS NULL
          AND co.name = 'United States'
        ORDER BY co.name, c.name
        LIMIT $1
    `;
    const res = await client.query(query, [limit]);
    return res.rows;
}

function buildOverpassQuery(countryName, cityName, type = 'default') {
    if (type === 'default') {
        return `
[out:json];
area["name"="${countryName}"]->.searchArea;
relation["boundary"="administrative"]["name"="${cityName}"]["admin_level"="8"](area.searchArea);
out body;
>;
out skel qt;
        `;
    }
    if (type === 'alternative1') {
        return `
[out:json];
relation["name"="${cityName}"]["boundary"="administrative"];
out body;
>;
out skel qt;
        `;
    }
    if (type === 'alternative2') {
        return `
[out:json];
node["name"="${cityName}"];
out body;
>;
out skel qt;
        `;
    }
    throw new Error(`Unknown query type: ${type}`);
}

async function fetchCityPolygon(countryName, cityName) {
    const queryTypes = ['default', 'alternative1', 'alternative2'];

    for (const type of queryTypes) {
        console.log(`[INFO] Attempting Overpass query (${type}) for ${cityName}, ${countryName}`);
        const query = buildOverpassQuery(countryName, cityName, type);
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
            console.error(`[ERROR] Overpass query (${type}) failed for ${cityName}, ${countryName}: ${error.message}`);
        }

        await sleep(2000); // Add a delay before trying the next query
    }

    return null; // Return null if all query types fail
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
    try {
        console.log('Connecting to the database...');
        await client.connect();
        console.log('Connected.');

        while (true) {
            const cities = await getCitiesWithoutBoundary(20);
            if (cities.length === 0) {
                console.log('No more cities without boundaries found in the United States. Exiting.');
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
                        console.log(`[WARN] No polygon found for ${city_name}, ${country_name} after multiple attempts. Skipping.`);
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

        console.log('\nCompleted processing all possible cities in the United States.');
    } catch (error) {
        console.error('Error during execution:', error.message);
    } finally {
        console.log('Closing database connection.');
        await client.end();
    }
})();
