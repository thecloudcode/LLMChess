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

    // First, send the user message regardless of whether it has an @mention
    onSendMessage({
      content: input,
      sender: 'user'
    });

    // Check for @mentions anywhere in the message, not just at the beginning
    const providers = ['llama', 'deepseek'];
    let foundProvider: AIProvider | null = null;
    
    for (const provider of providers) {
      const mentionRegex = new RegExp(`@${provider}\\b`, 'i');
      if (mentionRegex.test(input)) {
        foundProvider = provider.toLowerCase() as AIProvider;
        break;
      }
    }

    if (foundProvider) {
      try {
        // Remove the @mention from the message to get the clean prompt
        const cleanPrompt = input.replace(new RegExp(`@${foundProvider}\\b`, 'i'), '').trim();
        
        const response = await fetch(`/api/${foundProvider}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: cleanPrompt }),
        });

        const data = await response.json();

        if (data.response) {
          onSendMessage({
            content: data.response,
            sender: foundProvider
          });
        }
      } catch (error) {
        console.error('Error sending message:', error);
        onSendMessage({
          content: 'Sorry, there was an error processing your request.',
          sender: foundProvider
        });
      }
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
        placeholder="Type a message (use @llama or @deepseek anywhere for AI chat)"
        className="flex-grow p-2 rounded-lg text-black focus:outline-none focus:ring-0 placeholder-gray-300"
      />

      <div onClick={handleSendMessage} className="flex items-center font-extrabold text-sm text-black px-3 gap-3 bg-[#EEF1F5] cursor-pointer">
        <ArrowUp className="h-5 w-5 text-white bg-black rounded-4xl p-1 stroke-4 stroke-white" />
      </div>
    </div>
  );
};

export default ChatInput;