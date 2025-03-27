import { useState, useRef, useEffect } from "react";
import LLMTerminal from "./LLMTerminal";
import { Bricolage_Grotesque } from "next/font/google"

interface ChessEvent {
  type: string;
  data: Record<string, unknown>;
}

interface LLMChatProps {
  sharedEvents: ChessEvent[];
  onAddEvent: (event: ChessEvent) => void;
}

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-bricolage-grotesque",
})

const LLMChat: React.FC<LLMChatProps> = ({ 
  sharedEvents, 
  onAddEvent,
}) => {
  const models = ['GPT-3.5', 'Llama1', 'Llama2', 'LLaMA', 'PaLM'];
  const [model1, setModel1] = useState(models[0]);
  const [model2, setModel2] = useState(models[1]);

  return (
    <div className="h-full w-full text-white flex flex-col items-center rounded-xl space-y-3">
      <div className="flex justify-center space-x-2 w-full">
        <div className="w-6 h-6 bg-black rounded-full"></div>
        <select 
          value={model1}
          onChange={(e) => setModel1(e.target.value)}
           className={`${bricolageGrotesque.className} text-black text-md w-full rounded-xs font-bold`}>
          {models.map((model) => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>
      </div>

      <div className="w-full h-full overflow-y-auto bg-[#EEF1F5] rounded-2xl scrollbar-hide">
        <LLMTerminal model={model1} events={sharedEvents} />
      </div>

      <div className="w-full h-full overflow-y-auto bg-[#EEF1F5] rounded-2xl scrollbar-hide">
        <LLMTerminal model={model2} events={sharedEvents} />
      </div>
      
      <div className="flex w-full justify-center space-x-2">
        <div className="w-6 h-6 border-2 border-black rounded-full bg-white"></div>
        <select 
          value={model2}
          onChange={(e) => setModel2(e.target.value)}
          className={`${bricolageGrotesque.className} text-black text-md w-full rounded-xs font-bold`}>
          {models.map((model) => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default LLMChat;