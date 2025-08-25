// Server bootstrap configuration
import http from 'node:http';
import https from 'node:https';

// Enable HTTP keep-alive for outbound calls to improve performance
// Note: keepAlive is enabled by default in Node.js 20, but we can configure timeouts
http.globalAgent.keepAliveMsecs = 30000; // 30 seconds
https.globalAgent.keepAliveMsecs = 30000; // 30 seconds

// Set max sockets per host
http.globalAgent.maxSockets = 50;
https.globalAgent.maxSockets = 50;

console.log('[bootstrap] HTTP keep-alive configured for outbound connections');
