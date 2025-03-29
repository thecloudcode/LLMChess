import React, { useState, useRef, useEffect, useCallback } from "react";
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

// Parse FEN string to board array
const parseFEN = (fen: string): string[][] => {
  // FEN has multiple parts separated by spaces, we only need the first part
  const boardSection = fen.split(' ')[0];
  const rows = boardSection.split('/');
  
  const board: string[][] = [];
  
  for (const row of rows) {
    const boardRow: string[] = [];
    for (const char of row) {
      if (isNaN(parseInt(char))) {
        // If it's not a number, it's a piece
        boardRow.push(char);
      } else {
        // If it's a number, add that many empty spaces
        for (let i = 0; i < parseInt(char); i++) {
          boardRow.push(' ');
        }
      }
    }
    board.push(boardRow);
  }
  
  return board;
};

// Map algebraic notation to board coordinates (improved version)
const mapAlgebraicToCoords = (move: string, currentBoard: string[][]): { from: [number, number], to: [number, number] } | null => {
  try {
    // Handle castling
    if (move === "O-O") {
      // Kingside castling (assuming white's turn for now)
      return { from: [7, 4], to: [7, 6] }; // White king
    }
    if (move === "O-O-O") {
      // Queenside castling (assuming white's turn for now)
      return { from: [7, 4], to: [7, 2] }; // White king
    }
    
    // Basic pawn move (e.g., "e4")
    if (/^[a-h][1-8]$/.test(move)) {
      const col = move.charCodeAt(0) - 97; // 'a' = 0, 'b' = 1, etc.
      const row = 8 - parseInt(move[1]); // '8' = 0, '7' = 1, etc.
      
      // Find which pawn can move there
      // We'll check both white and black pawns depending on the current position
      const whitePawnRow = row + 1;
      const blackPawnRow = row - 1;
      
      // Check if there's a white pawn one row below
      if (whitePawnRow < 8 && whitePawnRow >= 0 && currentBoard[whitePawnRow][col] === 'P') {
        return { from: [whitePawnRow, col], to: [row, col] };
      }
      
      // Check if there's a black pawn one row above
      if (blackPawnRow < 8 && blackPawnRow >= 0 && currentBoard[blackPawnRow][col] === 'p') {
        return { from: [blackPawnRow, col], to: [row, col] };
      }
      
      // Check for double pawn push (white)
      if (row === 4 && currentBoard[6][col] === 'P' && currentBoard[5][col] === ' ') {
        return { from: [6, col], to: [row, col] };
      }
      
      // Check for double pawn push (black)
      if (row === 3 && currentBoard[1][col] === 'p' && currentBoard[2][col] === ' ') {
        return { from: [1, col], to: [row, col] };
      }
    }
    
    // Piece move (e.g., "Nf3")
    if (/^[KQRBN][a-h][1-8]$/.test(move)) {
      const piece = move[0];
      const toCol = move.charCodeAt(1) - 97;
      const toRow = 8 - parseInt(move[2]);
      
      // Find the piece that can move there
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (currentBoard[r][c] === piece.toUpperCase() || currentBoard[r][c] === piece.toLowerCase()) {
            // Simplified check - in a real implementation, you would verify if the move is legal
            return { from: [r, c], to: [toRow, toCol] };
          }
        }
      }
    }
    
    // Capture move (e.g., "Nxe5")
    if (/^[KQRBN]x[a-h][1-8]$/.test(move)) {
      const piece = move[0];
      const toCol = move.charCodeAt(2) - 97;
      const toRow = 8 - parseInt(move[3]);
      
      // Find the piece that can capture
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (currentBoard[r][c] === piece.toUpperCase() || currentBoard[r][c] === piece.toLowerCase()) {
            // Simplified check - in a real implementation, you would verify if the capture is legal
            return { from: [r, c], to: [toRow, toCol] };
          }
        }
      }
    }
    
    // Pawn capture (e.g., "exd5")
    if (/^[a-h]x[a-h][1-8]$/.test(move)) {
      const fromCol = move.charCodeAt(0) - 97;
      const toCol = move.charCodeAt(2) - 97;
      const toRow = 8 - parseInt(move[3]);
      
      // Check for white pawn
      if (toRow > 0 && currentBoard[toRow + 1][fromCol] === 'P') {
        return { from: [toRow + 1, fromCol], to: [toRow, toCol] };
      }
      
      // Check for black pawn
      if (toRow < 7 && currentBoard[toRow - 1][fromCol] === 'p') {
        return { from: [toRow - 1, fromCol], to: [toRow, toCol] };
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error parsing algebraic notation:", error, move);
    return null;
  }
};

interface ChessEventData {
  [key: string]: unknown;
}

interface ChessEvent {
  type: string;
  data: ChessEventData;
}

interface ChessBoardProps {
  sharedEvents: ChessEvent[];
  onAddEvent: (event: ChessEvent) => void;
  onResetEvents: () => void;
}

interface EventSourceEvent {
  data: string;
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
  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  

  // New state for game management
  const [status, setStatus] = useState<string>('Ready to start');
  const [isGameRunning, setIsGameRunning] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const [connectionRetries, setConnectionRetries] = useState(0);
  const MAX_RETRIES = 10;

  // Memoize the moveHistory state update function
  const addMoveToHistory = useCallback((move: string) => {
    setMoveHistory(prev => [...prev, move]);
  }, []);

  // Handle captured pieces
  const handleCapture = useCallback((pieceBeingCaptured: string) => {
    if (pieceBeingCaptured !== ' ') {
      if (pieceBeingCaptured === pieceBeingCaptured.toLowerCase()) {
        setCapturedByPlayer(prev => [...prev, pieceBeingCaptured]);
        setPlayerScore(prev => prev + getPieceValue(pieceBeingCaptured));
      } else {
        setCapturedByOpponent(prev => [...prev, pieceBeingCaptured]);
        setOpponentScore(prev => prev + getPieceValue(pieceBeingCaptured));
      }
    }
  }, []);

  // Process shared events to update the board
  useEffect(() => {
    if (sharedEvents.length === 0) return;
    
    const latestEvent = sharedEvents[sharedEvents.length - 1];
    console.log('Processing latest shared event:', latestEvent);
    
    // Handle move events
    if (latestEvent.type === 'move' && latestEvent.data.move) {
      const moveNotation = latestEvent.data.move as string;
      console.log(`Processing move: ${moveNotation}`);
      
      // Add to move history (using the memoized function)
      addMoveToHistory(moveNotation);
      console.log(moveHistory)
      
      // Check if the FEN string is available
      if (latestEvent.data.fen && typeof latestEvent.data.fen === 'string') {
        console.log(`Using FEN to update board: ${latestEvent.data.fen}`);
        const newBoardFromFen = parseFEN(latestEvent.data.fen as string);
        setBoardState(newBoardFromFen);
      } else {
        // Fallback to algebraic notation
        setBoardState(prevBoard => {
          const coords = mapAlgebraicToCoords(moveNotation, prevBoard);
          
          if (coords) {
            console.log(`Mapped move ${moveNotation} to coordinates:`, coords);
            const [fromRow, fromCol] = coords.from;
            const [toRow, toCol] = coords.to;
            
            // Check if a piece is being captured
            const pieceBeingCaptured = prevBoard[toRow][toCol];
            
            // Handle captures separately
            if (pieceBeingCaptured !== ' ') {
              handleCapture(pieceBeingCaptured);
            }
            
            // Update the board
            return movePiece(prevBoard, fromRow, fromCol, toRow, toCol);
          }
          
          console.warn(`Could not map move ${moveNotation} to board coordinates`);
          return prevBoard;
        });
      }
      
      // After move is processed, notify server that render is complete if moveNumber exists
      const moveNumber = latestEvent.data.moveNumber;
      if (moveNumber && typeof moveNumber === 'number') {
        setTimeout(() => {
          notifyRenderComplete(moveNumber as number);
        }, 100); // Small delay to ensure state updates have processed
      }
    }
    
    // Handle game-over event with final board state
    if (latestEvent.type === 'game-over' && latestEvent.data.finalFen) {
      console.log(`Setting final board from FEN: ${latestEvent.data.finalFen}`);
      const finalBoard = parseFEN(latestEvent.data.finalFen as string);
      setBoardState(finalBoard);
    }
    
    // If the event is game-start, reset the board
    if (latestEvent.type === 'game-start') {
      setBoardState(initialBoard);
      setCapturedByPlayer([]);
      setCapturedByOpponent([]);
      setPlayerScore("");
      setOpponentScore("");
      setMoveHistory([]);
    }
  }, [sharedEvents, addMoveToHistory, handleCapture]);

  // Function to notify server that render is complete
  const notifyRenderComplete = async (moveCount: number) => {
    try {
      await fetch('/api/notify-render-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          moveCount,
          gameId: 'default'
        }),
      });
      console.log(`Notified server that move #${moveCount} rendering is complete`);
    } catch (error) {
      console.error('Error notifying render complete:', error);
    }
  };

  const handleDrop = (e: React.DragEvent, toRow: number, toCol: number) => {
    e.preventDefault();

    const data = JSON.parse(e.dataTransfer.getData('piece'));
    const {row: fromRow, col: fromCol} = data;
    if (fromRow === toRow && fromCol === toCol) return;
    if (boardState[fromRow][fromCol] === ' ') return;

    const pieceBeingCaptured = boardState[toRow][toCol];

    setBoardState(prevBoard => movePiece(prevBoard, fromRow, fromCol, toRow, toCol));

    if (pieceBeingCaptured !== ' ') {
      handleCapture(pieceBeingCaptured);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  }

  const getPieceValue = (piece: string) => {
    switch (piece.toLowerCase()) {
      case 'p': return '1'; 
      case 'n': return '3'; 
      case 'b': return '3'; 
      case 'r': return '5'; 
      case 'q': return '9'; 
      case 'k': return '0'; 
      default: return '0';
    }
  };

  const startGame = async () => {
    if (isGameRunning) return;
    
    setStatus('Starting game...');
    console.log(status)
    onResetEvents(); // Reset shared events
    setIsGameRunning(true);
    setConnectionRetries(0);
    
    // Reset the board state
    setBoardState(initialBoard);
    setCapturedByPlayer([]);
    setCapturedByOpponent([]);
    setPlayerScore("");
    setOpponentScore("");
    setMoveHistory([]);
    
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
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
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

    const safeJsonParse = (data: string | undefined | null): ChessEventData => {
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
    
    const handleEvent = (type: string, e: EventSourceEvent) => {
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
    
    const getStatusMessage = (type: string, data: ChessEventData): string => {
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
    registerHandler('connection-test');
    registerHandler('response');
    registerHandler('reasoning');
    registerHandler('error');
    registerHandler('illegal-move');
    
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
      <div className="w-full max-w-[120vmin] flex justify-between items-center px-4 shadow-2xl">
        <div className="text-white">
          <div className="text-lg font-bold">{playerScore}</div>
          <div className="flex">
            {capturedByPlayer.map((piece, index) => (
              <div key={`player-capture-${index}`} className="text-white text-2xl mx-1">
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
                key={`square-${rowIndex}-${colIndex}`}
                className={`flex items-center justify-center 
                  ${isLightSquare ? "bg-[#2F3241]" : "bg-[#13141E]"} shadow-2xl`}
                onDrop={(e)=>handleDrop(e, rowIndex, colIndex)}
                onDragOver={handleDragOver}
              >
                {piece !== ' ' && (
                  <ChessPiece
                    key={`piece-${rowIndex}-${colIndex}`}
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
              <div key={`opponent-capture-${index}`} className="text-white text-2xl mx-1">
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