// app/components/ChatArea.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Message } from '@/lib/chat';
import ChatInput from './ChatInput';
import ReactMarkdown from 'react-markdown';

// Typed Content Component for the typing animation
const TypedContent: React.FC<{ text: string, typingSpeed?: number }> = ({ 
  text, 
  typingSpeed = 20 
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let currentIndex = 0;
    
    const typeNextCharacter = () => {
      if (currentIndex < text.length) {
        setDisplayedText(text.substring(0, currentIndex + 1));
        currentIndex++;
        timeoutId = setTimeout(typeNextCharacter, typingSpeed);
      } else {
        setIsComplete(true);
      }
    };
    
    timeoutId = setTimeout(typeNextCharacter, typingSpeed);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [text, typingSpeed]);
  
  return (
    <div className="whitespace-pre-wrap markdown-content">
      <ReactMarkdown>{displayedText}</ReactMarkdown>
      {!isComplete && <span className="animate-pulse">▌</span>}
    </div>
  );
};

const ChatArea: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (messageData: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...messageData,
      id: `msg-${Date.now()}`,
      timestamp: new Date()
    };

    setMessages((prevMessages) => [...prevMessages, newMessage]);
  };

  const getMessageClasses = (sender: Message['sender']) => {
    switch (sender) {
      case 'user':
        return 'bg-[#EEF1F5] self-end text-gray-600 text-sm';
      case 'llama':
        return 'self-start text-sm text-gray-600';
      case 'deepseek':
        return 'self-start text-sm text-gray-600';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[100%] p-3 rounded-lg ${getMessageClasses(
                message.sender
              )}`}
            >
              {/* Use TypedContent for AI responses, immediate rendering for user messages */}
              {message.sender === 'user' ? (
                <div className="markdown-content">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              ) : (
                <TypedContent text={message.content} typingSpeed={15} />
              )}
              <small className="block text-xs mt-2">
                {message.sender} • {message.timestamp.toLocaleTimeString()}
              </small>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatArea;