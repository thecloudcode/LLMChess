import React, { useState, useRef, useEffect } from "react";
import ChessPiece from "./ChessPiece";
import { movePiece } from "@/utils/chess";
import { Bricolage_Grotesque } from "next/font/google"

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-bricolage-grotesque",
})

const initialBoard = [
  ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
  ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
  [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
  [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
  [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
  [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
  ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
  ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'],
];

interface ChessEvent {
  type: string;
  data: any;
}

interface ChessBoardProps {
  sharedEvents: ChessEvent[];
  onAddEvent: (event: ChessEvent) => void;
  onResetEvents: () => void;
}

const ChessBoard: React.FC<ChessBoardProps> = ({ 
  sharedEvents, 
  onAddEvent, 
  onResetEvents 
}) => {
  const [boardState, setBoardState] = useState(initialBoard);
  const [capturedByPlayer, setCapturedByPlayer] = useState<string[]>([]);
  const [capturedByOpponent, setCapturedByOpponent] = useState<string[]>([]);
  const [playerScore, setPlayerScore] = useState("");
  const [opponentScore, setOpponentScore] = useState("");

  // New state for game management
  const [status, setStatus] = useState<string>('Ready to start');
  const [isGameRunning, setIsGameRunning] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const [connectionRetries, setConnectionRetries] = useState(0);
  const MAX_RETRIES = 3;

  // Rest of the component remains the same as in the previous implementation...

  const handleDrop = (e: React.DragEvent, toRow: number, toCol: number) => {
    e.preventDefault();

    const data = JSON.parse(e.dataTransfer.getData('piece'));
    const {row: fromRow, col: fromCol} = data;
    if (fromRow === toRow && fromCol === toCol) return;
    if (boardState[fromRow][fromCol] === ' ') return;

    const pieceBeingCaptured = boardState[toRow][toCol];

    const newBoard = movePiece(boardState, fromRow, fromCol, toRow, toCol);

    if (pieceBeingCaptured !== ' ') {
      if (pieceBeingCaptured === pieceBeingCaptured.toLowerCase()) {
        setCapturedByPlayer([...capturedByPlayer, pieceBeingCaptured]);
        setPlayerScore(playerScore + getPieceValue(pieceBeingCaptured));
      } else {
        setCapturedByOpponent([...capturedByOpponent, pieceBeingCaptured]);
        setOpponentScore(opponentScore + getPieceValue(pieceBeingCaptured));
      }
    }

    setBoardState(newBoard);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  }

  const getPieceValue = (piece: string) => {
    switch (piece.toLowerCase()) {
      case 'p': return 1; 
      case 'n': return 3; 
      case 'b': return 3; 
      case 'r': return 5; 
      case 'q': return 9; 
      case 'k': return 0; 
      default: return 0;
    }
  };

  const startGame = async () => {
    if (isGameRunning) return;
    
    setStatus('Starting game...');
    onResetEvents(); // Reset shared events
    setIsGameRunning(true);
    setConnectionRetries(0);
    
    try {
      const response = await fetch('/api/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          gameType: 'chess'
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to start game: ${response.status} - ${errorText}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setupEventSource();
      
    } catch (error) {
      console.error('Error starting game:', error);
      setStatus(`Failed to start game: ${error instanceof Error ? error.message : String(error)}`);
      setIsGameRunning(false);
    }
  };

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
    
    const getStatusMessage = (type: string, data: any): string => {
      switch (type) {
        case 'game-start':
          return `Game started: Chess`;
        case 'thinking':
          return `${data.player || 'Player'} is thinking...`;
        case 'move':
          return `${data.player || 'Player'} played: ${data.move || 'Unknown move'}`;
        case 'game-over':
          return `Game over: ${data.result || 'Unknown result'}`;
        default:
          return `Event received: ${type}`;
      }
    };
    
    const registerHandler = (eventType: string) => {
      eventSource.addEventListener(eventType, (e: MessageEvent) => {
        console.log(`${eventType} event received`, e);
        handleEvent(eventType, e);
      });
    };
    
    registerHandler('game-start');
    registerHandler('thinking');
    registerHandler('move');
    registerHandler('game-over');
    
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
  
  useEffect(() => {
    return () => {
      closeEventSource();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-4 px-6 h-full">
      <div className="w-full max-w-[120vmin] flex justify-center items-center px-4 shadow-2xl">
        <div className="text-white">
          <div className="text-lg font-bold">{playerScore}</div>
          <div className="flex">
            {capturedByPlayer.map((piece, index) => (
              <div key={index} className="text-white text-2xl mx-1">
                {piece}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-8 grid-rows-8 w-full max-w-[84vmin] max-h-[84vmin] aspect-square shadow-2xl border-4 border-[#13141E]">
        {boardState.map((row, rowIndex) =>
          row.map((piece, colIndex) => {
            const isLightSquare = (rowIndex + colIndex) % 2 === 0;
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`flex items-center justify-center 
                  ${isLightSquare ? "bg-[#2F3241]" : "bg-[#13141E]"} shadow-2xl`}
                onDrop={(e)=>handleDrop(e, rowIndex, colIndex)}
                onDragOver={handleDragOver}
              >
                {piece !== ' ' && (
                  <ChessPiece
                    key={`${rowIndex}-${colIndex}-piece`}
                    piece={piece}
                    row={rowIndex}
                    col={colIndex}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
      <div className="w-full max-w-[90vmin] flex justify-between items-center px-4">
        <div className="text-white">
          <div className="text-lg font-bold">{opponentScore}</div>
          <div className="flex mt-2">
            {capturedByOpponent.map((piece, index) => (
              <div key={index} className="text-white text-2xl mx-1">
                {piece}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <button 
        className={`w-30 h-10 ${bricolageGrotesque.className} bg-black text-white p-2 justify-center items-center text-center rounded-3xl mt-5 text-sm`}
        onClick={startGame}
        disabled={isGameRunning}
      >
        {isGameRunning ? 'Game in Progress...' : 'START'}
      </button>
    </div>
  );
};

export default ChessBoard;