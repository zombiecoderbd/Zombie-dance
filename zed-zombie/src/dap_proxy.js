#!/usr/bin/env node
/**
 * DAP TCP Proxy
 * --------------
 * Bridges stdio (Zed's DAP client) <-> TCP (your DAP server).
 *
 * This proxy reads DAP frames from stdin and forwards them byte-for-byte to a TCP socket.
 * Responses from the TCP socket are forwarded back to stdout without modification.
 *
 * Supported server target formats (via --server-url):
 *   - tcp://host:port
 *   - http://host:port            (treated the same as tcp)
 *   - https://host:port           (treated the same as tcp)
 *   - host:port
 *   - :port                       (defaults host to 127.0.0.1)
 *   - port                        (defaults host to 127.0.0.1)
 *
 * Other options:
 *   --host <host>
 *   --port <port>
 *   --debug                       (logs to stderr, never stdout)
 *
 * Environment variables (fallbacks):
 *   DAP_SERVER_URL                (same formats as --server-url)
 *   DAP_HOST                      (default 127.0.0.1)
 *   DAP_PORT                      (default 3005)
 *
 * Exit codes:
 *   0   - clean shutdown
 *   1   - connection/IO error
 */

const net = require("net");

// --------------- Argument Parsing ---------------

const args = process.argv.slice(2);
let serverUrl = process.env.DAP_SERVER_URL || null;
let host = process.env.DAP_HOST || null;
let port = process.env.DAP_PORT ? parseInt(process.env.DAP_PORT, 10) : null;
let debugMode = false;

for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--server-url" && i + 1 < args.length) {
    serverUrl = args[++i];
  } else if (a === "--host" && i + 1 < args.length) {
    host = args[++i];
  } else if (a === "--port" && i + 1 < args.length) {
    port = parseInt(args[++i], 10);
  } else if (a === "--debug") {
    debugMode = true;
  } else if (a === "-h" || a === "--help") {
    printHelpAndExit();
  }
}

function printHelpAndExit() {
  const help = `
Usage: node dap_proxy.js [--server-url <url>] [--host <host>] [--port <port>] [--debug]

Examples:
  node dap_proxy.js --server-url tcp://127.0.0.1:3005
  node dap_proxy.js --server-url 127.0.0.1:3005
  node dap_proxy.js --server-url :3005
  node dap_proxy.js --server-url 3005
  node dap_proxy.js --host 127.0.0.1 --port 3005

Notes:
  - Logs are written to stderr only (safe for DAP stdio).
  - The proxy performs a raw byte-forward; DAP framing is preserved.
`;
  process.stderr.write(help);
  process.exit(0);
}

// --------------- Logging ---------------

function log(...msg) {
  if (debugMode) {
    const line = msg
      .map((m) => (typeof m === "string" ? m : JSON.stringify(m)))
      .join(" ");
    process.stderr.write(`[DAP Proxy] ${line}\n`);
  }
}

function errorLog(...msg) {
  const line = msg
    .map((m) => (typeof m === "string" ? m : JSON.stringify(m)))
    .join(" ");
  process.stderr.write(`[DAP Proxy:ERROR] ${line}\n`);
}

// --------------- Target Parsing ---------------

function parseTarget({ serverUrl, host, port }) {
  // Highest priority: explicit serverUrl
  if (serverUrl && typeof serverUrl === "string") {
    const input = serverUrl.trim();

    // With explicit scheme: tcp/http/https
    const withScheme = input.match(/^(https?|tcp):\/\/([^:/]+)?(?::(\d+))?(.*)?$/i);
    if (withScheme) {
      const scheme = withScheme[1].toLowerCase();
      const h = withScheme[2] || "127.0.0.1";
      const p = withScheme[3] ? parseInt(withScheme[3], 10) : 3005; // default DAP server port
      return { host: h, port: p };
    }

    // host:port
    const hostPort = input.match(/^([^:\/]+):(\d+)$/);
    if (hostPort) {
      return { host: hostPort[1], port: parseInt(hostPort[2], 10) };
    }

    // :port or just port
    const justPort = input.match(/^:?(\d+)$/);
    if (justPort) {
      return { host: "127.0.0.1", port: parseInt(justPort[1], 10) };
    }

    // host only -> default port 3005
    if (/^[a-z0-9.\-]+$/i.test(input)) {
      return { host: input, port: 3005 };
    }

    throw new Error(`Invalid --server-url format: ${serverUrl}`);
  }

  // Next: host/port flags or env
  const resolvedHost = host || "127.0.0.1";
  const resolvedPort = Number.isInteger(port) ? port : 3005;
  return { host: resolvedHost, port: resolvedPort };
}

let target;
try {
  target = parseTarget({ serverUrl, host, port });
} catch (e) {
  errorLog(String(e && e.message ? e.message : e));
  process.exit(1);
}

log(`Target -> ${target.host}:${target.port}`);

// --------------- TCP Connection ---------------

const socket = net.createConnection(
  { host: target.host, port: target.port, noDelay: true },
  () => {
    log(`Connected to DAP server ${target.host}:${target.port}`);
  }
);

// Keep the connection alive a bit longer by sending TCP keep-alives.
socket.setKeepAlive?.(true, 10_000);

// --------------- Byte-forwarding with Backpressure ---------------

let stdinPaused = false;
let socketPaused = false;

process.stdin.on("data", (chunk) => {
  // Forward to DAP server
  const ok = socket.write(chunk);
  if (!ok && !stdinPaused) {
    // Backpressure from socket: pause stdin until 'drain'
    process.stdin.pause();
    stdinPaused = true;
    log("Paused stdin due to backpressure -> socket");
  }
});

socket.on("drain", () => {
  if (stdinPaused) {
    stdinPaused = false;
    process.stdin.resume();
    log("Resumed stdin after socket drain");
  }
});

socket.on("data", (chunk) => {
  // Forward to DAP client (Zed) via stdout
  const ok = process.stdout.write(chunk);
  if (!ok && !socketPaused) {
    socketPaused = true;
    socket.pause();
    log("Paused socket due to backpressure -> stdout");
  }
});

process.stdout.on("drain", () => {
  if (socketPaused) {
    socketPaused = false;
    socket.resume();
    log("Resumed socket after stdout drain");
  }
});

// --------------- Lifecycle / Error Handling ---------------

let shuttingDown = false;
function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  log("Shutting down proxy");

  try {
    socket.destroy();
  } catch (_) {}

  // Avoid keeping the event loop alive
  try {
    process.stdin.pause();
  } catch (_) {}

  // Ensure we end stdout for the client
  try {
    process.stdout.end();
  } catch (_) {}

  // Slight delay to flush stderr logs
  setTimeout(() => process.exit(code), 5);
}

socket.on("error", (err) => {
  errorLog(`Socket error: ${err && err.message ? err.message : String(err)}`);
  shutdown(1);
});

socket.on("close", (hadError) => {
  log(`Socket closed${hadError ? " (error)" : ""}`);
  shutdown(hadError ? 1 : 0);
});

process.stdin.on("end", () => {
  log("Stdin ended, half-closing socket");
  try {
    socket.end();
  } catch (_) {}
});

process.stdin.on("error", (err) => {
  errorLog(`Stdin error: ${err && err.message ? err.message : String(err)}`);
  shutdown(1);
});

process.stdout.on("error", (err) => {
  // EPIPE is expected if the client (editor) closes early.
  if (err && (err.code === "EPIPE" || err.code === "ERR_STREAM_WRITE_AFTER_END")) {
    log(`Stdout closed (${err.code}), shutting down`);
    shutdown(0);
  } else {
    errorLog(`Stdout error: ${err && err.message ? err.message : String(err)}`);
    shutdown(1);
  }
});

process.on("SIGINT", () => {
  log("SIGINT received");
  shutdown(0);
});

process.on("SIGTERM", () => {
  log("SIGTERM received");
  shutdown(0);
});

// Start flowing
process.stdin.resume();
