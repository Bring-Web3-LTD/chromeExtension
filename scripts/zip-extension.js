#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const envParam = process.argv[2] || 'prod';
const version = process.argv[3];

if (!version) {
    console.error('Error: Version parameter is required');
    console.error('Usage: node zip-extension.js <env> <version>');
    process.exit(1);
}

const zipName = `mock-extension-${envParam}-v${version}.zip`;
const buildDir = path.join(__dirname, '../extension-files/test-extension/build');
const buildsDir = path.join(__dirname, '../builds');
const envDir = path.join(buildsDir, envParam);
const versionDir = path.join(envDir, `v${version}`);
const outputPath = path.join(versionDir, zipName);

console.log('Zipping test-extension...');

// Create directory structure
if (!fs.existsSync(buildsDir)) {
    fs.mkdirSync(buildsDir);
}
if (!fs.existsSync(envDir)) {
    fs.mkdirSync(envDir);
}
if (!fs.existsSync(versionDir)) {
    fs.mkdirSync(versionDir);
}

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
    console.log(`✓ Extension zipped to: builds/${envParam}/v${version}/${zipName}`);
} catch (error) {
    console.error('Failed to create zip file:', error.message);
    process.exit(1);
}
