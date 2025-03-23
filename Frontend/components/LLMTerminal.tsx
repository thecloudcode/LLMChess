import { useState, useEffect, useRef } from "react";

const LLMTerminal = () => {
    const [messages, setMessages] = useState<string[]>(["> Agent: I like playing aggressively", "> Agent: I like playing aggressively","> Agent: I like playing aggressively","> Agent: I like playing aggressively","> Agent: I like playing aggressively","> Agent: I like playing aggressively","> Agent: I like playing aggressively","Stockfish: That is an Invalid Move"]);
    const inputRef=  useRef<HTMLInputElement>(null);
    const terminalEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({behavior:
            'smooth'
        });
    }, [messages]);

    const sendMessage = (message:string) => {
        if(!message.trim()) return;
        setMessages((prev) => [...prev, `> User: ${message}`]);

        setTimeout(()=>{
            const response = `Agent: ${generateAgentResponse(message)}`;
            setMessages((prev) => [...prev, response]);
        }, 1000);
    }

    const generateAgentResponse = (input: string) => {
        if (input.toLowerCase().includes('hello')) return 'Hi! How can I help you today?';
        if (input.toLowerCase().includes('how are you')) return "I'm just a machine, but I'm doing fine!";
        return "I'm not sure I understand that.";
      };

      const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const message = inputRef.current?.value || '';
        sendMessage(message);
        if (inputRef.current) inputRef.current.value = '';
      };
    
      return (
        <div className="bg-black text-white text-xs p-4 rounded-lg w-full overflow-y-auto">
        
          <div className="space-y-1">
            {messages.map((msg, index) => (
              <div key={index} className="whitespace-pre-wrap">{msg}</div>
            ))}
            <div ref={terminalEndRef} />
          </div>
    
          {/* Input bar */}
          <form onSubmit={handleSubmit} className="flex">
            {/* <input
              type="text"
              ref={inputRef}
              className="w-full bg-black border border-gray-600 text-green-400 px-4 py-2 focus:outline-none"
              placeholder="Type a message..."
            />
            <button
              type="submit"
              className="bg-green-500 text-black px-4 py-2 ml-2 hover:bg-green-400"
            >
              Send
            </button> */}
          </form>
        </div>
      );
}

export default LLMTerminal;