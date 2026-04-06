#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DATA_FILE = path.join(PROJECT_ROOT, 'artifacts/tawbah-web/src/pages/islamic-programs/data.tsx');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'artifacts/tawbah-web/public');
const TARGET_DIR = path.join(PUBLIC_DIR, 'islamicaudio/assets/media');

// Ensure target directory exists
fs.mkdirSync(TARGET_DIR, { recursive: true });

// Read data.tsx and extract image URLs ONLY (not audio)
const dataContent = fs.readFileSync(DATA_FILE, 'utf-8');
const urlRegex = /https:\/\/islamicaudio\.net\/assets\/media\/[^"'\s]+\.(jpg|jpeg|png|gif|webp)/g;
const urls = [...new Set(dataContent.match(urlRegex) || [])];

console.log(`Found ${urls.length} unique image URLs to download`);

let downloaded = 0;
let failed = 0;

function downloadFile(url, targetPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(targetPath);

    protocol.get(url, (res) => {
      if (res.statusCode >= 400) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }

      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(targetPath, () => {}); // Delete partial file
      reject(err);
    });
  });
}

async function downloadAll() {
  for (const url of urls) {
    try {
      const filename = path.basename(new URL(url).pathname);
      const targetPath = path.join(TARGET_DIR, filename);
      
      // Skip if already exists
      if (fs.existsSync(targetPath)) {
        console.log(`✓ Already exists: ${filename}`);
        downloaded++;
        continue;
      }

      console.log(`Downloading: ${filename}`);
      await downloadFile(url, targetPath);
      downloaded++;
      console.log(`✓ Downloaded: ${filename}`);
    } catch (err) {
      failed++;
      console.error(`✗ Failed: ${url} - ${err.message}`);
    }
  }

  console.log(`\nDownload complete: ${downloaded} succeeded, ${failed} failed`);
}

// Update data.tsx to use local paths
function updateDataFile() {
  const updatedContent = dataContent.replace(
    /https:\/\/islamicaudio\.net\/assets\/media\//g,
    '/islamicaudio/assets/media/'
  );
  
  fs.writeFileSync(DATA_FILE, updatedContent);
  console.log('\n✓ Updated data.tsx to use local image paths');
}

// Run
downloadAll().then(() => {
  if (process.env.UPDATE_DATA_FILE === "1") {
    updateDataFile();
  } else {
    console.log("\nSkipping data.tsx rewrite. Set UPDATE_DATA_FILE=1 to enable.");
  }
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
