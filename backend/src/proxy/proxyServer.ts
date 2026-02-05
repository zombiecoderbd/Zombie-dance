import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { createProxyMiddleware } from "http-proxy-middleware";
import { logger } from "../utils/logger.js";

const proxyApp = express();
const PROXY_PORT = process.env.PROXY_PORT || 5010;
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8001";

// Comprehensive CORS configuration
const corsOptions = {
    origin: function (
        origin: string | undefined,
        callback: (err: Error | null, allow?: boolean) => void,
    ) {
        // Allow requests with no origin
        if (!origin) {
            return callback(null, true);
        }

        // Allow file:// protocol
        if (origin.startsWith("file://")) {
            return callback(null, true);
        }

        // Allow localhost with any port
        if (origin.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/)) {
            return callback(null, true);
        }

        // Allow cloud editors
        const cloudPatterns = [
            /vscode\.dev$/,
            /github\.dev$/,
            /codesandbox\.io$/,
            /stackblitz\.com$/,
            /gitpod\.io$/,
            /replit\.com$/,
            /qoder\.com$/,
            /qodo\.ai$/,
        ];

        try {
            const hostname = new URL(origin).hostname;
            for (const pattern of cloudPatterns) {
                if (pattern.test(hostname)) {
                    return callback(null, true);
                }
            }
        } catch (error) {
            // Invalid URL, allow it anyway for development
        }

        callback(null, true); // Allow all for development
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
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
        "Accept",
        "Origin",
    ],
    exposedHeaders: ["X-Response-Time", "X-Server-Version"],
    maxAge: 86400,
};

// Apply CORS
proxyApp.use(cors(corsOptions));

// Request logging
proxyApp.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin || "unknown";
    logger.info("Proxy request", {
        method: req.method,
        path: req.path,
        origin,
    });
    next();
});

// Proxy health endpoint
proxyApp.get("/proxy/health", (req: Request, res: Response) => {
    res.json({
        status: "ok",
        service: "ZombieCoder Proxy Server",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        backend: BACKEND_URL,
        port: PROXY_PORT,
        uptime: process.uptime(),
    });
});

// Proxy info endpoint
proxyApp.get("/proxy/info", (req: Request, res: Response) => {
    res.json({
        proxy: {
            name: "ZombieCoder Proxy Server",
            version: "1.0.0",
            port: PROXY_PORT,
            backend: BACKEND_URL,
        },
        supportedEditors: [
            "VS Code Desktop",
            "VS Code Web",
            "GitHub Codespaces",
            "Local HTML Files",
            "Qoder Editor",
        ],
        endpoints: {
            health: "/proxy/health",
            info: "/proxy/info",
            backend: "/* (all backend routes)",
        },
    });
});

// Qoder specific configuration endpoint
proxyApp.get("/proxy/qoder-config", (req: Request, res: Response) => {
    res.json({
        openaiCompatible: {
            baseUrl: `http://localhost:${PROXY_PORT}/v1`,
            apiKey: "your-api-key-here",
            modelName: "qwen2.5-coder:0.5b",
            chatEndpoint: "/chat",
            modelsEndpoint: "/models",
        },
        proxySettings: {
            httpProxy: `http://localhost:${PROXY_PORT}`,
            httpsProxy: `http://localhost:${PROXY_PORT}`,
            noProxy: "localhost,127.0.0.1",
        },
        environmentVariables: {
            OPENAI_BASE_URL: `http://localhost:${PROXY_PORT}/v1`,
            OPENAI_API_KEY: "your-api-key-here",
            HTTP_PROXY: `http://localhost:${PROXY_PORT}`,
            HTTPS_PROXY: `http://localhost:${PROXY_PORT}`,
        },
        testConnection: {
            healthCheck: `http://localhost:${PROXY_PORT}/proxy/health`,
            chatTest: `http://localhost:${PROXY_PORT}/v1/chat`,
        },
    });
});

// Simple proxy middleware
const simpleProxy = createProxyMiddleware({
    target: BACKEND_URL,
    changeOrigin: true,
    ws: true,
    on: {
        proxyReq: (proxyReq: any, req: any) => {
            proxyReq.setHeader("X-Forwarded-For", req.socket.remoteAddress || "");

            if (req.headers.origin) {
                proxyReq.setHeader("Origin", req.headers.origin);
            }

            logger.debug("Forwarding", { method: req.method, url: req.url });
        },

        proxyRes: (proxyRes: any, req: any) => {
            const origin = req.headers.origin;
            if (origin) {
                proxyRes.headers["access-control-allow-origin"] = origin;
                proxyRes.headers["access-control-allow-credentials"] = "true";
            }
            logger.debug("Response", { status: proxyRes.statusCode });
        },

        error: (err: any, req: any, res: any) => {
            logger.error("Proxy error:", err.message);
            if (!res.headersSent) {
                (res as Response).status(502).json({
                    error: "Backend connection failed",
                    message: err.message,
                });
            }
        },
    },
});

// Apply proxy to all routes except /proxy/*
proxyApp.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/proxy/")) {
        return next();
    }
    simpleProxy(req, res, next);
});

// Start server
const proxyServer = proxyApp.listen(PROXY_PORT, () => {
    console.log("\n🌐 ZombieCoder Proxy Server Started");
    console.log(`📍 Proxy: http://localhost:${PROXY_PORT}`);
    console.log(`🔗 Backend: ${BACKEND_URL}`);
    console.log(`🏥 Health: http://localhost:${PROXY_PORT}/proxy/health`);
    console.log(`\n✅ Proxy ready!\n`);

    logger.info("Proxy server started", {
        port: PROXY_PORT,
        backend: BACKEND_URL,
    });
});

// Graceful shutdown
const shutdown = (signal: string) => {
    console.log(`\n🛑 Proxy shutting down (${signal})...`);
    proxyServer.close(() => {
        console.log("✅ Proxy closed");
        process.exit(0);
    });
    setTimeout(() => process.exit(1), 5000);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export { proxyApp, proxyServer };
