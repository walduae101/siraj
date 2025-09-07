'use client';

import { useState } from 'react';
import { Button } from '~/components/ui/button';
import { Textarea } from '~/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';

export default function StreamingTest() {
  const [prompt, setPrompt] = useState('حلل سورة الفاتحة');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [status, setStatus] = useState<'idle' | 'thinking' | 'drafting' | 'done'>('idle');

  const testStreaming = async () => {
    if (!prompt.trim() || isStreaming) return;

    setIsStreaming(true);
    setStreamingText('');
    setStatus('thinking');

    try {
      const response = await fetch('/api/compose/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: 'essay',
          prompt: prompt.trim(),
          lang: 'ar',
          style: 'quranic-linguistic',
          maxWords: 1400,
          enforce: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              setStatus('done');
              setIsStreaming(false);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullText += parsed.content;
                setStreamingText(fullText);
                
                if (parsed.status) {
                  setStatus(parsed.status);
                }
              }
            } catch (e) {
              // Ignore parsing errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming test error:', error);
      setStreamingText(`خطأ: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`);
      setStatus('done');
    } finally {
      setIsStreaming(false);
    }
  };

  const testHeaders = async () => {
    try {
      const response = await fetch('/api/compose/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'headers' })
      });

      const headers = Object.fromEntries(response.headers.entries());
      console.log('Response headers:', headers);
      
      // Check for required streaming headers
      const requiredHeaders = [
        'content-type',
        'cache-control',
        'x-accel-buffering',
        'transfer-encoding'
      ];
      
      const missingHeaders = requiredHeaders.filter(header => !headers[header]);
      
      if (missingHeaders.length === 0) {
        alert('✅ All required streaming headers present!');
      } else {
        alert(`❌ Missing headers: ${missingHeaders.join(', ')}`);
      }
    } catch (error) {
      console.error('Header test error:', error);
      alert(`❌ Header test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Streaming Test Component</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Test Prompt:
            </label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here..."
              className="min-h-[100px]"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={testStreaming} 
              disabled={isStreaming || !prompt.trim()}
            >
              {isStreaming ? 'Generating...' : 'Test Streaming'}
            </Button>
            <Button 
              onClick={testHeaders} 
              variant="outline"
            >
              Test Headers
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <span className={`px-2 py-1 rounded text-xs ${
                status === 'thinking' ? 'bg-yellow-100 text-yellow-800' :
                status === 'drafting' ? 'bg-blue-100 text-blue-800' :
                status === 'done' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {status}
              </span>
            </div>
            
            {isStreaming && (
              <div className="text-sm text-gray-600">
                Real-time streaming test - text should appear without refresh
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {streamingText && (
        <Card>
          <CardHeader>
            <CardTitle>Streaming Output</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-right" dir="rtl">
                {streamingText}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
