# Siraj JavaScript SDK

Official JavaScript SDK for the Siraj API. Built with TypeScript and optimized for both Node.js and browser environments.

## Installation

```bash
npm install siraj-sdk-js
```

## Quick Start

```javascript
import { Siraj } from 'siraj-sdk-js';

const client = new Siraj({
  apiKey: process.env.SIRAJ_API_KEY,
  baseUrl: 'https://siraj.life'
});

// Test your API key
const result = await client.ping();
console.log(result);
// { ok: true, keyId: 'abc123', uid: 'user_123', plan: 'pro', ... }
```

## Configuration

```javascript
const client = new Siraj({
  apiKey: 'siraj_live_abc123.def456', // Required
  baseUrl: 'https://siraj.life',      // Optional, defaults to production
  timeoutMs: 10000,                   // Optional, request timeout
  retries: 3                          // Optional, retry attempts for failures
});
```

## API Methods

### `ping()`

Test your API key and get account information.

```javascript
const result = await client.ping();
// Returns: { ok: true, keyId, uid, plan, timestamp, rateLimit }
```

### `health()`

Check API health status (no authentication required).

```javascript
const health = await client.health();
// Returns: { ok: true, ts: 1234567890 }
```

## Error Handling

The SDK automatically handles retries for transient errors and rate limiting:

```javascript
try {
  const result = await client.ping();
  console.log('Success:', result);
} catch (error) {
  if (error.code === 'rate_limit') {
    console.log('Rate limited, retry after:', error.retryAfter, 'seconds');
  } else if (error.status === 401) {
    console.log('Invalid API key');
  } else {
    console.log('Error:', error.message);
  }
}
```

## Rate Limiting

The SDK automatically handles rate limiting with exponential backoff:

- **Free Plan**: 10 requests/minute
- **Pro Plan**: 100 requests/minute  
- **Organization**: 500 requests/minute

When rate limited, the SDK will:
1. Wait for the `retry-after` period
2. Retry the request automatically
3. Throw an error if all retries are exhausted

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import { Siraj, PingResponse, SirajError } from 'siraj-sdk-js';

const client = new Siraj({
  apiKey: process.env.SIRAJ_API_KEY!
});

try {
  const result: PingResponse = await client.ping();
  console.log('Plan:', result.plan);
} catch (error) {
  const sirajError = error as SirajError;
  console.log('Error code:', sirajError.code);
}
```

## Browser Usage

The SDK works in both Node.js and browser environments:

```html
<script type="module">
  import { Siraj } from 'https://unpkg.com/siraj-sdk-js@latest/dist/index.js';
  
  const client = new Siraj({
    apiKey: 'your-api-key-here'
  });
  
  client.ping().then(result => {
    console.log('API is working:', result);
  });
</script>
```

## Environment Variables

Recommended environment variable setup:

```bash
# .env
SIRAJ_API_KEY=siraj_live_abc123.def456
SIRAJ_BASE_URL=https://siraj.life  # Optional
```

```javascript
import { Siraj } from 'siraj-sdk-js';

const client = new Siraj({
  apiKey: process.env.SIRAJ_API_KEY,
  baseUrl: process.env.SIRAJ_BASE_URL
});
```

## API Key Management

Get your API keys from the [Siraj Developer Portal](https://siraj.life/account/api).

## Support

- 📚 [API Documentation](https://siraj.life/docs/api)
- 🐛 [Report Issues](https://github.com/siraj/siraj-sdk-js/issues)
- 💬 [Get Support](https://siraj.life/support)

## License

MIT License - see [LICENSE](LICENSE) for details.
