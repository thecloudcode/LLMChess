// app/components/ChatInput.tsx
'use client';

import React, { useState } from 'react';
import { Message, AIProvider } from '@/lib/chat';
import { ArrowUp } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage }) => {
  const [input, setInput] = useState('');

  const handleSendMessage = async () => {
    if (input.trim() === '') return;

    const providerMatch = input.match(/^@(llama|deepseek)\s+(.+)/i);
    
    if (providerMatch) {
      const provider = providerMatch[1].toLowerCase() as AIProvider;
      const message = providerMatch[2];

      onSendMessage({
        content: message,
        sender: 'user'
      });

      try {
        const response = await fetch(`/api/${provider}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: message }),
        });

        const data = await response.json();

        if (data.response) {
          onSendMessage({
            content: data.response,
            sender: provider
          });
        }
      } catch (error) {
        console.error('Error sending message:', error);
        onSendMessage({
          content: 'Sorry, there was an error processing your request.',
          sender: provider
        });
      }
    } else {
      // Regular message handling
      onSendMessage({
        content: input,
        sender: 'user'
      });
    }

    setInput('');
  };

  return (
    <div className="flex items-center bg-[#EEF1F5] px-1 py-1 rounded-lg mx-4">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
        placeholder="Type a message (use @llama or @deepseek for AI chat)"
        className="flex-grow p-2 rounded-lg text-black focus:outline-none focus:ring-0 placeholder-gray-300"
      />
      {/* <button
        onClick={handleSendMessage}
        className="bg-blue-500 text-white p-2 rounded-r-lg hover:bg-blue-600 transition-colors"
      >
        Send
      </button> */}

      <div onClick={handleSendMessage} className="flex items-center font-extrabold text-sm text-black px-3 gap-3 bg-[#EEF1F5]">
          
          <ArrowUp className="h-5 w-5 text-white bg-black rounded-4xl p-1 stroke-4 stroke-white" />
        </div>
    </div>
  );
};

export default ChatInput;