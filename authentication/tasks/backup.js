const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from the .env file
dotenv.config();

const DATABASE_NAME = 'users';
const DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost:27017';
const BACKUP_DIRECTORY = process.env.BACKUP_DIRECTORY || path.join(__dirname, 'backups'); // Ensure this directory exists

const createBackup = () => {
    // Ensure the backup directory exists
    if (!fs.existsSync(BACKUP_DIRECTORY)) {
        fs.mkdirSync(BACKUP_DIRECTORY, { recursive: true });
    }

    const date = new Date();
    const timestamp = `${date.getFullYear()}_${(date.getMonth() + 1).toString().padStart(2, '0')}_${date.getDate().toString().padStart(2, '0')}`;
    const backupPath = path.join(BACKUP_DIRECTORY, `${DATABASE_NAME}_${timestamp}.gz`);

    // Log the backup path to verify
    console.log(`Backup path: ${backupPath}`);

    // Construct the mongodump command to output a single archive file
    const command = `mongodump --uri="${DATABASE_URL}" --db=${DATABASE_NAME} --archive=${backupPath} --gzip`;

    // Log the command to verify
    console.log(`Executing command: ${command}`);

    // Execute the mongodump command
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Backup failed: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Backup stderr: ${stderr}`);
            return;
        }
        console.log(`Backup successful: ${stdout}`);

        // Verify the file exists
        if (fs.existsSync(backupPath)) {
            console.log(`Backup created successfully at: ${backupPath}`);
        } else {
            console.error(`Backup file not found: ${backupPath}`);
        }
    });
};

module.exports = createBackup;
