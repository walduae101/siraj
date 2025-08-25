// Server bootstrap configuration
import http from 'node:http';
import https from 'node:https';

// Enable HTTP keep-alive for outbound calls to improve performance
http.globalAgent.keepAlive = true;
https.globalAgent.keepAlive = true;

// Set reasonable timeouts
http.globalAgent.keepAliveMsecs = 30000; // 30 seconds
https.globalAgent.keepAliveMsecs = 30000; // 30 seconds

// Set max sockets per host
http.globalAgent.maxSockets = 50;
https.globalAgent.maxSockets = 50;

console.log('[bootstrap] HTTP keep-alive enabled for outbound connections');
