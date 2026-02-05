// Simple build script for the Zed extension
const fs = require('fs');
const path = require('path');

console.log('Building ZombieCoder Zed Extension...');

// Copy source files to dist directory
const srcDir = './src';
const distDir = './dist';

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

// Copy all JS files from src to dist
const files = fs.readdirSync(srcDir);
files.forEach(file => {
  if (path.extname(file) === '.js') {
    const srcFile = path.join(srcDir, file);
    const distFile = path.join(distDir, file);
    fs.copyFileSync(srcFile, distFile);
    console.log(`Copied ${srcFile} to ${distFile}`);
  }
});

console.log('Build completed successfully!');