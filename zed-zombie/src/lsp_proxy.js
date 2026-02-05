#!/usr/bin/env node

const { spawn } = require("child_process");
const net = require("net");
const http = require("http");
const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");

// Parse command line arguments
const args = process.argv.slice(2);
let serverUrl = "http://localhost:3004"; // Default LSP server URL
let debugMode = false;

// Parse arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--server-url" && i + 1 < args.length) {
    serverUrl = args[i + 1];
    i++;
  } else if (args[i] === "--debug") {
    debugMode = true;
  }
}

// Log function for debugging
function log(message) {
  if (debugMode) {
    console.error(`[LSP Proxy] ${message}`);
  }
}

// Function to extract protocol and port from URL (supports tcp:// and host:port)

function parseServerUrl(url) {
  const input = (url || "").trim();

  // With explicit scheme (http, https, tcp)
  const withScheme = input.match(
    /^(https?|tcp):\/\/([^:/]+)(?::(\d+))?(.*)?$/i,
  );

  if (withScheme) {
    const protocol = withScheme[1].toLowerCase();
    const hostname = withScheme[2];
    const port = withScheme[3]
      ? parseInt(withScheme[3], 10)
      : protocol === "https"
        ? 443
        : 3004; // default LSP port for tcp/http when unspecified
    const path = withScheme[4] || "";
    return { protocol, hostname, port, path };
  }

  // host:port
  const hostPort = input.match(/^([^:\/]+):(\d+)$/);
  if (hostPort) {
    return {
      protocol: "tcp",
      hostname: hostPort[1],
      port: parseInt(hostPort[2], 10),
      path: "",
    };
  }

  // :port or just port
  const justPort = input.match(/^:?(\d+)$/);
  if (justPort) {
    return {
      protocol: "tcp",
      hostname: "127.0.0.1",
      port: parseInt(justPort[1], 10),
      path: "",
    };
  }

  // host only (default to tcp on 3004)
  if (/^[a-z0-9.\-]+$/i.test(input)) {
    return {
      protocol: "tcp",
      hostname: input,
      port: 3004,
      path: "",
    };
  }

  throw new Error(`Invalid server URL format: ${url}`);
}

// Function to create an LSP connection
function createLSPConnection(serverUrl, callback) {
  const { protocol, hostname, port } = parseServerUrl(serverUrl);

  // Try to connect to our ZombieCoder LSP server
  if (protocol === "http" || protocol === "https") {
    // Create a socket connection for the LSP server
    const socket = new net.Socket();

    socket.connect({
      host: hostname,
      port: port,
    });

    socket.on("connect", () => {
      log(`Connected to LSP server at ${hostname}:${port}`);
      callback(null, socket);
    });

    socket.on("error", (error) => {
      log(`Error connecting to LSP server: ${error.message}`);
      callback(error);
    });

    socket.on("close", () => {
      log("Connection to LSP server closed");
    });
  } else {
    callback(new Error(`Unsupported protocol: ${protocol}`));
  }
}

// Function to initialize the LSP proxy
function initializeLSPProxy() {
  let serverSocket = null;

  // Connect to our LSP server
  createLSPConnection(serverUrl, (error, socket) => {
    if (error) {
      console.error(`Failed to connect to LSP server: ${error.message}`);
      process.exit(1);
    }

    serverSocket = socket;

    // Set up communication with Zed through stdin/stdout
    process.stdin.setEncoding("utf8");
    process.stdin.resume();

    // Initialize the LSP proxy
    let contentLength = 0;
    let buffer = "";

    // Process messages from Zed
    process.stdin.on("data", (data) => {
      if (serverSocket) {
        serverSocket.write(data);
        log(
          `Forwarded to server: ${data.substring(0, 100)}${data.length > 100 ? "..." : ""}`,
        );
      }
    });

    // Process responses from server
    serverSocket.on("data", (data) => {
      process.stdout.write(data);
      log(
        `Received from server: ${data.substring(0, 100)}${data.length > 100 ? "..." : ""}`,
      );
    });

    // Handle errors
    serverSocket.on("error", (error) => {
      log(`Server socket error: ${error.message}`);
      process.exit(1);
    });

    process.stdin.on("error", (error) => {
      log(`stdin error: ${error.message}`);
    });

    process.stdout.on("error", (error) => {
      log(`stdout error: ${error.message}`);
    });
  });
}

// Function to establish WebSocket connection for real-time communication
function establishWebSocketConnection() {
  const wsUrl = "ws://localhost:3003"; // WebSocket service URL
  const ws = new WebSocket(wsUrl);

  ws.on("open", () => {
    log("Connected to WebSocket server");
  });

  ws.on("message", (data) => {
    // Handle real-time messages from the server
    log(`Received WebSocket message: ${data}`);

    // If it's a relevant message for the editor, we could process it here
    try {
      const message = JSON.parse(data);
      if (message.type === "code_suggestion" || message.type === "completion") {
        // Process suggestion/completion
        // Could integrate this with Zed's UI
        log(`Processed suggestion: ${message.type}`);
      }
    } catch (error) {
      log(`Error parsing WebSocket message: ${error.message}`);
    }
  });

  ws.on("error", (error) => {
    log(`WebSocket error: ${error.message}`);
  });

  ws.on("close", () => {
    log("WebSocket connection closed");

    // Attempt to reconnect after a delay
    setTimeout(() => {
      log("Attempting to reconnect to WebSocket...");
      establishWebSocketConnection();
    }, 5000);
  });
}

// Function to sync codebase with the Codebase Sync Service
function syncCodebase() {
  const syncUrl =
    "http://localhost:5051/algo/api/v2/service/codebase/sync/initCodebase";

  http
    .get(syncUrl, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const response = JSON.parse(data);
          log(`Codebase sync initiated: ${response.status}`);
        } catch (error) {
          log(`Error parsing codebase sync response: ${error.message}`);
        }
      });
    })
    .on("error", (error) => {
      log(`Codebase sync error: ${error.message}`);
    });
}

// Function to connect to Ollama for AI assistance
function connectToOllama() {
  const ollamaUrl = "http://localhost:11434";

  http
    .get(`${ollamaUrl}/api/tags`, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const models = JSON.parse(data);
          log(
            `Available Ollama models: ${models.models.map((m) => m.name).join(", ")}`,
          );

          // Store available models for use in code suggestions
          global.availableModels = models.models;
        } catch (error) {
          log(`Error parsing Ollama models: ${error.message}`);
        }
      });
    })
    .on("error", (error) => {
      log(`Ollama connection error: ${error.message}`);
    });
}

// Initialize all connections
function initialize() {
  log("Starting LSP Proxy for ZombieCoder");

  // Initialize LSP proxy
  initializeLSPProxy();

  // Establish WebSocket connection for real-time features
  establishWebSocketConnection();

  // Sync codebase
  setTimeout(() => {
    syncCodebase();
  }, 1000);

  // Connect to Ollama
  setTimeout(() => {
    connectToOllama();
  }, 2000);

  // Handle process termination
  process.on("SIGINT", () => {
    log("Received SIGINT, shutting down...");
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    log("Received SIGTERM, shutting down...");
    process.exit(0);
  });
}

// Start the proxy
initialize();
