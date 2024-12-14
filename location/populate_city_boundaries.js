import pkg from 'pg';
const { Client } = pkg;
import fetch from 'node-fetch';
import fs from 'fs';

// Database configuration
const dbConfig = {
    user: 'postgres',
    host: 'localhost',
    database: 'locations',
    password: 'REMOVED_PASSWORD',
    port: 5432,
};

const client = new Client(dbConfig);

// Fetch places using Overpass Turbo for a specific admin level
async function fetchPlacesFromOverpass(adminLevel) {
    const query = `
[out:json][timeout:180];
area["ISO3166-1"="JP"]->.searchArea;
(
  relation["boundary"="administrative"]["admin_level"=${adminLevel}](area.searchArea);
);
out center geom;
    `;
    const url = "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query);

    try {
        const response = await fetch(url, { timeout: 120000 });
        if (response.ok) {
            const data = await response.json();
            return data.elements || [];
        } else {
            console.error(`[ERROR] Failed to fetch data from Overpass API for admin level ${adminLevel}: ${response.statusText}`);
            return [];
        }
    } catch (err) {
        console.error(`[ERROR] Exception during Overpass API call for admin level ${adminLevel}: ${err.message}`);
        return [];
    }
}

// Parse polygon from Overpass data
function parsePolygon(place) {
    if (!place.members) return null;

    const outerWays = place.members.filter(m => m.type === 'way' && m.role === 'outer');
    if (!outerWays.length) return null;

    let polygons = []; // To hold multiple polygons

    for (const member of outerWays) {
        if (!member.geometry) continue;

        // Extract coordinates for this outer way
        const coords = member.geometry.map(point => [point.lon, point.lat]);

        // Ensure the polygon is closed
        if (coords.length >= 4) {
            const first = coords[0];
            const last = coords[coords.length - 1];
            if (first[0] !== last[0] || first[1] !== last[1]) {
                coords.push(first);
            }
            polygons.push(coords);
        }
    }

    if (!polygons.length) return null;

    // Generate the WKT representation
    if (polygons.length === 1) {
        // Single polygon
        return {
            wkt: `POLYGON((${polygons[0].map(c => c.join(' ')).join(',')}))`,
            centroid: calculateCentroid(`POLYGON((${polygons[0].map(c => c.join(' ')).join(',')}))`)
        };
    } else {
        // Multiple polygons -> MultiPolygon
        const multiPolygon = polygons.map(
            poly => `((${poly.map(c => c.join(' ')).join(',')}))`
        ).join(',');
        const multiPolygonWkt = `MULTIPOLYGON(${multiPolygon})`;

        return {
            wkt: multiPolygonWkt,
            centroid: calculateCentroid(polygons.flat()) // Centroid of all points
        };
    }
}

// Calculate centroid (same as previous script)
function calculateCentroid(wktPolygonOrPoints) {
    let coordinates;

    // Handle WKT input or directly a set of coordinates
    if (typeof wktPolygonOrPoints === 'string') {
        const matches = wktPolygonOrPoints.match(/\(\(([^)]+)\)\)/);
        if (!matches) return null;

        coordinates = matches[1]
            .split(',')
            .map(pair => pair.trim().split(' ').map(Number));
    } else {
        coordinates = wktPolygonOrPoints; // Assume it's already an array of [lon, lat]
    }

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

// Fetch state/province from Nominatim API (same as previous script)
async function fetchProvinceFromNominatim(lat, lon) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&accept-language=en`;
    try {
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            // Prefer English names if available
            const state = 
                data.address?.state_en || 
                data.address?.["addr:state"] || 
                data.address?.state || 
                data.address?.province || 
                "Unknown";
            return state;
        } else {
            console.error(`[ERROR] Failed to fetch data from Nominatim API: ${response.statusText}`);
            return "Unknown";
        }
    } catch (err) {
        console.error(`[ERROR] Nominatim API call failed: ${err.message}`);
        return "Unknown";
    }
}

// Check if city exists in the database (same as previous script)
async function findCityByName(cityName, stateOrProvince, adminLevel, countryId) {
    const query = `
        SELECT id, boundary FROM places 
        WHERE name = $1 
        AND state_or_province = $2
        AND country_id = $3
        AND admin_level = $4
    `;
    const res = await client.query(query, [cityName, stateOrProvince, countryId, adminLevel]);
    return res.rows[0] || null;
}

// Add a new city with boundary (same as previous script)
async function addCity(cityName, countryId, latitude, longitude, stateOrProvince, wktPolygon, osmId, population, adminLevel) {
    const insertQuery = `
        INSERT INTO places (
            name, 
            country_id, 
            latitude, 
            longitude, 
            state_or_province, 
            boundary, 
            osm_id, 
            population, 
            admin_level
        ) 
        VALUES ($1, $2, $3, $4, $5, ST_GeomFromText($6, 4326), $7, $8, $9) RETURNING id
    `;
    const res = await client.query(insertQuery, [
        cityName, 
        countryId, 
        latitude, 
        longitude, 
        stateOrProvince, 
        wktPolygon, 
        osmId, 
        population || null, 
        adminLevel ? parseInt(adminLevel) : null  // Parse to integer
    ]);
    return res.rows[0].id;
}

// Update an existing city's data (same as previous script)
async function updateCityPartial(cityId, updates) {
    const updateFields = [];
    const values = [];
    let paramCount = 1;

    // Fetch existing boundary for comparison
    if (updates.wktPolygon !== undefined) {
        const existingBoundaryQuery = `
            SELECT ST_AsText(boundary) as boundary 
            FROM places 
            WHERE id = $1
        `;
        const existingBoundaryRes = await client.query(existingBoundaryQuery, [cityId]);
        if (existingBoundaryRes.rows.length > 0) {
            const existingBoundary = existingBoundaryRes.rows[0].boundary;
            if (existingBoundary === updates.wktPolygon) {
                console.log(`[INFO] Skipping update for city ${cityId} as boundary is unchanged.`);
                return;
            }
        }
        updateFields.push(`boundary = ST_GeomFromText($${paramCount++}, 4326)`);
        values.push(updates.wktPolygon);
    }

    if (updates.latitude !== undefined) {
        updateFields.push(`latitude = $${paramCount++}`);
        values.push(updates.latitude);
    }
    if (updates.longitude !== undefined) {
        updateFields.push(`longitude = $${paramCount++}`);
        values.push(updates.longitude);
    }
    if (updates.stateOrProvince !== undefined) {
        updateFields.push(`state_or_province = $${paramCount++}`);
        values.push(updates.stateOrProvince);
    }
    if (updates.osmId !== undefined) {
        updateFields.push(`osm_id = $${paramCount++}`);
        values.push(updates.osmId);
    }
    if (updates.population !== undefined) {
        updateFields.push(`population = $${paramCount++}`);
        values.push(updates.population);
    }
    if (updates.adminLevel !== undefined) {
        updateFields.push(`admin_level = $${paramCount++}`);
        values.push(updates.adminLevel);
    }

    if (updateFields.length === 0) return;

    values.push(cityId);
    const updateQuery = `
        UPDATE places
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
    `;

    await client.query(updateQuery, values);
}

// Process places for a specific admin level
async function processPlaces(adminLevel) {
    const places = await fetchPlacesFromOverpass(adminLevel);
    if (!places.length) {
        console.log(`No places found for admin level ${adminLevel}.`);
        return;
    }

    for (const place of places) {
        // Log detailed information for osm_id 1543125
        if (place.id === 1543125) {
            const debugContent = JSON.stringify(place, null, 2);
            const filePath = './debug_osm_1543125.json';
        
            fs.writeFile(filePath, debugContent, (err) => {
                if (err) {
                    console.error(`[ERROR] Failed to write debug information for osm_id 1543125 to file: ${err.message}`);
                } else {
                    console.log(`[DEBUG] Full content for osm_id 1543125 has been written to ${filePath}`);
                }
            });
        }        

        // Skip places without a name
        const cityName = place.tags?.["name:en"] || place.tags?.name || 'Unknown';
        if (cityName === 'Unknown') continue;

        // Parse polygon and calculate centroid
        const parsedPolygon = parsePolygon(place);
        if (!parsedPolygon || !parsedPolygon.wkt || !parsedPolygon.centroid) {
            console.log(`[WARN] Could not parse polygon or centroid for ${cityName} (Admin Level ${adminLevel})`);
            continue;
        }

        const { wkt: wktPolygon, centroid } = parsedPolygon;

        // Fetch state or province using centroid
        let stateOrProvince = place.tags?.["addr:state"] || place.tags?.["is_in:state"];
        if (!stateOrProvince || stateOrProvince === "Unknown") {
            stateOrProvince = await fetchProvinceFromNominatim(centroid.lat, centroid.lon);
        }

        // Log parsed polygon details for osm_id 1543125
        if (place.id === 1543125) {
            console.log(`[DEBUG] Parsed polygon for osm_id 1543125:\nWKT: ${wktPolygon}\nCentroid: ${JSON.stringify(centroid)}`);
        }

        // Extract additional metadata
        const osmId = place.id;
        const population = place.tags?.population ? parseInt(place.tags.population) : null;
        const adminLevelTag = place.tags?.["admin_level"] || null;

        const countryId = 298; // Japan
        const existingCity = await findCityByName(cityName, stateOrProvince, adminLevelTag, countryId);

        if (existingCity) {
            console.log(`[INFO] Updating ${cityName} (Admin Level ${adminLevel})`);
            await updateCityPartial(existingCity.id, {
                latitude: centroid.lat,
                longitude: centroid.lon,
                stateOrProvince,
                osmId,
                population,
                adminLevel: adminLevelTag ? parseInt(adminLevelTag) : null,
                wktPolygon: wktPolygon
            });
        } else {
            console.log(`[INFO] Adding new ${cityName} (Admin Level ${adminLevel})`);
            await addCity(
                cityName, 
                countryId, 
                centroid.lat, 
                centroid.lon, 
                stateOrProvince, 
                wktPolygon, 
                osmId, 
                population, 
                adminLevelTag
            );
        }
    }
}

// Main processing loop
(async function main() {
    try {
        console.log('Connecting to the database...');
        await client.connect();
        console.log('Connected.');

        // Process admin levels sequentially
        const adminLevels = [4,5,6,7, 8, 9, 10];
        
        for (const adminLevel of adminLevels) {
            console.log(`\n--- Processing Admin Level ${adminLevel} ---`);
            await processPlaces(adminLevel);
        }

        console.log('Processing completed.');
    } catch (error) {
        console.error(`[ERROR] Execution failed: ${error.message}`);
    } finally {
        console.log('Closing database connection.');
        await client.end();
    }
})();