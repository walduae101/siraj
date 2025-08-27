// Server bootstrap configuration
import http from "node:http";
import https from "node:https";

// Configure HTTP agents for better performance
// Note: keepAlive is enabled by default in Node.js 20
// We can configure maxSockets for connection pooling
http.globalAgent.maxSockets = 50;
https.globalAgent.maxSockets = 50;

console.log("[bootstrap] HTTP agents configured for outbound connections");
