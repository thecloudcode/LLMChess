'use client';

import { useState } from 'react';

export default function ChatBox() {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);

  async function sendMessage() {
    const res = await fetch('/api/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    const data = await res.json();
    if (data.conversation) {
      setConversation(data.conversation);
    }
  }

  return (
    <div className="p-6 bg-gray-100 rounded-lg">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full p-2 border rounded"
        placeholder="Type your message..."
      />
      <button onClick={sendMessage} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
        Send
      </button>

      <div className="mt-6">
        {conversation.map((msg, index) => (
          <div key={index} className="p-2 mb-2 bg-white border rounded">
            {msg}
          </div>
        ))}
      </div>
    </div>
  );
}
