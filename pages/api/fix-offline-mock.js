// pages/api/fix-offline-mock.js
// Next.js API route to run the fixer script on public/scripts/offlineMockData.json and return debug info

import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }
  // Path to the file to fix
  const projectRoot = process.cwd();
  const mockFile = path.join(projectRoot, 'public', 'scripts', 'offlineMockData.json');
  const fixerScript = path.join(projectRoot, 'scripts', 'fixOfflineMockData.js');

  exec(`node "${fixerScript}" "${mockFile}"`, (error, stdout, stderr) => {
    let fileContent = null;
    let fileReadError = null;
    try {
      fileContent = fs.readFileSync(mockFile, 'utf-8');
    } catch (e) {
      fileReadError = e.message;
    }
    if (error) {
      res.status(500).json({ success: false, error: stderr || error.message, stdout, fileContent, fileReadError });
      return;
    }
    res.status(200).json({ success: true, stdout, fileContent, fileReadError });
  });
}
