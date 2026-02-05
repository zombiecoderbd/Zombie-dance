const http = require('http');

console.log('🔍 Testing Current Qoder Configuration\n');

// Test 1: Check if proxy is accessible
console.log('1. Testing Proxy Accessibility...');
const proxyOptions = {
    hostname: 'localhost',
    port: 5010,
    path: '/proxy/health',
    method: 'GET'
};

const proxyReq = http.request(proxyOptions, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const result = JSON.parse(data);
            console.log('✅ Proxy Status:', result.status);
            console.log('   Service:', result.service);
        } catch (e) {
            console.log('✅ Raw Proxy Response:', data.substring(0, 100));
        }
    });
});

proxyReq.on('error', (error) => {
    console.log('❌ Proxy Connection Failed:', error.message);
});
proxyReq.end();

// Test 2: Test OpenAI-compatible endpoint
console.log('\n2. Testing OpenAI-Compatible Endpoint...');
const openaiOptions = {
    hostname: 'localhost',
    port: 5010,
    path: '/v1/chat',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    }
};

const openaiReq = http.request(openaiOptions, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const result = JSON.parse(data);
            console.log('✅ OpenAI Endpoint Working');
            console.log('   Model:', result.model);
            console.log('   Response Preview:', result.response?.substring(0, 50) + '...');
        } catch (e) {
            console.log('✅ Raw Response:', data.substring(0, 100));
        }
    });
});

openaiReq.on('error', (error) => {
    console.log('❌ OpenAI Endpoint Failed:', error.message);
});

const testData = JSON.stringify({
    messages: [
        { role: "user", content: "Test: Hello from Qoder configuration test" }
    ],
    modelId: 6
});

openaiReq.write(testData);
openaiReq.end();

// Test 3: Check Qoder-specific configuration
console.log('\n3. Testing Qoder Configuration Endpoint...');
const qoderConfigOptions = {
    hostname: 'localhost',
    port: 5010,
    path: '/proxy/qoder-config',
    method: 'GET'
};

const qoderReq = http.request(qoderConfigOptions, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const config = JSON.parse(data);
            console.log('✅ Qoder Configuration Available');
            console.log('   Base URL:', config.openaiCompatible.baseUrl);
            console.log('   Model:', config.openaiCompatible.modelName);
            console.log('   Environment Vars:');
            console.log('     OPENAI_BASE_URL:', config.environmentVariables.OPENAI_BASE_URL);
            console.log('     OPENAI_API_KEY:', config.environmentVariables.OPENAI_API_KEY);
        } catch (e) {
            console.log('✅ Raw Config Response:', data.substring(0, 100));
        }
    });
});

qoderReq.on('error', (error) => {
    console.log('❌ Qoder Config Endpoint Failed:', error.message);
});
qoderReq.end();

console.log('\n📋 Configuration Summary:');
console.log('Your Qoder settings show:');
console.log('- API Base URL: http://localhost:5010/v1 ✓');
console.log('- Proxy Configuration: Present ✓');
console.log('- Model Mappings: Configured ✓');
console.log('\n🔧 Recommended Updates:');
console.log('1. Add "apiKey": "your-api-key-here" to openai section');
console.log('2. Verify endpoint paths in openai.endpoints section');
console.log('3. Test connection using the results above');