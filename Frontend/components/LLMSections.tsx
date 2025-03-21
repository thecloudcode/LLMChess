    import { useState } from "react";
    // import {motion} from 'framer-motion';
    import LLMTerminal from "./LLMTerminal";

    const LLMChat = () => {
        const models = ['GPT-3.5', 'Claude', 'Mistral', 'LLaMA', 'PaLM'];
        const [model1, setModel1] = useState(models[0]);
        const [model2, setModel2] = useState(models[1]);
        // const [conversation, setConversation] = useState<string[]>([]);

        // const handleExchange = () => {
        //     const response = `${model2}: "This is a response from ${model2}"`;
        //     setConversation((prev) => [...prev, `${model1}: "What do you think about AI?`, response]);
        //     console.log(conversation);
        // };

        return (
            <div className="h-full w-full bg-black text-white flex flex-col items-center p-4 rounded-xl">
                <div className="flex justify-center space-x-8 mb-6 w-full">
                    <select 
                    value={model1}
                    onChange={(e) =>setModel1(e.target.value)}
                    className="text-white w-full p-1 rounded-xs shadow-lg">
                        {models.map((model) => (
                            <option key={model} value={model}>{model}</option>
                        ))}
                    </select>
                </div>

                <div className="w-full max-w-2xl h-full overflow-y-auto shadow-lg">
                    {/* {
                        conversation.map((message, index) => (
                            <motion.div
                            key={index}
                            initial={{opacity: 0, y: 10}}
                            animate={{opacity: 1, y: 0}}
                            transition={{duration: 0.3}}
                            className={`mb-2 p-3 rounded-lg w-full ${message.startsWith(model1) ? 'bg-blue-700':'bg-green-700'}`}>
                                {message}
                            </motion.div>
                        ))
                    } */}

                    <LLMTerminal/>

                    {/* <button 
                    onClick={handleExchange}
                    className="mt-6 bg-blue-600 hover:bg-blue-500 transition p-3 rounded-lg font-semibold shadow-lg">
                        Generate Exchange
                    </button> */}
                </div>

                <div className="w-full max-w-2xl h-full overflow-y-auto shadow-lg">
                    {/* {
                        conversation.map((message, index) => (
                            <motion.div
                            key={index}
                            initial={{opacity: 0, y: 10}}
                            animate={{opacity: 1, y: 0}}
                            transition={{duration: 0.3}}
                            className={`mb-2 p-3 rounded-lg w-full ${message.startsWith(model1) ? 'bg-blue-700':'bg-green-700'}`}>
                                {message}
                            </motion.div>
                        ))
                    } */}
                    <LLMTerminal/>
                    {/* <button 
                    onClick={handleExchange}
                    className="mt-6 bg-blue-600 hover:bg-blue-500 transition p-3 rounded-lg font-semibold shadow-lg">
                        Generate Exchange
                    </button> */}
                </div>

                <div className="flex w-full justify-center space-x-8 mt-6">
                    <select 
                    value={model2}
                    onChange={(e) =>setModel2(e.target.value)}
                    className="text-white w-full p-3 rounded-lg shadow-lg">
                        {models.map((model) => (
                            <option key={model} value={model}>{model}</option>
                        ))}
                    </select>
                </div>

                <button className="w-full h-20 bg-white text-black font-bold p-2 justify-center items-center text-center rounded-sm mt-5">
                    Start
                </button>
            </div>
        );
    }

    export default LLMChat;

