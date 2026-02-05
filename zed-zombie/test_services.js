// Comprehensive test script for the Zed extension
const http = require('http');
const https = require('https');
const fs = require('fs');

console.log('Testing ZombieCoder Zed Extension service connections...');

// Define service endpoints
const services = [
  { name: 'Main Application', url: 'http://localhost:3000', type: 'http' },
  { name: 'Codebase Sync Service', url: 'http://localhost:5051', type: 'http' },
  { name: 'WebSocket Service', url: 'http://localhost:3003', type: 'http' },
  { name: 'LSP Service', url: 'http://localhost:3004', type: 'http' },
  { name: 'DAP Service', url: 'http://localhost:3005', type: 'http' }
];

// Function to check HTTP service
function checkHttpService(service, callback) {
  console.log(`Checking ${service.name} at ${service.url}...`);
  
  const url = new URL(service.url);
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    console.log(`${service.name}: Status ${res.statusCode}`);
    callback(service, res.statusCode === 200);
  });

  req.on('error', (error) => {
    console.log(`${service.name}: Error - ${error.message}`);
    callback(service, false);
  });

  req.on('timeout', () => {
    console.log(`${service.name}: Request timed out`);
    req.destroy();
    callback(service, false);
  });

  req.end();
}

// Test all services
let completedTests = 0;
const results = {};

services.forEach(service => {
  checkHttpService(service, (service, isSuccessful) => {
    results[service.name] = isSuccessful;
    completedTests++;

    if (completedTests === services.length) {
      console.log('\n--- Test Results ---');
      let allSuccessful = true;
      
      for (const serviceName in results) {
        const status = results[serviceName] ? '✓ Connected' : '✗ Failed';
        console.log(`${serviceName}: ${status}`);
        
        if (!results[serviceName]) {
          allSuccessful = false;
        }
      }

      if (allSuccessful) {
        console.log('\n✓ All services are accessible. The Zed extension should connect properly.');
        process.exit(0);
      } else {
        console.log('\n✗ Some services are not accessible. Please check if all services are running.');
        process.exit(1);
      }
    }
  });
});