// Simple script to create placeholder icons
// Run: node assets/generate-icons.js

const fs = require('fs');
const path = require('path');

// Create a simple SVG icon (cacao pod shape)
const createSVG = (size, bg = '#8b5a3c') => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${bg}"/>
  <ellipse cx="${size/2}" cy="${size/2}" rx="${size*0.3}" ry="${size*0.4}" fill="#d4a574"/>
  <ellipse cx="${size/2}" cy="${size/2}" rx="${size*0.25}" ry="${size*0.35}" fill="#b8956a"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" 
        font-family="Arial" font-size="${size*0.15}" fill="#fff" font-weight="bold">CY</text>
</svg>`;

// For Expo Go, we just need basic placeholders
console.log('Creating placeholder icons...');

// Create SVG files
fs.writeFileSync(path.join(__dirname, 'icon.svg'), createSVG(1024));
fs.writeFileSync(path.join(__dirname, 'splash.svg'), createSVG(2048, '#1e293b'));
fs.writeFileSync(path.join(__dirname, 'adaptive-icon.svg'), createSVG(1024));
fs.writeFileSync(path.join(__dirname, 'favicon.svg'), createSVG(48));

console.log('✅ SVG icons created in assets/ folder');
console.log('Note: For production, replace with proper PNG files or use:');
console.log('  npx @expo/image-utils resize icon.png');
