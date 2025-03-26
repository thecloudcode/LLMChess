import { useState, useEffect, useRef } from 'react';

interface ChessEvent {
  type: string;
  data: any;
}

export default function ChessBattle() {
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
    
    // Safe JSON parse function
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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">LLM Chess Battle</h1>
      
      <div className="mb-4">
        <button
          onClick={startGame}
          disabled={isGameRunning}
          className={`px-4 py-2 rounded ${isGameRunning ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
        >
          {isGameRunning ? 'Game in progress...' : 'Start New Game'}
        </button>
        
        {isGameRunning && (
          <button
            onClick={closeEventSource}
            className="ml-2 px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white"
          >
            Stop Game
          </button>
        )}
      </div>
      
      <div className="mb-4 p-2 bg-black rounded">
        <strong>Status:</strong> {status}
      </div>
      
      <div className="border rounded p-4 h-96 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-2">Game Events ({events.length})</h2>
        {events.length === 0 ? (
          <p className="text-gray-500">No events yet. Start a game to see the action!</p>
        ) : (
          events.map((event, index) => (
            <div key={index} className="mb-4 p-2 border-b">
              <div className="font-semibold">{event.type}</div>
              {event.data?.parseError && (
                <div className="bg-black p-2 my-1 rounded">
                  <strong>Parse Error:</strong> Failed to parse event data
                  {event.data?.rawData && (
                    <div className="mt-1 text-xs overflow-x-auto">
                      Raw: {event.data.rawData}
                    </div>
                  )}
                </div>
              )}
              {event.data?.empty && (
                <div className="bg-black p-2 my-1 rounded">
                  <strong>Empty Data:</strong> Event contained no data
                </div>
              )}
              {event.type === 'response' && !event.data?.parseError && !event.data?.empty && (
                <div className="bg-black p-2 my-1 rounded">
                  <strong>{event.data.player || 'Player'}:</strong> {event.data.response || 'No response'}
                </div>
              )}
              {event.type === 'move' && !event.data?.parseError && !event.data?.empty && (
                <div className="bg-black p-2 my-1 rounded">
                  <strong>Move:</strong> {event.data.move || 'Unknown'} 
                  {event.data.moveNumber && <span> (Move #{event.data.moveNumber})</span>}
                </div>
              )}
              {event.type === 'game-over' && !event.data?.parseError && !event.data?.empty && (
                <div className="bg-black p-2 my-1 rounded">
                  <strong>Result:</strong> {event.data.result || 'Unknown'}
                  {event.data.moves && (
                    <div className="mt-2">
                      <strong>Moves:</strong> {event.data.moves.join(', ')}
                    </div>
                  )}
                </div>
              )}
              {event.type !== 'response' && 
                event.type !== 'move' && 
                event.type !== 'game-over' && 
                !event.data?.parseError && 
                !event.data?.empty && (
                <pre className="text-sm bg-black p-2 overflow-x-auto">
                  {JSON.stringify(event.data, null, 2)}
                </pre>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

