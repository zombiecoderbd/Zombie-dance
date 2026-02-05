const WebSocket = require('ws');

// Connect to ZombieCoder backend WebSocket
const ws = new WebSocket('ws://localhost:8001/v1/chat/ws');

ws.on('open', function open() {
    console.log('✅ Connected to ZombieCoder WebSocket');
    console.log('📤 Sending chat message...\n');

    // Send a chat message
    const message = {
        type: 'chat',
        id: Date.now().toString(),
        data: {
            prompt: 'Write a simple hello world function in Python',
            model: 'qwen2.5:0.5b',
            context: null
        }
    };

    ws.send(JSON.stringify(message));
});

ws.on('message', function message(data) {
    try {
        const response = JSON.parse(data.toString());

        switch(response.type) {
            case 'welcome':
                console.log('🎉 Welcome message:', response.data);
                break;

            case 'chat_start':
                console.log('🚀 Chat started with model:', response.data.model);
                console.log('📝 Response:\n');
                break;

            case 'chat_chunk':
                process.stdout.write(response.data.content);
                break;

            case 'chat_complete':
                console.log('\n\n✅ Chat completed!');
                console.log('📊 Response length:', response.data.responseLength);
                console.log('🤖 Model used:', response.data.model);
                ws.close();
                break;

            case 'chat_error':
            case 'error':
                console.error('❌ Error:', response.data.error);
                ws.close();
                break;

            default:
                console.log('📨 Received:', response.type);
        }
    } catch (e) {
        console.error('Failed to parse message:', e);
    }
});

ws.on('error', function error(err) {
    console.error('❌ WebSocket error:', err.message);
});

ws.on('close', function close() {
    console.log('\n👋 Connection closed');
    process.exit(0);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
    console.log('\n⚠️  Interrupted, closing connection...');
    ws.close();
    process.exit(0);
});
