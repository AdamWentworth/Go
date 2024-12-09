// backup.js

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const logger = require('../middlewares/logger'); // Ensure logger is properly configured

// Load environment variables from .env file
dotenv.config();

const DATABASE_NAME = 'PoGo_App_Users'; // Your actual database name
const COLLECTION_NAME = 'users'; // The collection you want to back up
const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017';
const BACKUP_DIRECTORY = process.env.BACKUP_DIRECTORY || path.join(__dirname, '../backups'); // Ensure this directory exists

/**
 * Create a database backup.
 */
const createBackup = () => {
    // Ensure the backup directory exists
    if (!fs.existsSync(BACKUP_DIRECTORY)) {
        fs.mkdirSync(BACKUP_DIRECTORY, { recursive: true });
        logger.info(`Created backup directory: ${BACKUP_DIRECTORY}`);
    }

    const date = new Date();
    const timestamp = `${date.getFullYear()}_${(date.getMonth() + 1).toString().padStart(2, '0')}_${date.getDate().toString().padStart(2, '0')}`;
    const backupPath = path.join(BACKUP_DIRECTORY, `${DATABASE_NAME}_${timestamp}.gz`);

    // Log the backup path to verify
    logger.info(`Backup path: ${backupPath}`);

    // Construct the mongodump command to output a single archive file
    const command = `mongodump --uri="${DATABASE_URL}" --db=${DATABASE_NAME} --collection=${COLLECTION_NAME} --archive=${backupPath} --gzip`;

    // Log the command to verify
    logger.debug(`Executing command: ${command}`);

    // Execute the mongodump command
    exec(command, (error, stdout, stderr) => {
        if (error) {
            logger.error(`Backup failed: ${error.message}`);
            return;
        }
        if (stderr) {
            logger.error(`Backup stderr: ${stderr}`);
            return;
        }
        logger.info(`Backup successful: ${stdout}`);

        // Verify the file exists
        if (fs.existsSync(backupPath)) {
            logger.info(`Backup created successfully at: ${backupPath}`);
        } else {
            logger.error(`Backup file not found: ${backupPath}`);
        }

        // Run retention management after backup
        manageRetention();
    });
};

/**
 * Manage backup retention by removing old files based on defined policies.
 */
const manageRetention = () => {
    const today = new Date();
    const dailyCutoff = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
    const monthlyCutoff = new Date(today.getFullYear() - 1, today.getMonth(), 1);
    const yearlyCutoff = new Date(today.getFullYear() - 5, 0, 1);

    fs.readdir(BACKUP_DIRECTORY, (err, files) => {
        if (err) {
            logger.error(`Failed to read backup directory: ${err.message}`);
            return;
        }

        files.forEach(file => {
            const filePath = path.join(BACKUP_DIRECTORY, file);

            // Check if the file is a gzipped backup
            if (path.extname(file) === '.gz') {
                // Parse the date from the filename using regex
                const match = file.match(/(\d{4})_(\d{2})_(\d{2})/);
                if (!match) {
                    logger.error(`Unable to parse date from file: ${file}`);
                    return;
                }

                const [_, year, month, day] = match;
                const fileDate = new Date(`${year}-${month}-${day}`);

                // Log retention checks
                logger.debug(`Checking retention for file: ${file}, FileDate=${fileDate}, DailyCutoff=${dailyCutoff}, MonthlyCutoff=${monthlyCutoff}, YearlyCutoff=${yearlyCutoff}`);

                // Retention logic
                if (fileDate < dailyCutoff && fileDate.getDate() !== 1) {
                    deleteFile(filePath);
                } else if (fileDate < monthlyCutoff && fileDate.getMonth() !== 0) {
                    deleteFile(filePath);
                } else if (fileDate < yearlyCutoff) {
                    deleteFile(filePath);
                }
            }
        });
    });
};

/**
 * Delete a file and log the result.
 * @param {string} filePath - The path to the file to delete.
 */
const deleteFile = (filePath) => {
    fs.unlink(filePath, err => {
        if (err) {
            logger.error(`Failed to delete file: ${filePath}, Error: ${err.message}`);
        } else {
            logger.info(`Deleted old backup: ${filePath}`);
        }
    });
};

// Export the createBackup function for automatic execution in your server
module.exports = createBackup;

// If this script is run directly, execute the backup
if (require.main === module) {
    logger.info('Running backup manually...');
    createBackup();
}