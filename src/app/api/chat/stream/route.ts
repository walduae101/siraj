import { NextRequest } from 'next/server';
import { getServerUser } from '~/server/auth/getServerUser';
import { sendMessage, addAssistantMessage } from '~/server/chat/actions';
import { withUsage } from '~/server/usage/withUsage';
import { track } from '~/lib/analytics';
import { aiRouter } from '~/server/services/ai-router';
import { costTracker } from '~/server/services/cost-tracker';
import { getDb } from '~/server/firebase/admin-lazy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Chat stream API called');
    
    const user = await getServerUser();
    console.log('🔧 User authentication result:', user ? 'authenticated' : 'not authenticated');
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { chatId, content, mode } = await request.json();
    console.log('🔧 Request data:', { chatId, content: content?.substring(0, 50) + '...', mode });

    if (!chatId || !content || !mode) {
      return new Response('Missing required fields', { status: 400 });
    }

    // Check usage limits (optional - don't block if usage tracking fails)
    console.log('🔧 Checking usage limits...');
    try {
      await withUsage({
        uid: user.uid,
        feature: 'ai.generate' as any
      });
      console.log('🔧 Usage limits check passed');
    } catch (error: any) {
      console.warn('🔧 Usage tracking failed, continuing anyway:', error);
      if (error.status === 402) {
        return new Response('Usage limit exceeded', { status: 402 });
      }
      // Don't throw error for usage tracking failures, just log and continue
    }

    // Add user message to database
    console.log('🔧 Adding user message to database...');
    const model = 'gpt-4o';
    await sendMessage({ chatId, content, mode, model });
    console.log('🔧 User message added successfully');

    // Get chat history for context
    console.log('🔧 Getting chat history...');
    const db = await getDb();
    
    // First check if the chat exists
    const chatDoc = await db
      .collection('users')
      .doc(user.uid)
      .collection('chats')
      .doc(chatId)
      .get();
    
    if (!chatDoc.exists) {
      console.log('🔧 Chat does not exist, creating new chat...');
      // Create the chat if it doesn't exist
      await db
        .collection('users')
        .doc(user.uid)
        .collection('chats')
        .doc(chatId)
        .set({
          title: 'محادثة جديدة',
          model: 'gpt-4o',
          mode: mode,
          createdAt: new Date(),
          updatedAt: new Date(),
          archived: false,
          pinned: false
        });
    }
    
    const messagesSnapshot = await db
      .collection('users')
      .doc(user.uid)
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('createdAt', 'asc')
      .limit(10) // Get last 10 messages for context
      .get();
    console.log('🔧 Chat history retrieved:', messagesSnapshot.docs.length, 'messages');

    const chatHistory = messagesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        role: data.role as 'user' | 'assistant',
        content: data.content
      };
    });

    // Add the new user message
    chatHistory.push({ role: 'user', content });
    console.log('🔧 Chat history prepared:', chatHistory.length, 'messages');
    console.log('🔧 Using model:', model);

    // Create streaming response using AI Router
    console.log('🔧 Creating streaming response with AI Router...');
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('Starting chat stream for user:', user.uid, 'mode:', mode);
          
          // Route to appropriate provider
          const routingResult = await aiRouter.routeStreamingGeneration(chatHistory, mode);
          console.log(`🔧 Using ${routingResult.provider} (${routingResult.model}) for mode: ${mode}`);
          
          // Log cost information
          aiRouter.logCostInfo(mode, routingResult.provider);
          
          // Track start of generation
          await track('chat.generate_start' as any, { 
            uid: user.uid, 
            chatId,
            model: routingResult.model,
            provider: routingResult.provider,
            estimatedCost: routingResult.estimatedCost
          });

          let fullResponse = '';
          
          // Get streaming response from routed provider
          console.log(`Getting ${routingResult.provider} streaming response...`);
          try {
            const reader = routingResult.stream.getReader();
          
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              
              const chunk = new TextDecoder().decode(value);
              const lines = chunk.split('\n');
              
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.slice(6);
                  if (data === '[DONE]') {
                    // Add final message to database
                    await addAssistantMessage({
                      chatId,
                      content: fullResponse,
                      tokens: Math.ceil(fullResponse.length / 4)
                    });

                    // Record cost
                    await costTracker.recordCost({
                      userId: user.uid,
                      chatId,
                      mode,
                      provider: routingResult.provider,
                      model: routingResult.model,
                      inputTokens: Math.ceil(JSON.stringify(chatHistory).length / 4),
                      outputTokens: Math.ceil(fullResponse.length / 4),
                      totalTokens: Math.ceil(JSON.stringify(chatHistory).length / 4) + Math.ceil(fullResponse.length / 4),
                      estimatedCost: routingResult.estimatedCost,
                      responseLength: fullResponse.length
                    });

                    // Track completion
                    await track('chat.generate_complete' as any, { 
                      uid: user.uid, 
                      chatId,
                      model: routingResult.model,
                      provider: routingResult.provider,
                      estimatedCost: routingResult.estimatedCost,
                      responseLength: fullResponse.length
                    });

                    controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
                    controller.close();
                    return;
                  }
                  
                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.content) {
                      fullResponse += parsed.content;
                      controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
                    }
                  } catch (e) {
                    // Ignore parsing errors
                  }
                }
              }
            }
          } catch (openaiError) {
            console.error('OpenAI service error:', openaiError);
            
            // Use fallback response
            const fallbackResponse = mode === 'مقالة' 
              ? 'عذراً، حدث خطأ في الاتصال بخدمة الذكاء الاصطناعي. يرجى المحاولة مرة أخرى لاحقاً.'
              : 'عذراً، حدث خطأ في الاتصال بخدمة الذكاء الاصطناعي. يرجى المحاولة مرة أخرى.';
            
            fullResponse = fallbackResponse;
            
            // Add fallback message to database
            await addAssistantMessage({
              chatId,
              content: fullResponse,
              tokens: Math.ceil(fullResponse.length / 4)
            });

            // Track error
            await track('chat.generate_error' as any, {
              uid: user.uid,
              chatId,
              model: routingResult.model,
              provider: routingResult.provider,
              error: openaiError instanceof Error ? openaiError.message : 'AI service error'
            });

            // Send fallback response
            const fallbackData = JSON.stringify({ 
              content: fallbackResponse,
              status: 'done'
            });
            controller.enqueue(new TextEncoder().encode(`data: ${fallbackData}\n\n`));
            controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
            controller.close();
            return;
          }
        } catch (error) {
          console.error('Error in streaming response:', error);
          console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            uid: user.uid,
            chatId,
            model
          });

          // Track error
          await track('chat.generate_error' as any, {
            uid: user.uid,
            chatId,
            model,
            error: error instanceof Error ? error.message : 'Unknown error'
          });

          // Send error message to client
          const errorData = JSON.stringify({ 
            content: 'عذراً، حدث خطأ في توليد الرد. يرجى المحاولة مرة أخرى.',
            error: true 
          });
          controller.enqueue(new TextEncoder().encode(`data: ${errorData}\n\n`));
          controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
          controller.close();
        }
      }
    });

    return new Response(stream, {
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
    console.error('Error in chat stream:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return new Response('Internal Server Error', { status: 500 });
  }
}

