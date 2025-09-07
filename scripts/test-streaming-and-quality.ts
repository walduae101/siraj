#!/usr/bin/env tsx

/**
 * Test script for streaming functionality and essay quality
 * This script validates both the UI rendering fix and essay quality specifications
 */

// @ts-ignore - node-fetch types
import fetch from 'node-fetch';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

async function testStreamingHeaders(): Promise<TestResult> {
  try {
    const response = await fetch(`${BASE_URL}/api/compose/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'headers' })
    });

    const headers = Object.fromEntries(response.headers.entries());
    
    const requiredHeaders = [
      'content-type',
      'cache-control',
      'x-accel-buffering',
      'transfer-encoding'
    ];
    
    const missingHeaders = requiredHeaders.filter(header => !headers[header]);
    
    return {
      name: 'Streaming Headers Test',
      passed: missingHeaders.length === 0,
      details: {
        headers,
        missingHeaders,
        status: response.status
      }
    };
  } catch (error) {
    return {
      name: 'Streaming Headers Test',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function testEssayQuality(): Promise<TestResult> {
  try {
    const response = await fetch(`${BASE_URL}/api/compose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: 'essay',
        prompt: 'حلل سورة الفاتحة',
        lang: 'ar',
        style: 'quranic-linguistic',
        maxWords: 1400,
        enforce: true
      })
    });

    if (!response.ok) {
      return {
        name: 'Essay Quality Test',
        passed: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const data = await response.json();
    
    // Check if quality rubric is present
    const hasRubric = data.meta && data.meta.rubric;
    const qualityPassed = hasRubric ? data.meta.rubric.pass : false;
    const hasIssues = hasRubric ? data.meta.rubric.issues : [];
    
    return {
      name: 'Essay Quality Test',
      passed: hasRubric && qualityPassed,
      details: {
        wordCount: data.meta?.wordCount,
        rubric: data.meta?.rubric,
        hasText: !!data.text,
        textLength: data.text?.length
      }
    };
  } catch (error) {
    return {
      name: 'Essay Quality Test',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function testStreamingResponse(): Promise<TestResult> {
  try {
    const response = await fetch(`${BASE_URL}/api/compose/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: 'essay',
        prompt: 'حلل سورة الإخلاص',
        lang: 'ar',
        style: 'quranic-linguistic',
        maxWords: 800,
        enforce: false
      })
    });

    if (!response.ok) {
      return {
        name: 'Streaming Response Test',
        passed: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }

    // Check if response is streaming
    const contentType = response.headers.get('content-type');
    const isStreaming = contentType?.includes('text/event-stream');
    
    if (!isStreaming) {
      return {
        name: 'Streaming Response Test',
        passed: false,
        error: 'Response is not streaming (missing text/event-stream content-type)'
      };
    }

    // Read a few chunks to verify streaming
    // @ts-ignore - ReadableStream types
    const reader = response.body?.getReader?.();
    if (!reader) {
      return {
        name: 'Streaming Response Test',
        passed: false,
        error: 'No response body reader available'
      };
    }

    let chunkCount = 0;
    let hasData = false;
    
    try {
      while (chunkCount < 5) { // Read first 5 chunks
        const { done, value } = await reader.read();
        if (done) break;
        
        chunkCount++;
        const text = new TextDecoder().decode(value);
        if (text.includes('data: ')) {
          hasData = true;
        }
      }
    } finally {
      reader.releaseLock();
    }

    return {
      name: 'Streaming Response Test',
      passed: isStreaming && hasData,
      details: {
        contentType,
        chunkCount,
        hasData
      }
    };
  } catch (error) {
    return {
      name: 'Streaming Response Test',
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function runTests(): Promise<void> {
  console.log('🧪 Running Streaming and Quality Tests\n');
  console.log(`Base URL: ${BASE_URL}\n`);

  const tests = [
    testStreamingHeaders,
    testEssayQuality,
    testStreamingResponse
  ];

  const results: TestResult[] = [];

  for (const test of tests) {
    console.log(`Running ${test.name}...`);
    try {
      const result = await test();
      results.push(result);
      
      if (result.passed) {
        console.log(`✅ ${result.name}: PASSED`);
      } else {
        console.log(`❌ ${result.name}: FAILED`);
        if (result.error) {
          console.log(`   Error: ${result.error}`);
        }
      }
      
      if (result.details) {
        console.log(`   Details:`, JSON.stringify(result.details, null, 2));
      }
    } catch (error) {
      const errorResult: TestResult = {
        name: test.name,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      results.push(errorResult);
      console.log(`❌ ${test.name}: ERROR - ${errorResult.error}`);
    }
    console.log('');
  }

  // Summary
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  console.log('📊 Test Summary');
  console.log('================');
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${total - passed}`);
  console.log(`Success Rate: ${Math.round((passed / total) * 100)}%`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Streaming and quality features are working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
    process.exit(1);
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}

export { runTests, testStreamingHeaders, testEssayQuality, testStreamingResponse };
