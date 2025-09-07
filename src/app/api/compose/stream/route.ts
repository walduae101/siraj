import { NextRequest } from 'next/server';
import { getServerUser } from '~/server/auth/getServerUser';
import { withUsage } from '~/server/usage/withUsage';
import { buildSystemPrompt, postProcessArabic } from '~/server/tools/mufassir';
import { getOpenAI } from '~/server/services/openai';
import { track } from '~/lib/analytics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Essay quality specifications
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

// Anti-repeat guard functions
function detectRepetition(text: string): boolean {
  const sentences = text.split(/[.!?؟]/).filter(s => s.trim().length > 0);
  const wordThreshold = 12;
  
  // Check for repeated sentences
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    if (!sentence) continue;
    
    const words = sentence.trim().split(/\s+/);
    if (words.length >= wordThreshold) {
      const trimmedSentence = sentence.trim();
      const occurrences = sentences.filter(s => s?.trim() === trimmedSentence).length;
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

function calculateNGramOverlap(text: string, n: number = 6): number {
  const sentences = text.split(/[.!?؟]/).filter(s => s.trim().length > 0);
  if (sentences.length < 2) return 0;
  
  let totalOverlap = 0;
  let comparisons = 0;
  
  for (let i = 0; i < sentences.length - 1; i++) {
    const sentence1 = sentences[i];
    const sentence2 = sentences[i + 1];
    if (!sentence1 || !sentence2) continue;
    
    const words1 = sentence1.trim().split(/\s+/);
    const words2 = sentence2.trim().split(/\s+/);
    
    if (words1.length >= n && words2.length >= n) {
      const ngrams1 = new Set();
      const ngrams2 = new Set();
      
      for (let j = 0; j <= words1.length - n; j++) {
        ngrams1.add(words1.slice(j, j + n).join(' '));
      }
      
      for (let j = 0; j <= words2.length - n; j++) {
        ngrams2.add(words2.slice(j, j + n).join(' '));
      }
      
      const intersection = new Set([...ngrams1].filter(x => ngrams2.has(x)));
      const union = new Set([...ngrams1, ...ngrams2]);
      
      totalOverlap += intersection.size / union.size;
      comparisons++;
    }
  }
  
  return comparisons > 0 ? totalOverlap / comparisons : 0;
}

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
  
  // Check for required sections (basic check)
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

export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Check usage limits
    await withUsage({ uid: user.uid, feature: 'ai.generate' });

    const body = await request.json();
    const { 
      task = 'essay', 
      prompt, 
      lang = 'ar', 
      style = 'quranic-linguistic',
      outline = false,
      maxWords = 1400,
      enforce = false
    } = body;

    if (!prompt) {
      return new Response('Prompt is required', { status: 400 });
    }

    // Build enhanced system prompt for essay generation
    const baseSystemPrompt = buildSystemPrompt({ mode: 'مقالة' });
    const enhancedSystemPrompt = `${baseSystemPrompt}

${ESSAY_QUALITY_SPEC}

معايير الجودة الإلزامية:
- لا تكرار نصي أو معنوي
- تغطية المحاور الستة المطلوبة
- لغة فصحى رشيقة بلا حشو
- فقرات محكمة مترابطة
- خاتمة موجزة لا تُعيد المتن

تجنب تماماً: "تفكير"، "مقالة"، "سنحلل"، "سنتحدث"، "في هذا النص"`;

    const openai = await getOpenAI();
    
    // Generate with quality-focused parameters
    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: enhancedSystemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.6,
      top_p: 0.9,
      frequency_penalty: 0.7,
      presence_penalty: 0.2,
      max_tokens: Math.min(maxWords * 2, 4000),
      seed: 7,
      stream: true,
    });

    const streamResponse = new ReadableStream({
      async start(controller) {
        try {
          let fullResponse = '';
          
          // Emit initial status
          const statusData = JSON.stringify({ 
            content: '🤔 يفكر في التحليل...',
            status: 'thinking'
          });
          controller.enqueue(new TextEncoder().encode(`data: ${statusData}\n\n`));
          
          // Stream response
          for await (const chunk of stream as any) {
            const content = chunk.choices[0]?.delta?.content;
            const finishReason = chunk.choices[0]?.finish_reason;
            
            if (content) {
              fullResponse += content;
              
              const data = JSON.stringify({ 
                content: content,
                status: 'drafting'
              });
              controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
            }
            
            if (finishReason === 'stop') {
              // Post-process the response
              const processedResponse = postProcessArabic(fullResponse);
              
              // Quality check if enforcement is enabled
              let qualityResult: { pass: boolean; issues: string[] } = { pass: true, issues: [] };
              if (enforce) {
                qualityResult = qualityCheck(processedResponse);
                
                // If quality check fails, send rejection message
                if (!qualityResult.pass) {
                  const rejectionData = JSON.stringify({ 
                    content: 'تم رفض المسودة لعدم مطابقة معايير الجودة. يُعاد الصياغة تلقائيًا…',
                    status: 'rejected',
                    issues: qualityResult.issues
                  });
                  controller.enqueue(new TextEncoder().encode(`data: ${rejectionData}\n\n`));
                  controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                  controller.close();
                  return;
                }
              }
              
              // Send final response with quality metadata
              const finalData = JSON.stringify({ 
                content: processedResponse,
                status: 'done',
                meta: {
                  wordCount: processedResponse.split(/\s+/).length,
                  rubric: {
                    pass: qualityResult.pass,
                    issues: qualityResult.issues,
                    enforced: enforce
                  }
                }
              });
              controller.enqueue(new TextEncoder().encode(`data: ${finalData}\n\n`));
              controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
              controller.close();
              return;
            }
          }
          
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Error in compose stream:', error);
          
          const errorData = JSON.stringify({ 
            content: 'عذراً، حدث خطأ في توليد المقالة. يرجى المحاولة مرة أخرى.',
            error: true 
          });
          controller.enqueue(new TextEncoder().encode(`data: ${errorData}\n\n`));
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        }
      }
    });

    return new Response(streamResponse, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
        'Transfer-Encoding': 'chunked',
        'Vary': 'Authorization',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Compose stream API error:', error);
    
    if (error instanceof Error && error.message.includes('Usage limit exceeded')) {
      return new Response('Usage limit exceeded', { status: 402 });
    }

    return new Response('Internal server error', { status: 500 });
  }
}

// Handle unsupported methods
export async function GET() {
  return new Response('Method not allowed', { status: 405 });
}
