#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const envParam = process.argv[2] || '';
const zipName = envParam ? `test-extension-${envParam}.zip` : 'test-extension-prod.zip';
const buildDir = path.join(__dirname, '../extension-files/test-extension/build');
const outputPath = path.join(__dirname, '..', zipName);

console.log('Zipping test-extension...');

// Remove old zip if exists
if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
}

try {
    // Try to use PowerShell on Windows
    if (process.platform === 'win32') {
        const psCommand = `Compress-Archive -Path "${buildDir}\\*" -DestinationPath "${outputPath}" -Force`;
        execSync(`powershell -Command "${psCommand}"`, { stdio: 'inherit' });
    } else {
        // Use zip on Unix-like systems
        execSync(`cd "${buildDir}" && zip -r "${outputPath}" ./*`, { stdio: 'inherit' });
    }
    console.log(`✓ Extension zipped to: ${zipName}`);
} catch (error) {
    console.error('Failed to create zip file:', error.message);
    process.exit(1);
}
