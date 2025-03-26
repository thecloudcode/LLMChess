import { useState, useRef, useEffect } from "react";
import LLMTerminal from "./LLMTerminal";

interface ChessEvent {
  type: string;
  data: any;
}

const LLMChat = () => {
  const models = ['GPT-3.5', 'Llama1', 'Llama2', 'LLaMA', 'PaLM'];
  const [model1, setModel1] = useState(models[0]);
  const [model2, setModel2] = useState(models[1]);
  const [status, setStatus] = useState<string>('Ready to start');
  const [events, setEvents] = useState<ChessEvent[]>([]);
  const [isGameRunning, setIsGameRunning] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const [connectionRetries, setConnectionRetries] = useState(0);
  const MAX_RETRIES = 3;
 
  const startGame = async () => {
    if (isGameRunning) return;
    
    setStatus('Starting game...');
    setEvents([]);
    setIsGameRunning(true);
    setConnectionRetries(0);
    
    try {
      // First make the POST request to start the game
      const response = await fetch('/api/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          model1, 
          model2 
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to start game: ${response.status} - ${errorText}`);
      }
      
      // Add a small delay before establishing the SSE connection
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setupEventSource();
      
    } catch (error) {
      console.error('Error starting game:', error);
      setStatus(`Failed to start game: ${error instanceof Error ? error.message : String(error)}`);
      setIsGameRunning(false);
    }
  };

  const setupEventSource = () => {
    // Create a new EventSource
    const eventSource = new EventSource('/api/webhook');
    eventSourceRef.current = eventSource;
    
    eventSource.onopen = () => {
      console.log('SSE connection opened');
      setStatus('Connection established, waiting for moves...');
      // Reset retry count on successful connection
      setConnectionRetries(0);
    };
    
    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      
      // Handle retry logic
      setConnectionRetries(prev => prev + 1);
      
      if (connectionRetries >= MAX_RETRIES) {
        setStatus(`Error: Connection failed after ${MAX_RETRIES} attempts`);
        closeEventSource();
      } else {
        setStatus(`Connection error. Retry attempt ${connectionRetries + 1}/${MAX_RETRIES}...`);
        
        // Add event for the error
        addEvent('connection-error', { 
          attempt: connectionRetries + 1, 
          maxRetries: MAX_RETRIES 
        });
        
        // Try to reconnect after a delay
        setTimeout(() => {
          if (isGameRunning && !eventSourceRef.current) {
            setupEventSource();
          }
        }, 1000);
      }
    };

    const safeJsonParse = (data: string | undefined | null) => {
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
    
    // Generic event handler that safely parses JSON
    const handleEvent = (type: string, e: MessageEvent) => {
      console.log(`Raw ${type} event data:`, e.data);
      
      const parsedData = safeJsonParse(e.data);
      
      // Always add the event, even if parsing failed
      addEvent(type, parsedData);
      
      // Update status based on the event
      if (parsedData.parseError) {
        setStatus(`Received malformed ${type} event`);
      } else if (parsedData.empty) {
        setStatus(`Received empty ${type} event`);
      } else {
        setStatus(getStatusMessage(type, parsedData));
      }
      
      // Special handling for game-over
      if (type === 'game-over') {
        closeEventSource();
      }
    };
    
    // Helper function to generate status messages
    const getStatusMessage = (type: string, data: any): string => {
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
    
    // Register event listeners - but with additional logging
    const registerHandler = (eventType: string) => {
      eventSource.addEventListener(eventType, (e: MessageEvent) => {
        console.log(`${eventType} event received`, e);
        handleEvent(eventType, e);
      });
    };
    
    // Register all event handlers
    registerHandler('game-start');
    registerHandler('thinking');
    registerHandler('response');
    registerHandler('move');
    registerHandler('error');
    registerHandler('illegal-move');
    registerHandler('game-over');
    
    // Add a handler for the generic 'message' event as a fallback
    eventSource.addEventListener('message', (e: MessageEvent) => {
      console.log('Generic message event received:', e);
      handleEvent('message', e);
    });
  };
  
  const closeEventSource = () => {
    if (eventSourceRef.current) {
      console.log('Closing EventSource connection');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsGameRunning(false);
  };
  
  const addEvent = (type: string, data: any) => {
    setEvents(prev => [...prev, { type, data }]);
  };
  
  useEffect(() => {
    // Clean up event source when component unmounts
    return () => {
      closeEventSource();
    };
  }, []);

  return (
    <div className="h-full w-full bg-black text-white flex flex-col items-center p-4 rounded-xl">
      <div className="flex justify-center space-x-8 mb-6 w-full">
        <select 
          value={model1}
          onChange={(e) => setModel1(e.target.value)}
          className="bg-black text-white w-full p-1 rounded-xs shadow-lg">
          {models.map((model) => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>
      </div>

      <div className="w-full max-w-2xl h-full overflow-y-auto shadow-lg">
        <LLMTerminal model={model1} events={events} />
      </div>

      <div className="w-full max-w-2xl h-full overflow-y-auto shadow-lg">
        <LLMTerminal model={model2} events={events} />
      </div>

      <div className="flex w-full justify-center space-x-8 mt-6">
        <select 
          value={model2}
          onChange={(e) => setModel2(e.target.value)}
          className="bg-black text-white w-full p-3 rounded-lg shadow-lg">
          {models.map((model) => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>
      </div>

      <div className="text-center text-white my-4">
        <p>{status}</p>
      </div>

      <button 
        className="w-full h-20 bg-white text-black font-bold p-2 justify-center items-center text-center rounded-sm mt-5"
        onClick={startGame}
        disabled={isGameRunning}
      >
        {isGameRunning ? 'Game in Progress...' : 'Start Game'}
      </button>
    </div>
  );
}

export default LLMChat;