const axios = require('axios');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'cityCountryPairs.json');

// Check if the file exists, if not, create an empty array in it
if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]));
}

// Function to standardize country names
function standardizeCountryName(country) {
    const countryMapping = {
        "People's Republic of China": "China",
        "United States of America": "United States",
        "Russian Federation": "Russia",
        "Republic of India": "India",
        // Add more mappings as needed
    };
    return countryMapping[country] || country; // Return the mapped name or the original if not found
}

// Helper function to fetch a random city and its country from the API
async function fetchRandomCityCountry() {
    try {
        const response = await axios.get('http://geodb-free-service.wirefreethought.com/v1/geo/cities', {
            params: {
                limit: 1,
                offset: Math.floor(Math.random() * 10000)  // Random offset for a random city
            },
            timeout: 5000  // Set a timeout to 5 seconds
        });

        if (response.data && response.data.data && response.data.data.length > 0) {
            const cityInfo = response.data.data[0];
            // Standardize the country name before returning
            const standardizedCountry = standardizeCountryName(cityInfo.country);
            return { city: cityInfo.name, country: standardizedCountry };
        } else {
            console.error('No city data received');
            return null;
        }
    } catch (error) {
        console.error('Failed to fetch city-country data:', error);
        return null;
    }
}

// Helper function to check if the city-country pair already exists in the file
function isCityCountryPairExists(cityCountryPairs, newPair) {
    return cityCountryPairs.some(pair => pair.city === newPair.city && pair.country === newPair.country);
}

// Function to collect city-country pairs
async function collectCityCountryPairs() {
    const cityCountryPairs = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const numberOfPairsToCollect = 1000000; // Number of pairs to collect; adjust as needed

    for (let i = 0; i < numberOfPairsToCollect; i++) {
        const cityCountryPair = await fetchRandomCityCountry();
        if (cityCountryPair && !isCityCountryPairExists(cityCountryPairs, cityCountryPair)) {
            cityCountryPairs.push(cityCountryPair);
            console.log(`Collected pair ${i + 1}: ${cityCountryPair.city}, ${cityCountryPair.country}`);
        }

        // Save to file every 10 pairs to ensure data isn't lost
        if (i % 10 === 0) {
            fs.writeFileSync(filePath, JSON.stringify(cityCountryPairs, null, 2));
            console.log(`Saved ${cityCountryPairs.length} pairs to file`);
        }
    }

    // Save remaining pairs if the loop finishes
    fs.writeFileSync(filePath, JSON.stringify(cityCountryPairs, null, 2));
    console.log(`Finished collecting. Total pairs collected: ${cityCountryPairs.length}`);
}

collectCityCountryPairs().catch(error => {
    console.error('Error during collection:', error);
});
