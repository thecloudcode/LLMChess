// app/components/ChatArea.tsx
'use client';

import React, { useState } from 'react';
import { Message } from '@/lib/chat';
import ChatInput from './ChatInput';

const ChatArea: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);

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
        return 'bg-blue-100 self-end';
      case 'llama':
        return 'bg-green-100 self-start';
      case 'deepseek':
        return 'bg-purple-100 self-start';
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg ${getMessageClasses(
                message.sender
              )}`}
            >
              <p>{message.content}</p>
              <small className="block text-xs text-gray-500 mt-1">
                {message.sender} • {message.timestamp.toLocaleTimeString()}
              </small>
            </div>
          </div>
        ))}
      </div>
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatArea;