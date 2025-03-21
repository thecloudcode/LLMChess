import { useState } from "react";
import {motion} from 'framer-motion';

const Conversation = () => {
    const models = ['GPT-3.5', 'Claude', 'Mistral', 'LLaMA', 'PaLM'];
    const [input, setInput] = useState("");
    const [conversation, setConversation] = useState<string[]>([]);

    const handleExchange = () => {
        if(!input.trim()) return;

        let taggedModel = models.find(m => input.includes(`@${m}`));
        if(!taggedModel) {
            taggedModel = models[Math.floor(Math.random() * models.length)];
        }

        const userMessage = `User: "${input}"`;
        const response = `${taggedModel}: ""`;

        setConversation(prev => [...prev, userMessage, response]);
        setInput("");
    };

    return (
        <div className="h-full w-full bg-black text-white flex flex-col items-center rounded-xl p-4">
            <div className="w-full h-full p-4 overflow-y-auto shadow-lg  rounded-md max-w-2xl">
                {conversation.map((msg, index) => (        
                    <motion.p
                        key={index}
                        className="mb-1 text-xs"
                        initial={{opacity:0, y:10}}
                        animate={{opacity:1, y:0}}
                    >
                        {msg}
                    </motion.p>
                ))}
            </div>
            <div className="w-full max-w-2xl mt-4 flex">
                <input 
                    type="text" 
                    className="flex-1 p-2 rounded-l-md text-white border-2 border-white" 
                    placeholder="Ask a question or tag a model with @A, @B, or @C"
                    value={input} 
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleExchange()}
                />
                <button 
                    className="bg-white p-2 text-black font-bold rounded-r-md hover:bg-white"
                    onClick={handleExchange}
                >
                    Send
                </button>
            </div>
        </div>
    );
}

export default Conversation;

