// Script to replace scripts/offlineMockData.json with a newly downloaded file
// Usage: node scripts/replaceOfflineMock.js /path/to/downloaded/offlineMockData.json

const fs = require('fs');
const path = require('path');

const [, , newMockPath] = process.argv;
const targetPath = path.resolve(__dirname, 'offlineMockData.json');
const backupPath = path.resolve(__dirname, `offlineMockData.backup.${Date.now()}.json`);

if (!newMockPath) {
  console.error('Usage: node scripts/replaceOfflineMock.js /path/to/downloaded/offlineMockData.json');
  process.exit(1);
}

if (!fs.existsSync(newMockPath)) {
  console.error('File not found:', newMockPath);
  process.exit(1);
}

// Backup current offlineMockData.json if it exists
if (fs.existsSync(targetPath)) {
  fs.copyFileSync(targetPath, backupPath);
  console.log('Backed up previous offlineMockData.json to', backupPath);
}

// Replace offlineMockData.json
fs.copyFileSync(newMockPath, targetPath);
console.log('Replaced offlineMockData.json with', newMockPath);
console.log('Done!');
