// utils/jsonWriter.js
const fs = require('fs');
const path = require('path');
const logger = require('../middlewares/logger');

const writeJsonToFile = (data, filename) => {
    // Create 'output' directory if it doesn't exist
    const outputDir = path.join(__dirname, '../output');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    const filepath = path.join(outputDir, filename);
    
    try {
        fs.writeFileSync(
            filepath,
            JSON.stringify(data, null, 2),
            'utf8'
        );
        logger.info(`Successfully wrote data to ${filepath}`);
        return true;
    } catch (err) {
        logger.error(`Error writing JSON to file: ${err.message}`);
        return false;
    }
};

module.exports = {
    writeJsonToFile
};