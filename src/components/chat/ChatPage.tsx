'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { flushSync } from 'react-dom';
import Topbar from './Topbar';
import MessageList from './MessageList';
import Composer from './Composer';
import StatusTags, { StatusPhase } from './StatusTags';
import { useToast } from '~/components/ui/Toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: any;
  tokens?: number;
}

interface ChatData {
  id: string;
  title: string;
  model: string;
  mode: 'مختصر' | 'مقالة';
  messages: Message[];
}

interface ChatPageProps {
  initialChatData: ChatData;
}

export default function ChatPage({ initialChatData }: ChatPageProps) {
  const [chatData, setChatData] = useState<ChatData>(initialChatData);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [statusPhase, setStatusPhase] = useState<StatusPhase>('thinking');
  const router = useRouter();
  const toast = useToast();

  // Refresh chat data when needed
  const refreshChatData = async () => {
    try {
      const response = await fetch(`/api/chat/${chatData.id}/get`);
      if (response.ok) {
        const updatedChat = await response.json();
        setChatData(updatedChat);
      }
    } catch (error) {
      console.error('Error refreshing chat data:', error);
    }
  };

  // Handle new message from composer
  const handleNewMessage = async (content: string) => {
    // Add user message immediately to UI
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date()
    };

    setChatData(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage]
    }));

    setIsStreaming(true);
    setStreamingMessage('');
    setStatusPhase('thinking');

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for authentication
        cache: 'no-store', // Ensure no caching
        body: JSON.stringify({
          chatId: chatData.id,
          content,
          mode: chatData.mode
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Handle streaming response
      console.log('🔧 Response headers:', Object.fromEntries(response.headers.entries()));
      console.log('🔧 Response status:', response.status);
      console.log('🔧 Response body available:', !!response.body);
      
      const reader = response.body?.getReader();
      if (reader) {
        const decoder = new TextDecoder();
        let assistantContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('🔧 Stream ended, total content length:', assistantContent.length);
            break;
          }

          const chunk = decoder.decode(value);
          console.log('🔧 Received chunk:', chunk.length, 'bytes');
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                // Add final assistant message to chat data
                const assistantMessage: Message = {
                  id: `assistant-${Date.now()}`,
                  role: 'assistant',
                  content: assistantContent,
                  createdAt: new Date(),
                  tokens: Math.ceil(assistantContent.length / 4)
                };

                console.log('✅ Streaming complete, final content length:', assistantContent.length);
                setChatData(prev => ({
                  ...prev,
                  messages: [...prev.messages, assistantMessage]
                }));

                setIsStreaming(false);
                setStreamingMessage('');
                return;
              }

              try {
                const parsed = JSON.parse(data);
                console.log('🔧 Parsed data:', parsed);
                
                // Handle status updates
                if (parsed.status) {
                  console.log('🔧 Setting status to:', parsed.status);
                  setStatusPhase(parsed.status);
                }
                
                // Handle content - always accumulate and display
                if (parsed.content) {
                  assistantContent += parsed.content;
                  console.log('📝 Streaming content update:', assistantContent.length, 'characters');
                  console.log('📝 Current streaming message state:', streamingMessage.length);
                  
                  // Force immediate UI update
                  flushSync(() => {
                    setStreamingMessage(assistantContent);
                  });
                  
                  // Update status based on content length if no explicit status
                  if (!parsed.status) {
                    const wordCount = assistantContent.split(' ').length;
                    if (wordCount < 100) {
                      setStatusPhase('drafting');
                    } else if (wordCount < 500) {
                      setStatusPhase('verifying');
                    } else {
                      setStatusPhase('done');
                    }
                  }
                }
              } catch (e) {
                console.error('Error parsing streaming data:', e, 'Raw data:', data);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('خطأ في الإرسال', 'فشل في إرسال الرسالة');
      
      // Remove the temporary user message on error
      setChatData(prev => ({
        ...prev,
        messages: prev.messages.filter(msg => msg.id !== userMessage.id)
      }));
    } finally {
      setIsStreaming(false);
      setStreamingMessage('');
    }
  };

  // Handle chat updates (rename, delete, etc.)
  const handleChatUpdate = async (updates?: Partial<ChatData>) => {
    if (updates) {
      setChatData(prev => ({ ...prev, ...updates }));
    } else {
      // If no updates provided, refresh chat data from server
      try {
        const response = await fetch(`/api/chat/${chatData.id}/get`);
        if (response.ok) {
          const updatedChatData = await response.json();
          setChatData(updatedChatData);
        }
      } catch (error) {
        console.error('Error refreshing chat data:', error);
      }
    }
  };

  // Handle mode changes
  const handleModeChange = (newMode: 'مختصر' | 'مقالة') => {
    setChatData(prev => ({ ...prev, mode: newMode }));
  };

  // Show streaming message in the message list
  const messagesWithStreaming = isStreaming && streamingMessage 
    ? [
        ...chatData.messages,
        {
          id: 'streaming',
          role: 'assistant' as const,
          content: streamingMessage,
          createdAt: new Date(),
          isStreaming: true
        }
      ]
    : chatData.messages;

  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 ChatPage render:', {
      isStreaming,
      streamingMessageLength: streamingMessage.length,
      messagesCount: messagesWithStreaming.length,
      statusPhase
    });
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <Topbar 
        chatId={chatData.id}
        title={chatData.title}
        model={chatData.model}
        mode={chatData.mode}
        onUpdate={handleChatUpdate}
        onModeChange={handleModeChange}
      />
      
      <div className="flex-1 min-h-0">
        {/* Status Tags - show during streaming */}
        {isStreaming && (
          <div className="px-4 py-2 border-b border-white/10">
            <StatusTags phase={statusPhase} mode={chatData.mode} />
          </div>
        )}
        
        <MessageList 
          chatId={chatData.id}
          messages={messagesWithStreaming}
        />
      </div>
      
      <div className="border-t border-white/10 flex-shrink-0">
        <Composer 
          chatId={chatData.id}
          mode={chatData.mode}
          onSendMessage={handleNewMessage}
          isStreaming={isStreaming}
          showSuggestions={chatData.messages.length === 0}
        />
      </div>
    </div>
  );
}
