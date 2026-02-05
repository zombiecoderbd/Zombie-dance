const { Extension, LanguageClient } = require('zed');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

module.exports = class ZombieCoderExtension extends Extension {
  async initialize() {
    // Initialize settings
    this.settings = {
      mainAppUrl: 'http://localhost:3000',
      websocketUrl: 'http://localhost:3003',
      lspUrl: 'http://localhost:3004',
      dapUrl: 'http://localhost:3005',
      proxyUrl: 'http://localhost:5010',
      codebaseSyncUrl: 'http://localhost:5051',
      ollamaUrl: 'http://localhost:11434',
      enableAIChat: true,
      enableCodeSync: true,
      enableAIAutocomplete: true
    };

    // Load custom settings if available
    try {
      const customSettings = await this.readFile('settings.json');
      this.settings = { ...this.settings, ...JSON.parse(customSettings) };
    } catch (error) {
      console.log('Using default settings, no custom settings file found');
    }

    // Initialize connections
    await this.initializeConnections();

    // Register commands
    this.registerCommands();

    // Initialize status bar
    this.initializeStatusBar();
  }

  async initializeConnections() {
    // Initialize LSP connection
    try {
      this.lspClient = new LanguageClient(
        'zombiecoder-lsp',
        'ZombieCoder Language Server',
        {
          command: 'node',
          args: [path.join(__dirname, 'lsp_proxy.js'), '--server-url', this.settings.lspUrl]
        }
      );

      this.lspClient.onReady().then(() => {
        console.log('ZombieCoder LSP connected');
      }).catch(err => {
        console.error('Failed to connect to LSP:', err);
      });

      await this.lspClient.start();
    } catch (error) {
      console.error('Error initializing LSP connection:', error);
    }

    // Initialize WebSocket connection
    try {
      this.wsClient = new WebSocket(this.settings.websocketUrl);

      this.wsClient.on('open', () => {
        console.log('WebSocket connected to ZombieCoder');
        this.updateStatusBar('WebSocket', 'Connected', '#00ff00');
      });

      this.wsClient.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      });

      this.wsClient.on('close', () => {
        console.log('WebSocket disconnected');
        this.updateStatusBar('WebSocket', 'Disconnected', '#ff0000');
        // Attempt to reconnect after a delay
        setTimeout(() => this.initializeConnections(), 5000);
      });

      this.wsClient.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.updateStatusBar('WebSocket', 'Error', '#ff0000');
      });
    } catch (error) {
      console.error('Error initializing WebSocket connection:', error);
      this.updateStatusBar('WebSocket', 'Failed', '#ff0000');
    }

    // Initialize Codebase Sync connection
    try {
      this.syncCodebase();
    } catch (error) {
      console.error('Error initializing Codebase Sync:', error);
    }

    // Initialize Ollama connection
    try {
      this.connectToOllama();
    } catch (error) {
      console.error('Error initializing Ollama connection:', error);
    }
  }

  handleWebSocketMessage(message) {
    switch (message.type) {
      case 'suggestion':
        this.handleCodeSuggestion(message.data);
        break;
      case 'error':
        this.showNotification(`ZombieCoder Error: ${message.message}`, 'error');
        break;
      case 'status':
        this.updateStatusBar('ZombieCoder', message.status, this.getStatusColor(message.status));
        break;
      default:
        console.log('Received unknown message type:', message.type);
    }
  }

  handleCodeSuggestion(suggestion) {
    if (!this.settings.enableAIAutocomplete) return;

    // Display the suggestion in the editor
    this.showMessage('AI Suggestion', suggestion, 'info');
  }

  async syncCodebase() {
    if (!this.settings.enableCodeSync) return;

    try {
      const response = await fetch(`${this.settings.codebaseSyncUrl}/algo/api/v2/service/codebase/sync/initCodebase`);
      const data = await response.json();

      if (data.status === 'success') {
        console.log('Codebase synchronized successfully');
        this.updateStatusBar('Code Sync', 'Synced', '#00ff00');
      } else {
        console.error('Codebase sync failed:', data);
        this.updateStatusBar('Code Sync', 'Failed', '#ff0000');
      }
    } catch (error) {
      console.error('Error syncing codebase:', error);
      this.updateStatusBar('Code Sync', 'Error', '#ff0000');
    }
  }

  async connectToOllama() {
    try {
      const response = await fetch(`${this.settings.ollamaUrl}/api/tags`);
      const data = await response.json();

      this.ollamaModels = data.models;
      console.log('Connected to Ollama, available models:', this.ollamaModels.map(m => m.name));
      this.updateStatusBar('Ollama', 'Connected', '#00ff00');
    } catch (error) {
      console.error('Error connecting to Ollama:', error);
      this.updateStatusBar('Ollama', 'Failed', '#ff0000');
    }
  }

  registerCommands() {
    // Open main app command
    this.commands.register('zombiecoder.open-main-app', () => {
      this.openUrl(this.settings.mainAppUrl);
    });

    // Open web chat command
    this.commands.register('zombiecoder.open-web-chat', () => {
      this.openUrl(`${this.settings.mainAppUrl}/chat`);
    });

    // Trigger code sync command
    this.commands.register('zombiecoder.sync-codebase', async () => {
      await this.syncCodebase();
      this.showNotification('Codebase sync initiated', 'info');
    });

    // Ask AI about current selection
    this.commands.register('zombiecoder.ask-ai', async () => {
      const selection = await this.editor.getSelection();
      if (selection) {
        this.askAIAboutCode(selection);
      } else {
        this.showNotification('Please select some code first', 'warning');
      }
    });

    // Restart connections command
    this.commands.register('zombiecoder.restart-connections', () => {
      this.restartConnections();
    });
  }

  async askAIAboutCode(code) {
    if (!this.settings.enableAIChat) {
      this.showNotification('AI Chat is disabled in settings', 'warning');
      return;
    }

    try {
      const response = await fetch(`${this.settings.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.ollamaModels[0].name,
          prompt: `Explain this code:\n\n${code}`,
          stream: false
        })
      });

      const data = await response.json();
      this.showMessage('AI Response', data.response, 'info');
    } catch (error) {
      console.error('Error asking AI:', error);
      this.showNotification('Failed to get AI response', 'error');
    }
  }

  initializeStatusBar() {
    // Initialize status bar items
    this.statusItems = {
      zombiecoder: this.statusBar.createItem('ZombieCoder', 'Unknown', '#ffff00'),
      websocket: this.statusBar.createItem('WebSocket', 'Connecting...', '#ffff00'),
      codeSync: this.statusBar.createItem('Code Sync', 'Unknown', '#ffff00'),
      ollama: this.statusBar.createItem('Ollama', 'Unknown', '#ffff00')
    };

    this.statusBar.push(this.statusItems.zombiecoder);
    this.statusBar.push(this.statusItems.websocket);
    this.statusBar.push(this.statusItems.codeSync);
    this.statusBar.push(this.statusItems.ollama);
  }

  updateStatusBar(service, status, color) {
    if (this.statusItems[service]) {
      this.statusItems[service].text = `${service}: ${status}`;
      this.statusItems[service].color = color;
    }
  }

  getStatusColor(status) {
    switch (status.toLowerCase()) {
      case 'connected':
      case 'running':
      case 'synced':
        return '#00ff00';
      case 'disconnected':
      case 'failed':
      case 'error':
        return '#ff0000';
      default:
        return '#ffff00';
    }
  }

  restartConnections() {
    this.showNotification('Restarting ZombieCoder connections...', 'info');

    // Close existing connections
    if (this.wsClient) {
      this.wsClient.close();
    }

    if (this.lspClient) {
      this.lspClient.stop();
    }

    // Reinitialize
    setTimeout(() => this.initializeConnections(), 1000);
  }

  showNotification(message, type = 'info') {
    this.notifications.add(message, type);
  }

  showMessage(title, content, type) {
    this.showMessageInPanel(title, content, type);
  }

  openUrl(url) {
    // Use system's default browser to open URL
    const start = process.platform === 'win32' ? 'start' :
                 process.platform === 'darwin' ? 'open' : 'xdg-open';

    spawn(start, [url], { detached: true });
  }

  async onOpenFile(path) {
    // When a file is opened, sync it if enabled
    if (this.settings.enableCodeSync) {
      try {
        // This would send the file content to the sync service
        console.log(`Syncing file: ${path}`);
      } catch (error) {
        console.error('Error syncing file:', error);
      }
    }
  }

  async onSaveFile(path) {
    // When a file is saved, sync it if enabled
    if (this.settings.enableCodeSync) {
      try {
        // This would send the file content to the sync service
        console.log(`Syncing saved file: ${path}`);
      } catch (error) {
        console.error('Error syncing saved file:', error);
      }
    }
  }

  async deactivate() {
    // Clean up connections when extension is deactivated
    if (this.wsClient) {
      this.wsClient.close();
    }

    if (this.lspClient) {
      await this.lspClient.stop();
    }
  }
};
