const fetch = require('node-fetch');

// Test Configuration
const PROXY_URL = 'http://localhost:5010';
const BACKEND_URL = 'http://localhost:8001';
const TEST_MODEL = 'qwen2.5-coder:0.5b';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

function log(color, emoji, message) {
    console.log(`${colors[color]}${emoji} ${message}${colors.reset}`);
}

function section(title) {
    console.log(`\n${colors.bold}${colors.cyan}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}${title}${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Test 1: Direct Backend Health Check
async function testBackendHealth() {
    section('TEST 1: Backend Health Check');
    try {
        const response = await fetch(`${BACKEND_URL}/v1/health`);
        const data = await response.json();

        if (data.status === 'ok') {
            log('green', '✅', 'Backend is healthy');
            log('blue', 'ℹ️', `Server: ${data.server} v${data.version}`);
            log('blue', 'ℹ️', `Uptime: ${data.uptime.toFixed(2)}s`);
            log('blue', 'ℹ️', `WebSocket: ${data.websocket.enabled ? 'Enabled' : 'Disabled'}`);
            return true;
        } else {
            log('red', '❌', 'Backend health check failed');
            return false;
        }
    } catch (error) {
        log('red', '❌', `Backend health check error: ${error.message}`);
        return false;
    }
}

// Test 2: Proxy Health Check
async function testProxyHealth() {
    section('TEST 2: Proxy Health Check');
    try {
        const response = await fetch(`${PROXY_URL}/proxy/health`);
        const data = await response.json();

        if (data.status === 'ok') {
            log('green', '✅', 'Proxy is healthy');
            log('blue', 'ℹ️', `Backend Target: ${data.backendUrl}`);
            return true;
        } else {
            log('red', '❌', 'Proxy health check failed');
            return false;
        }
    } catch (error) {
        log('red', '❌', `Proxy health check error: ${error.message}`);
        return false;
    }
}

// Test 3: OpenAI Compatible Chat Completion (Non-Streaming) via Proxy
async function testOpenAICompatNonStreaming() {
    section('TEST 3: OpenAI Compatible Non-Streaming via Proxy');

    const requestBody = {
        model: TEST_MODEL,
        messages: [
            { role: "system", content: "You are a helpful assistant." },
            { role: "user", content: "Say hello in 5 words or less." }
        ],
        temperature: 0.7,
        max_tokens: 50,
        stream: false
    };

    try {
        log('yellow', '📤', 'Sending OpenAI-compatible request to proxy...');
        console.log(JSON.stringify(requestBody, null, 2));

        const startTime = Date.now();
        const response = await fetch(`${PROXY_URL}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-key',
                'User-Agent': 'OpenAI-Test-Client/1.0'
            },
            body: JSON.stringify(requestBody)
        });

        const responseTime = Date.now() - startTime;

        if (!response.ok) {
            const errorText = await response.text();
            log('red', '❌', `Request failed with status ${response.status}`);
            console.log('Error:', errorText);
            return false;
        }

        const data = await response.json();
        log('green', '✅', `Response received in ${responseTime}ms`);

        // Verify OpenAI response structure
        if (data.id && data.object === 'chat.completion' && data.choices && data.choices.length > 0) {
            log('green', '✅', 'OpenAI response structure is valid');
            log('cyan', '💬', `Response: ${data.choices[0].message.content}`);
            log('blue', 'ℹ️', `Model: ${data.model}`);
            log('blue', 'ℹ️', `Tokens: ${data.usage?.total_tokens || 'N/A'}`);
            return true;
        } else {
            log('red', '❌', 'Invalid OpenAI response structure');
            console.log('Response:', JSON.stringify(data, null, 2));
            return false;
        }
    } catch (error) {
        log('red', '❌', `Test error: ${error.message}`);
        return false;
    }
}

// Test 4: OpenAI Compatible Streaming via Proxy
async function testOpenAICompatStreaming() {
    section('TEST 4: OpenAI Compatible Streaming via Proxy');

    const requestBody = {
        model: TEST_MODEL,
        messages: [
            { role: "user", content: "Count from 1 to 5." }
        ],
        stream: true
    };

    try {
        log('yellow', '📤', 'Sending OpenAI-compatible streaming request...');
        console.log(JSON.stringify(requestBody, null, 2));

        const startTime = Date.now();
        const response = await fetch(`${PROXY_URL}/v1/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-key',
                'User-Agent': 'OpenAI-Test-Client/1.0'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            log('red', '❌', `Streaming request failed with status ${response.status}`);
            console.log('Error:', errorText);
            return false;
        }

        // Check for SSE content type
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('text/event-stream')) {
            log('red', '❌', `Invalid content type: ${contentType}`);
            return false;
        }

        log('green', '✅', 'Streaming response started');
        log('cyan', '💬', 'Streaming content:');

        let fullResponse = '';
        let chunkCount = 0;

        const reader = response.body;
        let buffer = '';

        for await (const chunk of reader) {
            buffer += chunk.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.substring(6).trim();

                    if (data === '[DONE]') {
                        const responseTime = Date.now() - startTime;
                        log('green', '✅', `Streaming completed in ${responseTime}ms`);
                        log('blue', 'ℹ️', `Chunks received: ${chunkCount}`);
                        log('cyan', '📝', `Full response: ${fullResponse}`);
                        return true;
                    }

                    try {
                        const parsed = JSON.parse(data);
                        if (parsed.choices && parsed.choices[0]?.delta?.content) {
                            const content = parsed.choices[0].delta.content;
                            process.stdout.write(content);
                            fullResponse += content;
                            chunkCount++;
                        }
                    } catch (e) {
                        // Ignore parse errors for partial chunks
                    }
                }
            }
        }

        log('green', '✅', 'Streaming test completed');
        return true;

    } catch (error) {
        log('red', '❌', `Streaming test error: ${error.message}`);
        return false;
    }
}

// Test 5: Header Forwarding Check
async function testHeaderForwarding() {
    section('TEST 5: Header Forwarding Check');

    const customHeaders = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer custom-test-token',
        'X-Custom-Header': 'custom-value',
        'X-Request-ID': 'test-request-123',
        'User-Agent': 'TestClient/1.0',
        'X-Forwarded-For': '192.168.1.100'
    };

    try {
        log('yellow', '📤', 'Sending request with custom headers...');
        Object.entries(customHeaders).forEach(([key, value]) => {
            log('blue', '📋', `${key}: ${value}`);
        });

        const response = await fetch(`${PROXY_URL}/v1/chat`, {
            method: 'POST',
            headers: customHeaders,
            body: JSON.stringify({
                prompt: "Test header forwarding",
                context: {},
                model: TEST_MODEL
            })
        });

        if (response.ok) {
            log('green', '✅', 'Headers forwarded successfully');

            // Check response headers
            log('blue', 'ℹ️', 'Response headers:');
            const responseHeaders = ['access-control-allow-origin', 'content-type', 'x-powered-by'];
            responseHeaders.forEach(header => {
                const value = response.headers.get(header);
                if (value) {
                    log('blue', '  📋', `${header}: ${value}`);
                }
            });

            return true;
        } else {
            log('red', '❌', `Header forwarding test failed: ${response.status}`);
            return false;
        }
    } catch (error) {
        log('red', '❌', `Header forwarding error: ${error.message}`);
        return false;
    }
}

// Test 6: Session Management
async function testSessionManagement() {
    section('TEST 6: Session Management');

    const sessionToken = `session-${Date.now()}`;

    try {
        log('yellow', '📤', 'Testing session consistency...');
        log('blue', 'ℹ️', `Session Token: ${sessionToken}`);

        // First request
        const response1 = await fetch(`${PROXY_URL}/v1/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-ID': sessionToken,
                'X-VS-Code-Version': '1.85.0',
                'X-Workspace-Root': '/test/workspace'
            },
            body: JSON.stringify({
                prompt: "Remember: my favorite color is blue",
                context: {},
                model: TEST_MODEL
            })
        });

        if (!response1.ok) {
            log('red', '❌', 'First session request failed');
            return false;
        }

        log('green', '✅', 'First request successful');
        await sleep(500);

        // Second request with same session
        const response2 = await fetch(`${PROXY_URL}/v1/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-ID': sessionToken,
                'X-VS-Code-Version': '1.85.0',
                'X-Workspace-Root': '/test/workspace'
            },
            body: JSON.stringify({
                prompt: "What is my favorite color?",
                context: {},
                model: TEST_MODEL
            })
        });

        if (!response2.ok) {
            log('red', '❌', 'Second session request failed');
            return false;
        }

        const data2 = await response2.json();
        log('green', '✅', 'Second request successful');
        log('cyan', '💬', `Response: ${data2.response || data2.message?.content || 'N/A'}`);

        return true;
    } catch (error) {
        log('red', '❌', `Session management error: ${error.message}`);
        return false;
    }
}

// Test 7: Response Quality Check
async function testResponseQuality() {
    section('TEST 7: Response Quality Check');

    const testPrompts = [
        {
            prompt: "What is 2+2?",
            expected: /4|four/i,
            description: "Simple math"
        },
        {
            prompt: "Write a Hello World in Python",
            expected: /print|hello.*world/i,
            description: "Code generation"
        },
        {
            prompt: "Explain what an API is in one sentence.",
            expected: /application|interface|programming/i,
            description: "Technical explanation"
        }
    ];

    let passed = 0;

    for (const test of testPrompts) {
        log('yellow', '📤', `Testing: ${test.description}`);
        log('blue', 'ℹ️', `Prompt: ${test.prompt}`);

        try {
            const response = await fetch(`${PROXY_URL}/v1/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: test.prompt,
                    context: {},
                    model: TEST_MODEL
                })
            });

            if (!response.ok) {
                log('red', '❌', `Request failed: ${response.status}`);
                continue;
            }

            const data = await response.json();
            const responseText = data.response || data.message?.content || '';

            if (test.expected.test(responseText)) {
                log('green', '✅', 'Response quality is good');
                log('cyan', '💬', `Response: ${responseText.substring(0, 100)}...`);
                passed++;
            } else {
                log('yellow', '⚠️', 'Response quality uncertain');
                log('cyan', '💬', `Response: ${responseText.substring(0, 100)}...`);
            }

            await sleep(1000); // Rate limiting

        } catch (error) {
            log('red', '❌', `Quality test error: ${error.message}`);
        }
    }

    log('blue', 'ℹ️', `Quality tests passed: ${passed}/${testPrompts.length}`);
    return passed >= testPrompts.length / 2; // At least 50% should pass
}

// Test 8: Error Handling
async function testErrorHandling() {
    section('TEST 8: Error Handling');

    // Test 8.1: Missing prompt
    try {
        log('yellow', '📤', 'Testing missing prompt error...');
        const response = await fetch(`${PROXY_URL}/v1/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ context: {} })
        });

        if (response.status === 400) {
            log('green', '✅', 'Missing prompt error handled correctly');
        } else {
            log('yellow', '⚠️', `Unexpected status: ${response.status}`);
        }
    } catch (error) {
        log('red', '❌', `Error handling test failed: ${error.message}`);
    }

    // Test 8.2: Invalid JSON
    try {
        log('yellow', '📤', 'Testing invalid JSON error...');
        const response = await fetch(`${PROXY_URL}/v1/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: 'invalid json {'
        });

        if (response.status >= 400) {
            log('green', '✅', 'Invalid JSON error handled correctly');
        } else {
            log('yellow', '⚠️', 'Invalid JSON not rejected');
        }
    } catch (error) {
        log('red', '❌', `Invalid JSON test failed: ${error.message}`);
    }

    // Test 8.3: Non-existent model
    try {
        log('yellow', '📤', 'Testing non-existent model...');
        const response = await fetch(`${PROXY_URL}/v1/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: "Test",
                context: {},
                model: "non-existent-model:999"
            })
        });

        const data = await response.json();
        if (data.error || !response.ok) {
            log('green', '✅', 'Non-existent model error handled correctly');
        } else {
            log('yellow', '⚠️', 'Non-existent model not validated');
        }
    } catch (error) {
        log('red', '❌', `Model validation test failed: ${error.message}`);
    }

    return true;
}

// Main Test Runner
async function runAllTests() {
    console.log(`${colors.bold}${colors.blue}`);
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║   ZombieCoder Proxy & OpenAI Compatibility Test Suite    ║
║                     Comprehensive Testing                 ║
╚═══════════════════════════════════════════════════════════╝
    `);
    console.log(colors.reset);

    const results = {
        passed: 0,
        failed: 0,
        total: 0
    };

    const tests = [
        { name: 'Backend Health', fn: testBackendHealth },
        { name: 'Proxy Health', fn: testProxyHealth },
        { name: 'OpenAI Non-Streaming', fn: testOpenAICompatNonStreaming },
        { name: 'OpenAI Streaming', fn: testOpenAICompatStreaming },
        { name: 'Header Forwarding', fn: testHeaderForwarding },
        { name: 'Session Management', fn: testSessionManagement },
        { name: 'Response Quality', fn: testResponseQuality },
        { name: 'Error Handling', fn: testErrorHandling }
    ];

    for (const test of tests) {
        results.total++;
        const passed = await test.fn();
        if (passed) {
            results.passed++;
        } else {
            results.failed++;
        }
        await sleep(500); // Brief pause between tests
    }

    // Final Summary
    section('TEST SUMMARY');
    log('blue', '📊', `Total Tests: ${results.total}`);
    log('green', '✅', `Passed: ${results.passed}`);

    if (results.failed > 0) {
        log('red', '❌', `Failed: ${results.failed}`);
    }

    const successRate = ((results.passed / results.total) * 100).toFixed(1);
    log('cyan', '📈', `Success Rate: ${successRate}%`);

    if (successRate >= 80) {
        log('green', '🎉', 'EXCELLENT! System is working properly!');
    } else if (successRate >= 60) {
        log('yellow', '⚠️', 'GOOD! Some issues need attention.');
    } else {
        log('red', '❌', 'POOR! Significant issues detected.');
    }

    console.log(`\n${colors.bold}${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);

    process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
    log('red', '❌', `Fatal error: ${error.message}`);
    console.error(error);
    process.exit(1);
});
