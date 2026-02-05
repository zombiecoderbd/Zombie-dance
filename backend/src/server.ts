import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { logger } from "./utils/logger.js";
import { chatRouter } from "./routes/chat.js";
import { adminRouter } from "./routes/admin.js";
import {
  handleWebSocketConnection,
  getWebSocketStats,
  cleanupWebSocket,
  pingAllWebSocketSessions,
} from "./routes/websocket.js";

dotenv.config();

const app = express();
const server = createServer(app);

// Create WebSocket server
const wss = new WebSocketServer({
  server,
  path: "/v1/chat/ws",
  verifyClient: (info) => {
    // Allow VS Code connections by checking User-Agent
    const userAgent = info.req.headers["user-agent"] || "";
    const isVSCode =
      userAgent.includes("vscode") || userAgent.includes("Visual Studio Code");

    logger.debug("WebSocket connection attempt", {
      origin: info.origin,
      userAgent: userAgent.substring(0, 50),
      isVSCode,
    });

    return true; // Allow all connections for now
  },
});

const PORT = process.env.PORT || 8001;

// Enhanced CORS configuration for VS Code extension and local testing
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, Postman, or file://)
      if (!origin) return callback(null, true);

      // Allow file:// protocol for local HTML testing
      if (origin.startsWith("file://")) return callback(null, true);

      // Whitelist of allowed origins
      const allowedOrigins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:8001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:8001",
        "vscode-file://vscode-app", // VS Code file protocol
        "https://vscode.dev", // VS Code web
      ];

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow all localhost and 127.0.0.1 with any port for development
      if (origin.match(/^http:\/\/(localhost|127\.0\.0\.1):\d+$/)) {
        return callback(null, true);
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "X-VS-Code-Version",
      "X-Session-ID",
      "X-Workspace-Root",
      "X-Active-Language",
      "X-File-Path",
      "X-Extension-Version",
      "User-Agent",
    ],
    exposedHeaders: ["X-Response-Time", "X-Server-Version"],
  }),
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Add middleware to log VS Code requests
app.use((req, res, next) => {
  const userAgent = req.headers["user-agent"] || "";
  const isVSCode = userAgent.includes("vscode");
  const sessionId = req.headers["x-session-id"];

  if (isVSCode) {
    logger.info("VS Code request", {
      method: req.method,
      path: req.path,
      sessionId: sessionId,
      vscodeVersion: req.headers["x-vs-code-version"],
    });
  }

  // Add server info headers
  res.setHeader("X-Server-Version", "2.0.0");
  res.setHeader("X-Response-Time", Date.now().toString());

  next();
});

// Basic health check endpoint
app.get("/v1/health", (req, res) => {
  const wsStats = getWebSocketStats();

  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    server: "ZombieCoder Backend",
    version: "2.0.0",
    environment: process.env.NODE_ENV || "development",
    websocket: {
      enabled: true,
      activeConnections: wsStats.activeConnections,
      endpoint: "/v1/chat/ws",
    },
    features: {
      streaming: true,
      websockets: true,
      vscode_integration: true,
      ollama_support: true,
      multi_model: true,
    },
  });
});

// VS Code specific endpoints
app.get("/v1/vscode/info", (req, res) => {
  const wsStats = getWebSocketStats();

  res.json({
    extension: {
      name: "ZombieCoder AI Assistant",
      version: "2.0.0",
      description: "আমি ZombieCoder, যেখানে কোড ও কথা বলে।",
    },
    capabilities: [
      "streaming_chat",
      "websocket_support",
      "multi_model",
      "code_analysis",
      "bengali_english_support",
    ],
    endpoints: {
      health: "/v1/health",
      chat_stream: "/v1/chat/stream",
      chat_ws: "/v1/chat/ws",
      models: "/v1/chat/models",
      runtime: "/v1/runtime_status",
    },
    websocket: {
      activeConnections: wsStats.activeConnections,
      activeSessions: wsStats.activeSessions,
    },
    timestamp: new Date().toISOString(),
  });
});

// Test endpoint for debugging
app.get("/test", (req, res) => {
  const userAgent = req.headers["user-agent"];
  const isVSCode = userAgent?.includes("vscode");

  res.json({
    message: "Server is working!",
    timestamp: new Date().toISOString(),
    userAgent: userAgent,
    isVSCodeRequest: isVSCode,
    headers: Object.keys(req.headers),
    url: req.url,
    method: req.method,
  });
});

// Mount routers
app.use("/v1/chat", chatRouter); // VS Code chat endpoints
app.use("/v1", adminRouter); // Admin endpoints (runtime_status, runtime_agent)
app.use("/api/admin", adminRouter); // Admin API endpoints
app.use("/api", adminRouter); // General API endpoints (models, etc.)

// WebSocket connection handling
wss.on("connection", (ws, request) => {
  try {
    handleWebSocketConnection(ws, request);
  } catch (error) {
    logger.error("WebSocket connection error:", error);
    ws.close(1011, "Connection setup failed");
  }
});

wss.on("error", (error) => {
  logger.error("WebSocket server error:", error);
});

// Catch-all for unmatched routes
app.use("*", (req, res) => {
  const userAgent = req.headers["user-agent"];
  const isVSCode = userAgent?.includes("vscode");

  logger.warn(`Unmatched route: ${req.method} ${req.originalUrl}`, {
    userAgent: userAgent?.substring(0, 50),
    isVSCode,
  });

  res.status(404).json({
    error: "Route not found",
    method: req.method,
    path: req.originalUrl,
    server: "ZombieCoder Backend v2.0.0",
    isVSCode,
    available_routes: {
      health: "GET /v1/health",
      test: "GET /test",
      vscode_info: "GET /v1/vscode/info",
      chat_stream: "POST /v1/chat/stream",
      chat_basic: "POST /v1/chat",
      models: "GET /v1/chat/models",
      runtime_status: "GET /v1/runtime_status",
      runtime_agent: "GET /v1/runtime_agent",
      websocket: "WS /v1/chat/ws",
    },
    troubleshooting: isVSCode
      ? {
          extension_setup:
            "Ensure ZombieCoder extension is properly configured",
          api_endpoint: "Check extension settings for correct endpoint URL",
          websocket: "Verify WebSocket connection at /v1/chat/ws",
        }
      : null,
  });
});

// Error handling middleware
app.use((error: any, req: any, res: any, next: any) => {
  logger.error("Server error:", error);

  res.status(500).json({
    error: "Internal server error",
    message: error.message,
    timestamp: new Date().toISOString(),
    server: "ZombieCoder Backend v2.0.0",
  });
});

// Periodic WebSocket ping
const pingInterval = setInterval(() => {
  pingAllWebSocketSessions();
}, 30000); // Every 30 seconds

// Start server
server.listen(PORT, "0.0.0.0", () => {
  console.log("🧟‍♂️ ZombieCoder Backend Server Started");
  console.log(`📍 Server running on: http://0.0.0.0:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/v1/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/test`);
  console.log(`📊 VS Code info: http://localhost:${PORT}/v1/vscode/info`);
  console.log(`💬 Chat Stream: POST http://localhost:${PORT}/v1/chat/stream`);
  console.log(`🌐 WebSocket: ws://localhost:${PORT}/v1/chat/ws`);
  console.log(`🔧 Runtime Status: http://localhost:${PORT}/v1/runtime_status`);
  console.log(`🤖 Runtime Agent: http://localhost:${PORT}/v1/runtime_agent`);
  console.log(`🎛️ Models API: http://localhost:${PORT}/api/models`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("");
  console.log("✅ Server is ready for VS Code extension connections!");

  logger.info("ZombieCoder Backend Server started", {
    port: PORT,
    environment: process.env.NODE_ENV || "development",
    websocket: true,
    vscode_integration: true,
  });
});

// Graceful shutdown
const shutdown = (signal: string) => {
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);

  // Clear ping interval
  clearInterval(pingInterval);

  // Close WebSocket server
  wss.close(() => {
    console.log("✅ WebSocket server closed");
  });

  // Cleanup WebSocket sessions
  cleanupWebSocket();

  // Close HTTP server
  server.close(() => {
    console.log("✅ HTTP server closed");
    logger.info(`Server shutdown complete (${signal})`);
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.log("❌ Forcing shutdown after timeout");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  console.error("💥 Uncaught Exception:", error);
  shutdown("UNCAUGHT_EXCEPTION");
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  console.error("💥 Unhandled Promise Rejection:", reason);
  shutdown("UNHANDLED_REJECTION");
});

export { app, server, wss };
