import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Copy, ExternalLink, Key, Zap, Shield, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function ApiDocsPage() {
  return (
    <main className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Siraj Public API</h1>
        <p className="text-xl text-muted-foreground">
          Build powerful applications with the Siraj API. Authenticate using API keys and access our services with rate limiting and retry logic.
        </p>
      </div>

      {/* Quick Start */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Quick Start
          </CardTitle>
          <CardDescription>
            Get up and running with the Siraj API in minutes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">1. Get your API key</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Visit your <Link href="/account/api" className="text-blue-600 hover:underline">API Keys page</Link> to generate a new key.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-2">2. Test with curl</h4>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">bash</span>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <div>curl -i -H 'x-api-key: siraj_live_&lt;id&gt;.&lt;secret&gt;' https://siraj.life/api/ping</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">3. Use the JavaScript SDK</h4>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">javascript</span>
                <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-1">
                <div>import {`{ Siraj }`} from 'siraj-sdk-js';</div>
                <div></div>
                <div>const client = new Siraj({`{`}</div>
                <div>  apiKey: process.env.SIRAJ_API_KEY,</div>
                <div>  baseUrl: 'https://siraj.life'</div>
                <div>{`}`});</div>
                <div></div>
                <div>const res = await client.ping();</div>
                <div>console.log(res); // {`{ ok: true, keyId, plan, rateLimit }`}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authentication */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Authentication
          </CardTitle>
          <CardDescription>
            Secure your API requests with API keys
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">API Key Format</h4>
            <p className="text-sm text-muted-foreground mb-2">
              API keys follow the format: <code className="bg-gray-100 px-2 py-1 rounded">siraj_live_&lt;id&gt;.&lt;secret&gt;</code>
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• <strong>id</strong>: Unique identifier for your key</li>
              <li>• <strong>secret</strong>: Secret portion (keep this secure!)</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Header Authentication</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Include your API key in the <code className="bg-gray-100 px-2 py-1 rounded">x-api-key</code> header:
            </p>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
              <div>x-api-key: siraj_live_abc123.def456ghi789</div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Shield className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-800 mb-1">Security Best Practices</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Keep your API keys secret and never commit them to version control</li>
                  <li>• Rotate keys regularly and immediately if compromised</li>
                  <li>• Use environment variables to store keys in production</li>
                  <li>• Monitor your API usage for unusual activity</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rate Limits */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Rate Limits
          </CardTitle>
          <CardDescription>
            Understand and respect API rate limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Free Plan</h4>
              <div className="text-2xl font-bold text-blue-600 mb-1">10/min</div>
              <p className="text-sm text-muted-foreground">Perfect for development and testing</p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Pro Plan</h4>
              <div className="text-2xl font-bold text-green-600 mb-1">100/min</div>
              <p className="text-sm text-muted-foreground">Ideal for production applications</p>
            </div>
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2">Organization</h4>
              <div className="text-2xl font-bold text-purple-600 mb-1">500/min</div>
              <p className="text-sm text-muted-foreground">Enterprise-grade limits</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Rate Limit Headers</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Every response includes rate limit information:
            </p>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
              <div>X-RateLimit-Limit: 100</div>
              <div>X-RateLimit-Remaining: 95</div>
              <div>X-RateLimit-Reset: 2025-09-04T15:30:00.000Z</div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-800 mb-1">Rate Limit Exceeded (429)</h4>
                <p className="text-sm text-red-700 mb-2">
                  When you exceed your rate limit, you'll receive a 429 response:
                </p>
                <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-sm">
                  <div>{`{`}</div>
                  <div>  "ok": false,</div>
                  <div>  "error": "rate_limit",</div>
                  <div>  "retryAfter": 12</div>
                  <div>{`}`}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>API Endpoints</CardTitle>
          <CardDescription>
            Available endpoints and their usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="ping" className="w-full">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="ping">Ping</TabsTrigger>
            </TabsList>
            
            <TabsContent value="ping" className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="default">GET</Badge>
                  <code className="bg-gray-100 px-2 py-1 rounded">/api/ping</code>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Test your API key and get basic information about your account and rate limits.
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Request</h4>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                  <div>curl -H "x-api-key: siraj_live_abc123.def456" \</div>
                  <div>     https://siraj.life/api/ping</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Response</h4>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                  <div>{`{`}</div>
                  <div>  "ok": true,</div>
                  <div>  "keyId": "abc123",</div>
                  <div>  "uid": "user_123",</div>
                  <div>  "plan": "pro",</div>
                  <div>  "timestamp": "2025-09-04T15:30:00.000Z",</div>
                  <div>  "rateLimit": {`{`}</div>
                  <div>    "remaining": 95,</div>
                  <div>    "resetTime": "2025-09-04T15:31:00.000Z"</div>
                  <div>  {`}`}</div>
                  <div>{`}`}</div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Error Handling */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Error Handling
          </CardTitle>
          <CardDescription>
            Common error responses and how to handle them
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="border-l-4 border-red-500 pl-4">
              <h4 className="font-semibold text-red-800">401 Unauthorized</h4>
              <p className="text-sm text-muted-foreground mb-2">Missing or invalid API key</p>
              <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-sm">
                <div>{`{ "ok": false, "error": "unauthorized" }`}</div>
              </div>
            </div>

            <div className="border-l-4 border-yellow-500 pl-4">
              <h4 className="font-semibold text-yellow-800">429 Too Many Requests</h4>
              <p className="text-sm text-muted-foreground mb-2">Rate limit exceeded</p>
              <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-sm">
                <div>{`{ "ok": false, "error": "rate_limit", "retryAfter": 12 }`}</div>
              </div>
            </div>

            <div className="border-l-4 border-gray-500 pl-4">
              <h4 className="font-semibold text-gray-800">5xx Server Errors</h4>
              <p className="text-sm text-muted-foreground mb-2">Temporary server issues - retry with exponential backoff</p>
              <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-sm">
                <div>{`{ "ok": false, "error": "internal_server_error" }`}</div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">SDK Retry Logic</h4>
            <p className="text-sm text-blue-700">
              The Siraj JavaScript SDK automatically handles retries for 429 and 5xx errors with exponential backoff. 
              Configure retry behavior in the SDK constructor.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* SDK Installation */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>JavaScript SDK</CardTitle>
          <CardDescription>
            Official Siraj SDK for Node.js and browsers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Installation</h4>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
              <div>npm install siraj-sdk-js</div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Basic Usage</h4>
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
              <div className="space-y-1">
                <div>import {`{ Siraj }`} from 'siraj-sdk-js';</div>
                <div></div>
                <div>const client = new Siraj({`{`}</div>
                <div>  apiKey: process.env.SIRAJ_API_KEY,</div>
                <div>  baseUrl: 'https://siraj.life',</div>
                <div>  retries: 3,</div>
                <div>  timeoutMs: 10000</div>
                <div>{`}`});</div>
                <div></div>
                <div>try {`{`}</div>
                <div>  const result = await client.ping();</div>
                <div>  console.log('Success:', result);</div>
                <div>{`}`} catch (error) {`{`}</div>
                <div>  console.error('Error:', error.message);</div>
                <div>{`}`}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Resources</CardTitle>
          <CardDescription>
            Additional resources and tools
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                API Keys Management
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Create, rotate, and manage your API keys
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/account/api">Manage Keys</Link>
              </Button>
            </div>

            <div className="border rounded-lg p-4">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Postman Collection
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Import our Postman collection for easy testing
              </p>
              <Button asChild variant="outline" size="sm">
                <Link href="/examples/postman/Siraj.postman_collection.json" target="_blank">
                  Download Collection
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>© 2025 Siraj. All rights reserved.</p>
        <p className="mt-1">
          Need help? Visit our <Link href="/support" className="text-blue-600 hover:underline">support page</Link> or 
          <Link href="/contact" className="text-blue-600 hover:underline ml-1">contact us</Link>.
        </p>
      </div>
    </main>
  );
}
