// Test streaming functionality in browser console
// Run this in the browser console on http://localhost:3000/dashboard/chat

async function testStreaming() {
  console.log('🧪 Starting streaming test...');
  
  try {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      cache: 'no-store',
      body: JSON.stringify({
        chatId: 'test-' + Date.now(),
        content: 'حلل سورة الفاتحة',
        mode: 'مقالة'
      })
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    if (!response.body) {
      throw new Error('No response body available');
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let content = '';
    let chunkCount = 0;
    
    console.log('🔄 Starting to read stream...');
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log('✅ Stream completed!');
        console.log('📊 Total chunks received:', chunkCount);
        console.log('📊 Total content length:', content.length);
        break;
      }
      
      chunkCount++;
      const chunk = decoder.decode(value);
      console.log(`📦 Chunk ${chunkCount}:`, chunk.length, 'bytes');
      
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            console.log('🏁 Received [DONE] marker');
            break;
          }
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              content += parsed.content;
              console.log('📝 Content update:', parsed.content.length, 'chars, total:', content.length);
            }
            if (parsed.status) {
              console.log('📊 Status update:', parsed.status);
            }
          } catch (e) {
            console.warn('⚠️ Failed to parse JSON:', data);
          }
        }
      }
    }
    
    console.log('🎉 Test completed successfully!');
    console.log('📄 Final content preview:', content.substring(0, 200) + '...');
    
  } catch (error) {
    console.error('❌ Streaming test failed:', error);
  }
}

// Run the test
testStreaming();
