// Comprehensive validation script for streaming and essay quality fixes
// This script validates both the UI live rendering bug fix and essay quality implementation

console.log('🔍 Starting comprehensive validation of fixes...');

// Test 1: Validate streaming API headers
async function testStreamingHeaders() {
  console.log('\n📡 Test 1: Validating streaming API headers...');
  
  try {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      cache: 'no-store',
      body: JSON.stringify({
        chatId: 'test-headers-' + Date.now(),
        content: 'Test message',
        mode: 'مقالة'
      })
    });
    
    const headers = Object.fromEntries(response.headers.entries());
    console.log('📋 Response headers:', headers);
    
    // Check for required streaming headers
    const requiredHeaders = {
      'content-type': 'text/event-stream',
      'cache-control': 'no-store, no-cache, must-revalidate',
      'connection': 'keep-alive',
      'x-accel-buffering': 'no'
    };
    
    let allHeadersPresent = true;
    for (const [key, expectedValue] of Object.entries(requiredHeaders)) {
      const actualValue = headers[key];
      if (actualValue && actualValue.toLowerCase().includes(expectedValue.toLowerCase())) {
        console.log(`✅ ${key}: ${actualValue}`);
      } else {
        console.log(`❌ ${key}: Expected "${expectedValue}", got "${actualValue}"`);
        allHeadersPresent = false;
      }
    }
    
    if (allHeadersPresent) {
      console.log('✅ All required streaming headers are present');
    } else {
      console.log('❌ Some required streaming headers are missing');
    }
    
    return allHeadersPresent;
    
  } catch (error) {
    console.log('❌ Error testing headers:', error.message);
    return false;
  }
}

// Test 2: Validate streaming content delivery
async function testStreamingContent() {
  console.log('\n📦 Test 2: Validating streaming content delivery...');
  
  try {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      cache: 'no-store',
      body: JSON.stringify({
        chatId: 'test-content-' + Date.now(),
        content: 'حلل سورة الفاتحة',
        mode: 'مقالة'
      })
    });
    
    if (!response.ok) {
      console.log('❌ Response not OK:', response.status, response.statusText);
      return false;
    }
    
    if (!response.body) {
      console.log('❌ No response body available');
      return false;
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let content = '';
    let chunkCount = 0;
    let hasContent = false;
    let hasStatus = false;
    
    console.log('🔄 Reading stream chunks...');
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log('✅ Stream completed');
        break;
      }
      
      chunkCount++;
      const chunk = decoder.decode(value);
      
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
              hasContent = true;
              console.log(`📝 Content chunk ${chunkCount}: ${parsed.content.length} chars`);
            }
            if (parsed.status) {
              hasStatus = true;
              console.log(`📊 Status update: ${parsed.status}`);
            }
          } catch (e) {
            console.warn('⚠️ Failed to parse JSON:', data);
          }
        }
      }
    }
    
    console.log(`📊 Total chunks: ${chunkCount}`);
    console.log(`📊 Content received: ${hasContent ? 'Yes' : 'No'}`);
    console.log(`📊 Status updates: ${hasStatus ? 'Yes' : 'No'}`);
    console.log(`📊 Total content length: ${content.length} characters`);
    
    if (content.length > 0) {
      console.log('✅ Streaming content delivery working');
      return true;
    } else {
      console.log('❌ No content received from stream');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Error testing streaming content:', error.message);
    return false;
  }
}

// Test 3: Validate essay quality API
async function testEssayQuality() {
  console.log('\n📚 Test 3: Validating essay quality API...');
  
  try {
    const response = await fetch('/api/compose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      cache: 'no-store',
      body: JSON.stringify({
        topic: 'حلل سورة الفاتحة',
        mode: 'مقالة'
      })
    });
    
    console.log('📋 Essay API response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('📄 Essay result keys:', Object.keys(result));
      
      if (result.content && result.content.length > 0) {
        console.log('✅ Essay generation working');
        console.log(`📊 Essay length: ${result.content.length} characters`);
        return true;
      } else {
        console.log('❌ No essay content generated');
        return false;
      }
    } else {
      console.log('❌ Essay API error:', response.status, response.statusText);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Error testing essay quality:', error.message);
    return false;
  }
}

// Test 4: Validate streaming essay API
async function testStreamingEssay() {
  console.log('\n📚 Test 4: Validating streaming essay API...');
  
  try {
    const response = await fetch('/api/compose/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      cache: 'no-store',
      body: JSON.stringify({
        topic: 'حلل سورة الفاتحة',
        mode: 'مقالة'
      })
    });
    
    console.log('📋 Streaming essay API response status:', response.status);
    
    if (!response.ok) {
      console.log('❌ Streaming essay API error:', response.status, response.statusText);
      return false;
    }
    
    if (!response.body) {
      console.log('❌ No response body for streaming essay');
      return false;
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let content = '';
    let chunkCount = 0;
    
    console.log('🔄 Reading streaming essay...');
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log('✅ Streaming essay completed');
        break;
      }
      
      chunkCount++;
      const chunk = decoder.decode(value);
      
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            console.log('🏁 Received [DONE] marker for essay');
            break;
          }
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              content += parsed.content;
              console.log(`📝 Essay chunk ${chunkCount}: ${parsed.content.length} chars`);
            }
            if (parsed.status) {
              console.log(`📊 Essay status: ${parsed.status}`);
            }
            if (parsed.rejected) {
              console.log(`🚫 Essay rejected: ${parsed.reason}`);
            }
          } catch (e) {
            console.warn('⚠️ Failed to parse essay JSON:', data);
          }
        }
      }
    }
    
    console.log(`📊 Essay chunks: ${chunkCount}`);
    console.log(`📊 Essay content length: ${content.length} characters`);
    
    if (content.length > 0) {
      console.log('✅ Streaming essay generation working');
      return true;
    } else {
      console.log('❌ No essay content received from stream');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Error testing streaming essay:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Running comprehensive validation tests...\n');
  
  const results = {
    streamingHeaders: await testStreamingHeaders(),
    streamingContent: await testStreamingContent(),
    essayQuality: await testEssayQuality(),
    streamingEssay: await testStreamingEssay()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(`Streaming Headers: ${results.streamingHeaders ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Streaming Content: ${results.streamingContent ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Essay Quality API: ${results.essayQuality ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Streaming Essay: ${results.streamingEssay ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = Object.values(results).every(result => result);
  console.log(`\n🎯 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (allPassed) {
    console.log('\n🎉 Both streaming bug fix and essay quality implementation are working correctly!');
  } else {
    console.log('\n⚠️ Some issues detected. Check the logs above for details.');
  }
  
  return results;
}

// Export for use in browser console
window.validateFixes = runAllTests;

console.log('💡 Run validateFixes() in the browser console to test all fixes');
