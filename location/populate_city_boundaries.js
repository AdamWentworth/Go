import pkg from 'pg';
const { Client } = pkg;
import fetch from 'node-fetch';

function logToFile(content, filename = 'debug_output.log') {
    const formattedContent = typeof content === 'object' ? JSON.stringify(content, null, 2) : content;
    fs.appendFileSync(filename, formattedContent + '\n');
}

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

// Fetch places using Overpass Turbo
async function fetchPlacesFromOverpass() {
    const query = `
[out:json][timeout:180];
area["ISO3166-1"="CA"]->.searchArea;
relation["boundary"="administrative"]["admin_level"="8"](area.searchArea);
out center geom;
    `;
    const url = "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query);

    try {
        const response = await fetch(url, { timeout: 60000 });
        if (response.ok) {
            const data = await response.json();
            return data.elements || [];
        } else {
            console.error(`[ERROR] Failed to fetch data from Overpass API: ${response.statusText}`);
            return [];
        }
    } catch (err) {
        console.error(`[ERROR] Exception during Overpass API call: ${err.message}`);
        return [];
    }
}

// Parse polygon from Overpass data
function parsePolygon(data) {
    const outerWays = data.find(el => el.type === 'relation')?.members.filter(m => m.type === 'way' && m.role === 'outer') || [];
    if (!outerWays.length) return null;

    let outerCoords = [];
    for (const member of outerWays) {
        if (!member.geometry) continue;
        const coords = member.geometry.map(point => [point.lon, point.lat]);
        outerCoords.push(...coords);
    }

    if (outerCoords.length < 4) return null;

    const first = outerCoords[0];
    const last = outerCoords[outerCoords.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) outerCoords.push(first);

    return `POLYGON((${outerCoords.map(c => c.join(' ')).join(',')}))`;
}

// Calculate centroid
function calculateCentroid(wktPolygon) {
    const matches = wktPolygon.match(/\(\(([^)]+)\)\)/);
    if (!matches) return null;

    const coordinates = matches[1]
        .split(',')
        .map(pair => pair.trim().split(' ').map(Number));

    let area = 0, cx = 0, cy = 0;
    for (let i = 0, j = coordinates.length - 1; i < coordinates.length; j = i++) {
        const [x0, y0] = coordinates[j];
        const [x1, y1] = coordinates[i];
        const a = x0 * y1 - x1 * y0;
        area += a;
        cx += (x0 + x1) * a;
        cy += (y0 + y1) * a;
    }
    area *= 0.5;
    if (area === 0) return null;

    cx /= (6 * area);
    cy /= (6 * area);
    return { lon: cx, lat: cy };
}

// Fetch state/province from Nominatim API
async function fetchProvinceFromNominatim(lat, lon) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
    try {
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            // console.log('[DEBUG] Nominatim API Response:', JSON.stringify(data, null, 2));

            // Prioritize `province`, fallback to `state`, or use "Unknown"
            const province = data.address?.province || data.address?.state || "Unknown";
            // console.log(`[INFO] Resolved province/state for coordinates (${lat}, ${lon}): ${province}`);
            return province;
        } else {
            console.error(`[ERROR] Failed to fetch data from Nominatim API: ${response.statusText}`);
            return "Unknown";
        }
    } catch (err) {
        console.error(`[ERROR] Nominatim API call failed: ${err.message}`);
        return "Unknown";
    }
}

// Check if city exists in the database
async function findCityByName(cityName) {
    const query = `
        SELECT id FROM cities WHERE name = $1 AND country_id = (SELECT id FROM countries WHERE name = 'Canada')
    `;
    const res = await client.query(query, [cityName]);
    return res.rows[0]?.id || null;
}

// Add a new city
async function addCity(cityName, countryId, latitude, longitude, stateOrProvince) {
    const insertQuery = `
        INSERT INTO cities (name, country_id, latitude, longitude, state_or_province) 
        VALUES ($1, $2, $3, $4, $5) RETURNING id
    `;
    const res = await client.query(insertQuery, [cityName, countryId, latitude, longitude, stateOrProvince]);
    return res.rows[0].id;
}

// Update an existing city's data
async function updateCityBoundary(cityId, wktPolygon, latitude, longitude, stateOrProvince) {
    const updateQuery = `
        UPDATE cities
        SET boundary = ST_GeomFromText($1, 4326), 
            latitude = $2, 
            longitude = $3, 
            state_or_province = $4
        WHERE id = $5
    `;
    await client.query(updateQuery, [wktPolygon, latitude, longitude, stateOrProvince, cityId]);
}

// Main processing loop
(async function main() {
    try {
        console.log('Connecting to the database...');
        await client.connect();
        console.log('Connected.');

        const places = await fetchPlacesFromOverpass();
        if (!places.length) {
            console.log('No places found in Overpass data.');
            return;
        }

        for (const place of places) {
            const cityName = place.tags?.name || 'Unknown';
            if (cityName === 'Unknown') continue;

            const wktPolygon = parsePolygon([place]);
            if (!wktPolygon) continue;

            const centroid = calculateCentroid(wktPolygon);
            if (!centroid) continue;

            let stateOrProvince = place.tags?.["addr:state"] || place.tags?.["is_in:province"];
            if (!stateOrProvince || stateOrProvince === "Unknown") {
                stateOrProvince = await fetchProvinceFromNominatim(centroid.lat, centroid.lon);
            }

            const countryId = 264; // Canada
            let cityId = await findCityByName(cityName);

            if (cityId) {
                console.log(`[INFO] Updating city: ${cityName}`);
                await updateCityBoundary(cityId, wktPolygon, centroid.lat, centroid.lon, stateOrProvince);
            } else {
                console.log(`[INFO] Adding new city: ${cityName}`);
                cityId = await addCity(cityName, countryId, centroid.lat, centroid.lon, stateOrProvince);
            }
        }

        console.log('Processing completed.');
    } catch (error) {
        console.error(`[ERROR] Execution failed: ${error.message}`);
    } finally {
        console.log('Closing database connection.');
        await client.end();
    }
})();
