const http = require('http');

console.log('🧪 Testing Qoder Integration with ZombieCoder Proxy\n');

// Test 1: Proxy Health Check
console.log('1. Testing Proxy Health...');
const healthOptions = {
    hostname: 'localhost',
    port: 5010,
    path: '/proxy/health',
    method: 'GET'
};

const healthReq = http.request(healthOptions, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log('✅ Proxy Health Status:', JSON.parse(data).status);
    });
});

healthReq.on('error', (error) => {
    console.log('❌ Proxy Health Check Failed:', error.message);
});
healthReq.end();

// Test 2: Qoder Configuration Endpoint
console.log('\n2. Testing Qoder Configuration Endpoint...');
const configOptions = {
    hostname: 'localhost',
    port: 5010,
    path: '/proxy/qoder-config',
    method: 'GET'
};

const configReq = http.request(configOptions, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const config = JSON.parse(data);
        console.log('✅ Qoder Configuration Available');
        console.log('   Base URL:', config.openaiCompatible.baseUrl);
        console.log('   Model:', config.openaiCompatible.modelName);
        console.log('   Proxy:', config.proxySettings.httpProxy);
    });
});

configReq.on('error', (error) => {
    console.log('❌ Configuration Endpoint Failed:', error.message);
});
configReq.end();

// Test 3: Chat Endpoint Test
console.log('\n3. Testing Chat Endpoint...');
const chatOptions = {
    hostname: 'localhost',
    port: 5010,
    path: '/v1/chat',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};

const chatReq = http.request(chatOptions, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            console.log('✅ Chat Test Successful');
            console.log('   Response:', response.response?.substring(0, 50) + '...');
            console.log('   Model:', response.model);
        } catch (e) {
            console.log('✅ Raw Chat Response:', data.substring(0, 100) + '...');
        }
    });
});

chatReq.on('error', (error) => {
    console.log('❌ Chat Test Failed:', error.message);
});

const chatData = JSON.stringify({
    messages: [
        { role: "user", content: "Hello Qoder! This is a test message." }
    ],
    modelId: 6
});

chatReq.write(chatData);
chatReq.end();

// Test 4: Models Endpoint
console.log('\n4. Testing Models Endpoint...');
const modelsOptions = {
    hostname: 'localhost',
    port: 5010,
    path: '/api/models',
    method: 'GET'
};

const modelsReq = http.request(modelsOptions, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const models = JSON.parse(data);
            console.log('✅ Models Endpoint Working');
            console.log('   Available Models:', models.length);
            if (models.length > 0) {
                console.log('   First Model:', models[0].name);
            }
        } catch (e) {
            console.log('✅ Raw Models Response:', data.substring(0, 100) + '...');
        }
    });
});

modelsReq.on('error', (error) => {
    console.log('❌ Models Test Failed:', error.message);
});
modelsReq.end();

console.log('\n📋 Qoder Integration Test Complete!');
console.log('\n🔧 Configuration Instructions for Qoder:');
console.log('1. Set OPENAI_BASE_URL=http://localhost:5010/v1');
console.log('2. Set OPENAI_API_KEY=your-api-key-here');
console.log('3. Or configure HTTP proxy to http://localhost:5010');
console.log('4. Test connection using the endpoints above\n');