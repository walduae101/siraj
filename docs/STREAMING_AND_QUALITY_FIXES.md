# Streaming and Essay Quality Fixes

## Overview

This document describes the fixes implemented for two critical issues:

1. **UI Live Rendering Bug**: Text generation requires refresh to see updates
2. **Essay Quality**: Implementation of Arabic Quranic analysis specifications with anti-repeat guards

## A) UI Live Rendering Fix

### Problem
The server generates tokens (visible in logs) but the UI doesn't update until hard refresh. This was caused by:
- Missing streaming response headers
- Inadequate cache control
- Missing anti-buffering headers

### Solution

#### 1. Fixed Streaming Response Headers
**File**: `src/app/api/chat/stream/route.ts`

```typescript
// Added proper streaming headers
return new Response(stream, {
  headers: {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-store, no-cache, must-revalidate',  // Fixed
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',                               // Added
    'Transfer-Encoding': 'chunked',                          // Added
    'Vary': 'Authorization',                                 // Added
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type',
  },
});
```

#### 2. Added Dynamic Export Configuration
```typescript
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';  // Added
export const revalidate = 0;             // Added
```

#### 3. Key Headers Explained
- `Cache-Control: no-store, no-cache, must-revalidate`: Prevents all caching
- `X-Accel-Buffering: no`: Disables proxy buffering (nginx/cloudflare)
- `Transfer-Encoding: chunked`: Enables real-time streaming
- `Vary: Authorization`: Ensures auth-specific responses aren't cached

### Testing
Use the test page at `/test-streaming` to verify real-time streaming without refresh.

## B) Essay Quality Specifications

### Problem
Need to enforce high-quality Arabic Quranic analysis with:
- No repetition or filler phrases
- Proper linguistic analysis methodology
- Structured content following specific guidelines

### Solution

#### 1. Created Compose Endpoints
**Files**: 
- `src/app/api/compose/route.ts` (non-streaming)
- `src/app/api/compose/stream/route.ts` (streaming)

#### 2. Essay Quality Specifications
```typescript
const ESSAY_QUALITY_SPEC = `
اللغة: عربية فصحى رصينة. لا عامية ولا حشو إنشائي.
المنهج: تحليل قرآني بالقرآن واللغة فقط. لا مرويات ولا أسباب نزول ولا تراث تفسيري.
المحاور الإلزامية: (1) البنية الكلية للسورة ومسار الدلالة، (2) التحليل اللغوي والصرفي والبلاغي للألفاظ المفتاحية، 
(3) العلاقة بين البنية الإيقاعية والدلالة، (4) الانتقال من الخبر إلى العهد إلى الدعاء، 
(5) نقد طرفَي الانحراف (علم بلا أمانة/إخلاص بلا بصيرة) بوصفهما نمطين إنسانيين عامّين، 
(6) القيم الجامعة المستنبطة لإنسان اليوم.
أسلوب العرض: فقرات محكمة، أسئلة استنكارية محسوبة، أمثلة مقتضبة من ألفاظ السورة، لا تكرار، لا استطراد.
ممنوعات: عبارات الحشو ("تفكير…"، "مقالة…"، "سنتحدّث…")، التكرار المعنوي أو النصي، التفصيلات الفقهية، التعويل على مصادر خارج النص.
القيود: لا تُعيد جُملاً سابقة بصيغ طفيفة. لا تختم بخلاصة مطوّلة تُعيد كامل المتن. اجعل الخاتمة موجزة.
`;
```

#### 3. Anti-Repeat Guards

##### Repetition Detection
```typescript
function detectRepetition(text: string): boolean {
  const sentences = text.split(/[.!?؟]/).filter(s => s.trim().length > 0);
  const wordThreshold = 12;
  
  // Check for repeated sentences
  for (let i = 0; i < sentences.length; i++) {
    const words = sentences[i].trim().split(/\s+/);
    if (words.length >= wordThreshold) {
      const sentence = sentences[i].trim();
      const occurrences = sentences.filter(s => s.trim() === sentence).length;
      if (occurrences > 1) {
        return true;
      }
    }
  }
  
  // Check for filler phrases
  const fillerPhrases = ['يفكر', 'مقالة', 'سنحلل', 'سنتحدث', 'في هذا النص'];
  for (const phrase of fillerPhrases) {
    if (text.includes(phrase)) {
      return true;
    }
  }
  
  return false;
}
```

##### N-Gram Overlap Detection
```typescript
function calculateNGramOverlap(text: string, n: number = 6): number {
  // Calculates semantic overlap between adjacent paragraphs
  // Returns overlap ratio (0-1), rejects if > 0.3
}
```

#### 4. Quality Checklist
```typescript
function qualityCheck(text: string): { pass: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check for repetition
  if (detectRepetition(text)) {
    issues.push('تكرار نصي أو معنوي');
  }
  
  // Check for n-gram overlap
  const overlap = calculateNGramOverlap(text);
  if (overlap > 0.3) {
    issues.push('تداخل عالي بين الفقرات');
  }
  
  // Check for required sections
  const requiredKeywords = ['البنية', 'التحليل', 'اللغة', 'القيم'];
  const foundKeywords = requiredKeywords.filter(keyword => text.includes(keyword));
  if (foundKeywords.length < 2) {
    issues.push('عدم تغطية المحاور المطلوبة');
  }
  
  // Check for filler phrases
  const fillerPhrases = ['تفكير', 'مقالة', 'سنحلل', 'سنتحدث'];
  const hasFiller = fillerPhrases.some(phrase => text.includes(phrase));
  if (hasFiller) {
    issues.push('وجود عبارات حشو');
  }
  
  return {
    pass: issues.length === 0,
    issues
  };
}
```

#### 5. Enhanced Generation Parameters
```typescript
const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [...],
  temperature: 0.6,        // Balanced creativity
  top_p: 0.9,             // Focused sampling
  frequency_penalty: 0.7,  // Reduces repetition
  presence_penalty: 0.2,   // Encourages new topics
  max_tokens: Math.min(maxWords * 2, 4000),
  seed: 7,                 // Consistency
  stream: true,            // For streaming endpoint
});
```

### API Usage

#### Non-Streaming Endpoint
```bash
curl -X POST "https://siraj.life/api/compose" \
  -H "Content-Type: application/json" \
  -d '{
    "task": "essay",
    "prompt": "حلل سورة الفاتحة",
    "lang": "ar",
    "style": "quranic-linguistic",
    "maxWords": 1400,
    "enforce": true
  }'
```

#### Streaming Endpoint
```bash
curl -N -X POST "https://siraj.life/api/compose/stream" \
  -H "Content-Type: application/json" \
  -d '{
    "task": "essay",
    "prompt": "حلل سورة الفاتحة",
    "lang": "ar",
    "style": "quranic-linguistic",
    "maxWords": 1400,
    "enforce": true
  }'
```

### Response Format
```json
{
  "text": "المقالة المولدة...",
  "meta": {
    "wordCount": 1200,
    "rubric": {
      "pass": true,
      "issues": [],
      "enforced": true
    },
    "model": "gpt-4o-mini",
    "timestamp": "2025-01-27T10:30:00.000Z"
  }
}
```

## Testing

### 1. Manual Testing
- Visit `/test-streaming` page
- Test real-time streaming without refresh
- Verify essay quality with different prompts

### 2. Automated Testing
```bash
# Run comprehensive tests
npx tsx scripts/test-streaming-and-quality.ts
```

### 3. Test Scenarios
- **Streaming Headers**: Verify all required headers are present
- **Essay Quality**: Test with `enforce: true` to validate quality gates
- **Streaming Response**: Confirm real-time token delivery
- **Anti-Repeat**: Test with prompts that might cause repetition

## Validation Commands

### Test Streaming Headers
```bash
curl -sSI "https://siraj.life/api/compose/stream" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"test": "headers"}' | grep -E "cache-control|content-type|x-accel-buffering|transfer-encoding"
```

### Test Real-Time Streaming
```bash
curl -N "https://siraj.life/api/compose/stream" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"task": "essay", "prompt": "حلل سورة الفاتحة", "enforce": true}'
```

### Test Essay Quality
```bash
curl -X POST "https://siraj.life/api/compose" \
  -H "Content-Type: application/json" \
  -d '{
    "task": "essay",
    "prompt": "حلل سورة الفاتحة",
    "enforce": true
  }' | jq '.meta.rubric'
```

## Expected Results

### Streaming Fix
- ✅ Real-time text updates without refresh
- ✅ Proper streaming headers present
- ✅ No buffering delays
- ✅ Immediate token delivery

### Essay Quality
- ✅ No repetition or filler phrases
- ✅ Proper Arabic linguistic analysis
- ✅ Coverage of required analytical dimensions
- ✅ Quality gates prevent low-quality output
- ✅ Structured, coherent essays

## Rollback Strategy

If issues arise:

1. **Streaming Issues**: Revert `src/app/api/chat/stream/route.ts` headers
2. **Quality Issues**: Disable `enforce: true` parameter
3. **Complete Rollback**: Restore original API endpoints

## Monitoring

Monitor these metrics:
- Streaming response times
- Quality gate rejection rates
- User satisfaction with essay quality
- API error rates

## Future Enhancements

1. **Advanced Quality Metrics**: ML-based quality scoring
2. **Custom Rubrics**: User-defined quality criteria
3. **A/B Testing**: Compare quality enforcement vs. non-enforcement
4. **Performance Optimization**: Caching for repeated prompts
