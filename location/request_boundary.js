import pkg from 'pg';
const { Client } = pkg;
import fetch from 'node-fetch';

import fs from 'fs';

function logToFile(content, filename = 'debug_output.log') {
    const formattedContent = typeof content === 'object' ? JSON.stringify(content, null, 2) : content;
    fs.appendFileSync(filename, formattedContent + '\n');
}

function writeJsonToFile(jsonData, filename = 'relation_data.json') {
    fs.writeFileSync(filename, JSON.stringify(jsonData, null, 2), 'utf-8');
    console.log(`Debug JSON data written to ${filename}`);
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

async function fetchPlacesFromOverpass() {
    const query = `
[out:json][timeout:180];
area["ISO3166-1"="CA"]->.searchArea;
relation["boundary"="administrative"]["admin_level"="8"]["name"="Westmount"](area.searchArea);
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

const VERBOSE = false; // Set to true for detailed debugging

function parsePolygon(data) {
    console.log("[INFO] Starting parsePolygon...");

    // Find the relation object in the data
    const relation = data.find(el => el.type === 'relation');
    if (!relation || !relation.members) {
        console.warn("[WARN] No relation with members found in data.");
        return null;
    }

    console.log("[INFO] Found relation with members.");

    // Filter for 'outer' ways
    const outerWays = relation.members.filter(m => m.type === 'way' && m.role === 'outer');
    if (outerWays.length === 0) {
        console.warn("[WARN] No outer ways found in relation members.");
        return null;
    }

    console.log(`[INFO] Found ${outerWays.length} outer ways.`);

    let outerCoords = [];

    // Iterate over outer ways to extract geometry
    for (const member of outerWays) {
        if (!member.geometry || member.geometry.length === 0) {
            console.warn(`[WARN] Missing geometry for way ref: ${member.ref}`);
            continue;
        }

        const coords = member.geometry.map(point => [point.lon, point.lat]);
        outerCoords.push(...coords);
    }

    if (outerCoords.length === 0) {
        console.warn("[WARN] No coordinates found for outer polygon.");
        return null;
    }

    console.log(`[INFO] Collected ${outerCoords.length} coordinates.`);

    // Ensure the polygon is closed
    const first = outerCoords[0];
    const last = outerCoords[outerCoords.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
        outerCoords.push(first);
        console.log("[INFO] Closed the polygon by adding the first coordinate to the end.");
    }

    if (outerCoords.length < 4) {
        console.warn("[WARN] Not enough coordinates to form a valid polygon.");
        return null;
    }

    // Convert to WKT POLYGON format
    const wktPolygon = `POLYGON((${outerCoords.map(c => c.join(' ')).join(',')}))`;
    console.log("[INFO] Successfully parsed polygon.");
    return wktPolygon;
}


async function findCityByName(cityName) {
    const query = `
        SELECT id FROM cities WHERE name = $1 AND country_id = (SELECT id FROM countries WHERE name = 'Canada')
    `;
    const res = await client.query(query, [cityName]);
    return res.rows[0]?.id || null;
}

async function addCity(cityName, countryId, latitude, longitude, StateOrProvince) {
    const insertQuery = `
        INSERT INTO cities (name, country_id, latitude, longitude, state_or_province) 
        VALUES ($1, $2, $3, $4, $5) RETURNING id
    `;
    const res = await client.query(insertQuery, [cityName, countryId, latitude, longitude, StateOrProvince]);
    return res.rows[0].id;
}

async function fetchProvinceFromNominatim(lat, lon) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;

    try {
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            const province = data.address?.state || data.address?.region || "Unknown";
            return province;
        } else {
            console.error(`[ERROR] Failed to fetch data from Nominatim API: ${response.statusText}`);
            return "Unknown";
        }
    } catch (err) {
        console.error(`[ERROR] Exception during Nominatim API call: ${err.message}`);
        return "Unknown";
    }
}

function calculateCentroid(wktPolygon) {
    const matches = wktPolygon.match(/\(\(([^)]+)\)\)/); // Extract coordinates from POLYGON((...))
    if (!matches) {
        console.error("[ERROR] Invalid WKT format. Could not extract coordinates.");
        return null;
    }

    const coordinates = matches[1]
        .split(',')
        .map(pair => pair.trim().split(' ').map(Number)); // Split into [lon, lat] pairs

    let area = 0;
    let cx = 0;
    let cy = 0;

    for (let i = 0, j = coordinates.length - 1; i < coordinates.length; j = i++) {
        const [x0, y0] = coordinates[j];
        const [x1, y1] = coordinates[i];
        const a = x0 * y1 - x1 * y0;
        area += a;
        cx += (x0 + x1) * a;
        cy += (y0 + y1) * a;
    }

    area *= 0.5;
    if (area === 0) {
        console.error("[ERROR] Area of the polygon is zero, invalid geometry.");
        return null;
    }

    cx /= (6 * area);
    cy /= (6 * area);

    return { lon: cx, lat: cy };
}

async function updateCityBoundary(cityId, wktPolygon, latitude, longitude, StateOrProvince) {
    const updateQuery = `
        UPDATE cities
        SET boundary = ST_GeomFromText($1, 4326), 
            latitude = $2, 
            longitude = $3, 
            state_or_province = $4
        WHERE id = $5
    `;
    await client.query(updateQuery, [wktPolygon, latitude, longitude, StateOrProvince, cityId]);
}

(async function main() {
    try {
        console.log('Connecting to the database...');
        await client.connect();
        console.log('Connected.');

        const places = await fetchPlacesFromOverpass();
        if (places.length === 0) {
            console.log('No places found for the specified query.');
            return;
        }

        console.log('[DEBUG] Fetched data for the place:', JSON.stringify(places, null, 2));

        // Process the first place to test parsing
        const place = places[0];
        const cityName = place.tags?.name || 'Unknown';

        console.log(`[INFO] Processing place: ${cityName}`);

        const wktPolygon = parsePolygon(places);
        if (!wktPolygon) {
            console.log(`[WARN] Could not parse polygon for ${cityName}.`);
            return;
        }

        console.log(`[SUCCESS] Parsed polygon for ${cityName}:`, wktPolygon);

        // Calculate centroid
        const centroid = calculateCentroid(wktPolygon);
        if (!centroid) {
            console.error(`[ERROR] Failed to calculate centroid for ${cityName}.`);
            return;
        }

        console.log(`[INFO] Centroid for ${cityName}: Latitude ${centroid.lat}, Longitude ${centroid.lon}`);

        // Dynamically fetch the province or state using Nominatim
        let StateOrProvince = place.tags?.["addr:state"] || place.tags?.["is_in:province"];
        if (!StateOrProvince || StateOrProvince === "Unknown") {
            console.log("[INFO] State/Province not found in Overpass data. Fetching from Nominatim API...");
            StateOrProvince = await fetchProvinceFromNominatim(centroid.lat, centroid.lon);
            console.log(`[INFO] State/Province determined: ${StateOrProvince}`);
        }

        // Check if city exists in the database
        let cityId = await findCityByName(cityName);
        if (!cityId) {
            console.log(`[INFO] City ${cityName} not found in the database. Adding it now.`);
            const countryId = 264; // ID for Canada
            cityId = await addCity(cityName, countryId, centroid.lat, centroid.lon, StateOrProvince);
            console.log(`[INFO] Added city ${cityName} with ID ${cityId}.`);
        }

        // Update the city's boundary, centroid, and province/state
        try {
            await updateCityBoundary(cityId, wktPolygon, centroid.lat, centroid.lon, StateOrProvince);
            console.log(`[SUCCESS] Updated boundary, centroid, and province/state for city: ${cityName}.`);
        } catch (err) {
            console.error(`[ERROR] Failed to update boundary in DB for ${cityName}: ${err.message}`);
        }
    } catch (error) {
        console.error('Error during execution:', error.message);
    } finally {
        console.log('Closing database connection.');
        await client.end();
    }
})();