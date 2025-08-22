console.log("Test starting...");

const crypto = require('crypto');
const https = require('https');

const WEBHOOK_SECRET = "pn-7cade0c6397c40da9b16f79ab5df132c";
const payload = JSON.stringify({
  id: `test-${Date.now()}`,
  event_type: "ON_ORDER_COMPLETED"
});

const timestamp = String(Date.now());
const message = `${timestamp}.${payload}`;
const signature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(message).digest('base64');

console.log("Generated signature:", signature.substring(0, 10) + "...");

const options = {
  hostname: 'siraj-btmgk7htca-uc.a.run.app',
  port: 443,
  path: '/api/paynow/webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'paynow-signature': signature,
    'paynow-timestamp': timestamp,
    'Content-Length': Buffer.byteLength(payload)
  }
};

console.log("Making request to:", options.hostname + options.path);

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

req.write(payload);
req.end();

console.log("Request sent, waiting for response...");
