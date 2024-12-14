import pkg from 'pg';
const { Pool } = pkg;
import fetch from 'node-fetch';
import fs from 'fs/promises';

// Database configuration
const dbConfig = {
    user: 'postgres',
    host: 'localhost',
    database: 'locations',
    password: 'REMOVED_PASSWORD',
    port: 5432,
};

const pool = new Pool(dbConfig);

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
    const innerWays = place.members.filter(m => m.type === 'way' && m.role === 'inner');

    if (!outerWays.length) return null;

    const outerRings = buildRings(outerWays);
    const innerRings = buildRings(innerWays);

    if (!outerRings.length) return null;

    const polygons = outerRings.map(outerRing => {
        const holes = innerRings.filter(innerRing => isRingContained(innerRing, outerRing));
        return `((${outerRing.map(c => c.join(' ')).join(',')}),` +
               holes.map(hole => `(${hole.map(c => c.join(' ')).join(',')})`).join(',') +
               `)`;
    });

    const wkt = polygons.length === 1
        ? `POLYGON${polygons[0]}`
        : `MULTIPOLYGON(${polygons.join(',')})`;

    const allCoordinates = outerRings.flat();
    const centroid = calculateCentroid(allCoordinates);

    return {
        wkt,
        centroid
    };
}

// Build rings from ways
function buildRings(ways) {
    const rings = [];
    const segments = ways.map(way => way.geometry.map(point => [point.lon, point.lat]));

    while (segments.length) {
        let ring = segments.shift();

        let extended = true;
        while (extended) {
            extended = false;

            for (let i = 0; i < segments.length; i++) {
                const segment = segments[i];
                if (coordinatesMatch(ring[ring.length - 1], segment[0])) {
                    ring = ring.concat(segment.slice(1));
                    segments.splice(i, 1);
                    extended = true;
                    break;
                } else if (coordinatesMatch(ring[ring.length - 1], segment[segment.length - 1])) {
                    ring = ring.concat(segment.reverse().slice(1));
                    segments.splice(i, 1);
                    extended = true;
                    break;
                }
            }
        }

        if (!coordinatesMatch(ring[0], ring[ring.length - 1])) {
            ring.push(ring[0]);
        }

        rings.push(ring);
    }

    return rings;
}

// Check if inner ring is contained within outer ring
function isRingContained(innerRing, outerRing) {
    const [x, y] = innerRing[0];
    return isPointInPolygon(x, y, outerRing);
}

// Point-in-polygon test
function isPointInPolygon(x, y, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i];
        const [xj, yj] = polygon[j];

        const intersect = yi > y !== yj > y &&
            x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
    }
    return inside;
}

// Check if two coordinates match
function coordinatesMatch(coord1, coord2) {
    return coord1[0] === coord2[0] && coord1[1] === coord2[1];
}

// Calculate centroid
function calculateCentroid(wktPolygonOrPoints) {
    let coordinates;

    if (typeof wktPolygonOrPoints === 'string') {
        const matches = wktPolygonOrPoints.match(/\(\(([^)]+)\)\)/);
        if (!matches) return null;

        coordinates = matches[1]
            .split(',')
            .map(pair => pair.trim().split(' ').map(Number));
    } else {
        coordinates = wktPolygonOrPoints;
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

// Process places for a specific admin level
async function processPlaces(adminLevel) {
    const places = await fetchPlacesFromOverpass(adminLevel);
    if (!places.length) {
        console.log(`No places found for admin level ${adminLevel}.`);
        return;
    }

    for (const place of places) {
        if (place.id === 1543125) {
            const debugContent = JSON.stringify(place, null, 2);
            const filePath = './debug_osm_1543125.json';
            await fs.writeFile(filePath, debugContent);
            console.log(`[DEBUG] Full content for osm_id 1543125 has been written to ${filePath}`);
        }

        const cityName = place.tags?.["name:en"] || place.tags?.name || 'Unknown';
        if (cityName === 'Unknown') continue;

        const parsedPolygon = parsePolygon(place);
        if (!parsedPolygon || !parsedPolygon.wkt || !parsedPolygon.centroid) {
            console.log(`[WARN] Could not parse polygon or centroid for ${cityName}`);
            continue;
        }

        const { wkt: wktPolygon, centroid } = parsedPolygon;

        let stateOrProvince = place.tags?.["addr:state"] || place.tags?.["is_in:state"];
        if (!stateOrProvince) {
            stateOrProvince = await fetchProvinceFromNominatim(centroid.lat, centroid.lon);
        }

        console.log(`[INFO] Processed ${cityName} with polygon.`);
    }
}

// Main processing loop
(async function main() {
    try {
        console.log('Starting process...');
        const adminLevels = [4, 5, 6];
        for (const adminLevel of adminLevels) {
            await processPlaces(adminLevel);
        }
        console.log('Process complete.');
    } catch (error) {
        console.error(`[ERROR] ${error.message}`);
    } finally {
        await pool.end();
    }
})();
