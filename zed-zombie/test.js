// Simple test script for the Zed extension
console.log('Testing ZombieCoder Zed Extension setup...');

// Check if required files exist
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  './src/main.js',
  './src/lsp_proxy.js',
  './src/dap_proxy.js',
  './package.json'
];

let allFilesExist = true;

requiredFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.error(`Missing required file: ${file}`);
    allFilesExist = false;
  } else {
    console.log(`Found required file: ${file}`);
  }
});

if (allFilesExist) {
  console.log('All required files present. Extension setup is correct.');
  process.exit(0);
} else {
  console.error('Some required files are missing. Please check the extension setup.');
  process.exit(1);
}