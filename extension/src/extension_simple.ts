import * as vscode from 'vscode';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface StreamResponse {
    type: 'token' | 'error' | 'done';
    content?: string;
    error?: string;
}

export function activate(context: vscode.ExtensionContext) {
    console.log('ZombieCoder Extension is now active!');

    // Simple chat command
    const chatCommand = vscode.commands.registerCommand('zombie.chat', async () => {
        const input = await vscode.window.showInputBox({
            prompt: 'আপনার প্রশ্ন লিখুন (Ask your question)',
            placeHolder: 'কোড সম্পর্কে জিজ্ঞাসা করুন...'
        });

        if (!input) return;

        const panel = vscode.window.createWebviewPanel(
            'zombieChat',
            'ZombieCoder Chat',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        panel.webview.html = getChatWebviewContent();

        // Send initial message
        panel.webview.postMessage({
            type: 'user_message',
            content: input
        });

        // Start streaming chat
        try {
            await streamChat(input, panel.webview);
        } catch (error) {
            panel.webview.postMessage({
                type: 'error',
                content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
            });
        }
    });

    // Test backend connection command
    const testCommand = vscode.commands.registerCommand('zombie.testConnection', async () => {
        const config = vscode.workspace.getConfiguration('zombie');
        const endpoint = config.get<string>('endpoint', 'http://localhost:8001');

        try {
            const response = await fetch(`${endpoint}/v1/health`, {
                method: 'GET',
                headers: {
                    'User-Agent': 'vscode-extension-zombiecoder/2.0.0'
                }
            });

            if (response.ok) {
                const data = await response.json();
                vscode.window.showInformationMessage(
                    `✅ Connected to ZombieCoder! Server: ${data.server || 'Unknown'} v${data.version || 'Unknown'}`
                );
            } else {
                vscode.window.showErrorMessage(
                    `❌ Connection failed: HTTP ${response.status}`
                );
            }
        } catch (error) {
            vscode.window.showErrorMessage(
                `❌ Cannot connect to ${endpoint}. Please ensure the server is running.`
            );
        }
    });

    // Register commands
    context.subscriptions.push(chatCommand);
    context.subscriptions.push(testCommand);

    // Status bar item
    const statusBarItem = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Left,
        100
    );
    statusBarItem.text = '🧟‍♂️ ZombieCoder';
    statusBarItem.command = 'zombie.chat';
    statusBarItem.tooltip = 'Click to start ZombieCoder chat';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Auto-test connection on startup
    setTimeout(async () => {
        try {
            const config = vscode.workspace.getConfiguration('zombie');
            const endpoint = config.get<string>('endpoint', 'http://localhost:8001');
            const response = await fetch(`${endpoint}/v1/health`);

            if (response.ok) {
                vscode.window.showInformationMessage('🧟‍♂️ ZombieCoder backend is connected and ready!');
            } else {
                throw new Error('Health check failed');
            }
        } catch (error) {
            vscode.window.showWarningMessage(
                '⚠️ ZombieCoder backend not reachable. Use "Test Connection" command to check.'
            );
        }
    }, 2000);
}

async function streamChat(prompt: string, webview: vscode.Webview): Promise<void> {
    const config = vscode.workspace.getConfiguration('zombie');
    const endpoint = config.get<string>('endpoint', 'http://localhost:8001');

    // Build context
    const context = await buildContext();

    const payload = {
        prompt,
        context,
        model: 'qwen2.5:0.5b',
        stream: true
    };

    const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'vscode-extension-zombiecoder/2.0.0',
        'X-VS-Code-Version': vscode.version,
        'X-Session-ID': `vscode-${Date.now()}`,
        'X-Workspace-Root': vscode.workspace.rootPath || ''
    };

    webview.postMessage({
        type: 'assistant_start',
        content: 'ZombieCoder is thinking... 🧟‍♂️'
    });

    try {
        const response = await fetch(`${endpoint}/v1/chat/stream`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        if (!response.body) {
            throw new Error('No response body received');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullResponse = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.trim() === '' || !line.startsWith('data: ')) continue;

                const data = line.slice(6).trim();
                if (data === '[DONE]') {
                    webview.postMessage({
                        type: 'assistant_complete',
                        content: fullResponse
                    });
                    return;
                }

                try {
                    const parsed: StreamResponse = JSON.parse(data);

                    if (parsed.type === 'token' && parsed.content) {
                        fullResponse += parsed.content;
                        webview.postMessage({
                            type: 'assistant_chunk',
                            content: parsed.content
                        });
                    } else if (parsed.type === 'error') {
                        throw new Error(parsed.error || 'Unknown streaming error');
                    } else if (parsed.type === 'done') {
                        webview.postMessage({
                            type: 'assistant_complete',
                            content: fullResponse
                        });
                        return;
                    }
                } catch (parseError) {
                    console.warn('Failed to parse SSE data:', data);
                }
            }
        }
    } catch (error) {
        console.error('Streaming error:', error);

        let errorMessage = 'Connection failed';
        if (error instanceof Error) {
            if (error.message.includes('fetch')) {
                errorMessage = `Cannot connect to ZombieCoder backend at ${endpoint}. Please ensure the server is running.`;
            } else {
                errorMessage = error.message;
            }
        }

        webview.postMessage({
            type: 'error',
            content: errorMessage
        });
    }
}

async function buildContext(): Promise<any> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return {};

    const document = editor.document;
    const selection = editor.selection;

    return {
        activeFile: {
            path: vscode.workspace.asRelativePath(document.uri),
            language: document.languageId,
            selection: selection.isEmpty ? null : {
                text: document.getText(selection),
                startLine: selection.start.line,
                endLine: selection.end.line
            }
        },
        workspaceRoot: vscode.workspace.rootPath
    };
}

function getChatWebviewContent(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ZombieCoder Chat</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            height: 100vh;
            display: flex;
            flex-direction: column;
        }

        .header {
            padding: 15px;
            background: var(--vscode-titleBar-activeBackground);
            border-bottom: 1px solid var(--vscode-panel-border);
            text-align: center;
            font-weight: bold;
        }

        .chat-container {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
        }

        .message {
            margin-bottom: 20px;
            padding: 15px;
            border-radius: 8px;
            max-width: 80%;
        }

        .user-message {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            margin-left: auto;
            text-align: right;
        }

        .assistant-message {
            background: var(--vscode-textBlockQuote-background);
            border-left: 4px solid var(--vscode-textBlockQuote-border);
        }

        .error-message {
            background: var(--vscode-inputValidation-errorBackground);
            border-left: 4px solid var(--vscode-inputValidation-errorBorder);
        }

        .typing {
            opacity: 0.7;
            font-style: italic;
        }

        .status {
            padding: 10px;
            text-align: center;
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
        }

        code {
            background: var(--vscode-textCodeBlock-background);
            padding: 2px 4px;
            border-radius: 3px;
            font-family: var(--vscode-editor-font-family);
        }

        pre {
            background: var(--vscode-textCodeBlock-background);
            padding: 10px;
            border-radius: 5px;
            overflow-x: auto;
            margin: 10px 0;
        }

        pre code {
            background: none;
            padding: 0;
        }
    </style>
</head>
<body>
    <div class="header">
        🧟‍♂️ ZombieCoder - আমি ZombieCoder, যেখানে কোড ও কথা বলে
    </div>

    <div class="chat-container" id="chatContainer">
        <div class="status">
            Connected to ZombieCoder backend. Ready to help with your code! ✨
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const chatContainer = document.getElementById('chatContainer');
        let currentAssistantMessage = null;

        window.addEventListener('message', event => {
            const message = event.data;

            switch (message.type) {
                case 'user_message':
                    addUserMessage(message.content);
                    break;

                case 'assistant_start':
                    currentAssistantMessage = addAssistantMessage('');
                    currentAssistantMessage.innerHTML = '<div class="typing">🧟‍♂️ ' + message.content + '</div>';
                    break;

                case 'assistant_chunk':
                    if (currentAssistantMessage) {
                        if (currentAssistantMessage.querySelector('.typing')) {
                            currentAssistantMessage.innerHTML = '';
                        }
                        const content = currentAssistantMessage.textContent + message.content;
                        currentAssistantMessage.innerHTML = formatMessage(content);
                        scrollToBottom();
                    }
                    break;

                case 'assistant_complete':
                    if (currentAssistantMessage) {
                        currentAssistantMessage.innerHTML = formatMessage(message.content);
                        currentAssistantMessage = null;
                    }
                    addStatus('✅ Response completed');
                    break;

                case 'error':
                    addErrorMessage(message.content);
                    currentAssistantMessage = null;
                    break;
            }
        });

        function addUserMessage(content) {
            const messageEl = document.createElement('div');
            messageEl.className = 'message user-message';
            messageEl.textContent = content;
            chatContainer.appendChild(messageEl);
            scrollToBottom();
        }

        function addAssistantMessage(content) {
            const messageEl = document.createElement('div');
            messageEl.className = 'message assistant-message';
            messageEl.innerHTML = formatMessage(content);
            chatContainer.appendChild(messageEl);
            scrollToBottom();
            return messageEl;
        }

        function addErrorMessage(content) {
            const messageEl = document.createElement('div');
            messageEl.className = 'message error-message';
            messageEl.innerHTML = '<strong>❌ Error:</strong> ' + escapeHtml(content);
            chatContainer.appendChild(messageEl);
            scrollToBottom();
        }

        function addStatus(content) {
            const statusEl = document.createElement('div');
            statusEl.className = 'status';
            statusEl.textContent = content;
            chatContainer.appendChild(statusEl);
            scrollToBottom();
        }

        function formatMessage(content) {
            // Simple markdown-like formatting
            let formatted = escapeHtml(content);

            // Code blocks
            formatted = formatted.replace(/\`\`\`([\\s\\S]*?)\`\`\`/g, '<pre><code>$1</code></pre>');

            // Inline code
            formatted = formatted.replace(/\`([^\`]+)\`/g, '<code>$1</code>');

            // Bold
            formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

            // Line breaks
            formatted = formatted.replace(/\\n/g, '<br>');

            return formatted;
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function scrollToBottom() {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    </script>
</body>
</html>`;
}

export function deactivate() {
    console.log('ZombieCoder Extension is now deactivated');
}
