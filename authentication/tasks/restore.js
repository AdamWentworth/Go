const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const DB_URI = process.env.DATABASE_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'PoGo_App_Users';
const COLLECTION = process.env.COLLECTION || 'users';
const BACKUP_DIR = process.env.BACKUP_DIRECTORY || path.join(__dirname, '../backups');
const BACKUP_FILE = process.env.BACKUP_FILE || ''; // optional explicit file path
const DROP = /^true$/i.test(process.env.DROP || 'true'); // default: replace collection

function pickLatestBackup(dir) {
  const files = fs.readdirSync(dir)
    .filter(f => /^PoGo_App_Users_\d{4}_\d{2}_\d{2}\.gz$/.test(f))
    .map(f => ({ f, t: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  return files.length ? path.join(dir, files[0].f) : null;
}

async function main() {
  const archivePath = BACKUP_FILE || pickLatestBackup(BACKUP_DIR);
  if (!archivePath || !fs.existsSync(archivePath)) {
    console.error('Backup archive not found. Set BACKUP_FILE or ensure backups exist in', BACKUP_DIR);
    process.exit(1);
  }

  const parts = [
    'mongorestore',
    `--uri="${DB_URI}"`,
    `--archive="${archivePath}"`,
    '--gzip',
    `--nsInclude="${DB_NAME}.${COLLECTION}"`,
  ];
  if (DROP) parts.push('--drop');

  const cmd = parts.join(' ');
  console.log('Restoring with:\n', cmd, '\n');

  exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error('Restore failed:', error.message);
      console.error(stderr);
      process.exit(1);
    }
    if (stderr) console.error(stderr);
    console.log(stdout);
    console.log('Restore complete from:', archivePath);
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
