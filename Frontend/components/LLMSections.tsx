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
  onResetEvents: () => void;
}

interface GameData {
  players?: string[];
  player?: string;
  move?: string;
  message?: string;
  result?: string;
}

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-bricolage-grotesque",
})

const LLMChat: React.FC<LLMChatProps> = ({ 
  sharedEvents, 
  onAddEvent, 
  onResetEvents 
}) => {
  const models = ['GPT-3.5', 'Llama1', 'Llama2', 'LLaMA', 'PaLM'];
  const [model1, setModel1] = useState(models[0]);
  const [model2, setModel2] = useState(models[1]);
  const [status, setStatus] = useState<string>('Ready to start');
  console.log(status)
  const [isGameRunning, setIsGameRunning] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const [connectionRetries, setConnectionRetries] = useState(0);
  const MAX_RETRIES = 3;
 
  // const startGame = async () => {
  //   if (isGameRunning) return;
    
  //   setStatus('Starting game...');
  //   onResetEvents(); // Reset shared events
  //   setIsGameRunning(true);
  //   setConnectionRetries(0);
    
  //   try {
  //     const response = await fetch('/api/webhook', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ 
  //         model1, 
  //         model2 
  //       }),
  //     });
      
  //     if (!response.ok) {
  //       const errorText = await response.text();
  //       throw new Error(`Failed to start game: ${response.status} - ${errorText}`);
  //     }
      
  //     await new Promise(resolve => setTimeout(resolve, 500));
      
  //     setupEventSource();
      
  //   } catch (error) {
  //     console.error('Error starting game:', error);
  //     setStatus(`Failed to start game: ${error instanceof Error ? error.message : String(error)}`);
  //     setIsGameRunning(false);
  //   }
  // };

  const setupEventSource = () => {
    const eventSource = new EventSource('/api/webhook');
    eventSourceRef.current = eventSource;
    
    eventSource.onopen = () => {
      console.log('SSE connection opened');
      setStatus('Connection established, waiting for moves...');
      setConnectionRetries(0);
    };
    
    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      
      setConnectionRetries(prev => prev + 1);
      
      if (connectionRetries >= MAX_RETRIES) {
        setStatus(`Error: Connection failed after ${MAX_RETRIES} attempts`);
        closeEventSource();
      } else {
        setStatus(`Connection error. Retry attempt ${connectionRetries + 1}/${MAX_RETRIES}...`);
        
        onAddEvent({
          type: 'connection-error', 
          data: { 
            attempt: connectionRetries + 1, 
            maxRetries: MAX_RETRIES 
          }
        });
        
        setTimeout(() => {
          if (isGameRunning && !eventSourceRef.current) {
            setupEventSource();
          }
        }, 1000);
      }
    };

    const safeJsonParse = (data: string | undefined | null): Record<string, unknown> => {
      if (!data) {
        console.warn('Empty data received from event');
        return { empty: true };
      }
      
      try {
        return JSON.parse(data);
      } catch (err) {
        console.error('JSON Parse error:', err, 'Raw data:', data);
        return { parseError: true, rawData: data };
      }
    };
    
    const handleEvent = (type: string, e: MessageEvent) => {
      console.log(`Raw ${type} event data:`, e.data);
      
      const parsedData = safeJsonParse(e.data);
      
      // Add event to shared events
      onAddEvent({ type, data: parsedData });
      
      if (parsedData.parseError) {
        setStatus(`Received malformed ${type} event`);
      } else if (parsedData.empty) {
        setStatus(`Received empty ${type} event`);
      } else {
        setStatus(getStatusMessage(type, parsedData));
      }
      
      if (type === 'game-over') {
        closeEventSource();
      }
    };
    
    const getStatusMessage = (type: string, data: GameData): string => {
      switch (type) {
        case 'game-start':
          return `Game started: ${data.players?.join(' vs ') || 'Unknown players'}`;
        case 'thinking':
          return `${data.player || 'Player'} is thinking...`;
        case 'response':
          return `${data.player || 'Player'} responded`;
        case 'move':
          return `${data.player || 'Player'} played: ${data.move || 'Unknown move'}`;
        case 'error':
          return `Error: ${data.message || 'Unknown error'}`;
        case 'illegal-move':
          return `${data.player || 'Player'} made an illegal move: ${data.move || 'Unknown move'}`;
        case 'game-over':
          return `Game over: ${data.result || 'Unknown result'}`;
        default:
          return `Event received: ${type}`;
      }
    };
    
    // Register event handlers
    eventSource.addEventListener('game-start', (e: MessageEvent) => handleEvent('game-start', e));
    eventSource.addEventListener('thinking', (e: MessageEvent) => handleEvent('thinking', e));
    eventSource.addEventListener('response', (e: MessageEvent) => handleEvent('response', e));
    eventSource.addEventListener('move', (e: MessageEvent) => handleEvent('move', e));
    eventSource.addEventListener('error', (e: MessageEvent) => handleEvent('error', e));
    eventSource.addEventListener('illegal-move', (e: MessageEvent) => handleEvent('illegal-move', e));
    eventSource.addEventListener('game-over', (e: MessageEvent) => handleEvent('game-over', e));
  };
  
  const closeEventSource = () => {
    if (eventSourceRef.current) {
      console.log('Closing EventSource connection');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsGameRunning(false);
  };
  
  useEffect(() => {
    return () => {
      closeEventSource();
    };
  }, []);

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

      {/* <button 
        className="w-full h-20 bg-black text-white font-bold p-2 justify-center items-center text-center rounded-lg mt-5 shadow-2xl py-4"
        onClick={startGame}
        disabled={isGameRunning}
      >
        {isGameRunning ? 'Game in Progress...' : 'Start Game'}
      </button> */}
    </div>
  );
}

export default LLMChat;