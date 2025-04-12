"use client";
import { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import GameMoves from './XGameMoves';
import PlayerInfo from './XPlayerInfo';
import { Chess } from 'chess.js';
import { League_Spartan } from "next/font/google";

const leagueSpartan = League_Spartan({
    subsets: ["latin"],
    weight: ["700"], 
    variable: "--font-league-spartan",
})

const API_URL = process.env.NEXT_PUBLIC_PLAYGROUND_URL;

interface MoveRecord {
  player: string;
  move: string;
  reasoning: string;
  response: string;
  timestamp: string;
}

interface GameState {
  game_id: string;
  current_player: string;
  last_move?: string;
  board: string;
  status: 'in_progress' | 'checkmate' | 'stalemate' | 'draw' | 'error';
  winner?: string;
  moves: MoveRecord[];
}

const generateCustomSquareStyles = () => {
    const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const ranks = [1, 2, 3, 4, 5, 6, 7, 8];
    const styles: { [square: string]: React.CSSProperties } = {};

    files.forEach((file, fileIndex) => {
      ranks.forEach((rank, rankIndex) => {
        const square = `${file}${rank}`;
        const isWhiteSquare = (fileIndex + rankIndex) % 2 === 0;
        styles[square] = {
          backgroundColor: isWhiteSquare ? "#2F3140" : "#13141D",
        };
      });
    });

    return styles;
};

export default function ChessGame(): React.ReactElement {
  const [gameId, setGameId] = useState<string>('');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [llm1, setLlm1] = useState<string>('');
  const [llm2, setLlm2] = useState<string>('');
  const [chessInstance] = useState(new Chess());
  const [boardWidth, setBoardWidth] = useState(600);

  // Handle responsive board sizing
  useEffect(() => {
    const updateBoardSize = () => {
      // Calculate a responsive board size based on viewport width
      const viewportWidth = window.innerWidth;
      let newWidth = 600; // Default size
      
      if (viewportWidth < 640) {
        // Mobile
        newWidth = Math.min(viewportWidth - 32, 400);
      } else if (viewportWidth < 1024) {
        // Tablet
        newWidth = Math.min(viewportWidth * 0.45, 470);
      } else {
        // Desktop/laptop - keep default or adjust based on screen size
        newWidth = Math.min(viewportWidth * 0.25, 470);
      }
      
      setBoardWidth(newWidth);
    };

    // Initial calculation
    updateBoardSize();
    
    // Recalculate on resize
    window.addEventListener('resize', updateBoardSize);
    return () => window.removeEventListener('resize', updateBoardSize);
  }, []);

  const customPieces = () => {
    const pieces: { [pieceKey: string]: (props: { squareWidth: number }) => React.ReactElement } = {};
    const pieceTypes = ["P", "N", "B", "R", "Q", "K"];
    const colors = ["w", "b"];
  
    colors.forEach((color) => {
        pieceTypes.forEach((type) => {
          const pieceKey = `${color}${type}`;
          pieces[pieceKey] = ({ squareWidth }: { squareWidth: number }) => (
            <div style={{ 
              width: squareWidth, 
              height: squareWidth,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <img
                src={`/${pieceKey}.png`}
                alt={`${color === 'w' ? 'White' : 'Black'} ${type}`}
                style={{
                  width: '80%',
                  height: '80%',
                  objectFit: 'contain',
                }}
                draggable={false}
              />
            </div>
          );
        });
      });
  
    return pieces;
  };
  
  // Parse moves and update chess instance
  useEffect(() => {
    if (gameState?.moves) {
      // Reset to initial position
      chessInstance.reset();
      
      // Apply all moves
      gameState.moves.forEach(moveRecord => {
        try {
          chessInstance.move(moveRecord.move);
        } catch (e) {
          console.error(`Error applying move ${moveRecord.move}:`, e);
        }
      });
    }
  }, [gameState?.moves, chessInstance]);
  
  const startNewGame = async (): Promise<void> => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_URL}/new-game`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ llm1, llm2 }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to start game');
      }
      
      const data = await response.json();
      setGameId(data.game_id);
      
      // Initial game state
      const gameResponse = await fetch(`${API_URL}/game/${data.game_id}`);
      const gameData = await gameResponse.json();
      setGameState(gameData);
      
      // Subscribe to game updates
      subscribeToGameUpdates(data.game_id);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };
  
  const subscribeToGameUpdates = (id: string): (() => void) => {
    const eventSource = new EventSource(`${API_URL}/game-updates/${id}`);
    
    eventSource.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data) as GameState;
      setGameState(data);
      
      // Close the connection if game is over
      if (data.status !== 'in_progress') {
        eventSource.close();
      }
    };
    
    eventSource.onerror = () => {
      eventSource.close();
      setError('Connection to game updates lost');
    };
    
    // Cleanup function
    return () => {
      eventSource.close();
    };
  };
  
  useEffect(() => {
    // Cleanup event source on unmount
    return () => {
      // cleanup happens via the return function from subscribeToGameUpdates
    };
  }, [gameId]);
  
  const playNextMove = async (): Promise<void> => {
    if (!gameId || gameState?.status !== 'in_progress') return;
    
    setLoading(true);
    try {
      await fetch(`${API_URL}/play-move/${gameId}`, {
        method: 'POST',
      });
      // No need to update state here, it will come through SSE
    } catch (err) {
      setError(`Failed to make move: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="mx-auto py-4">
      
      {!gameId ? (
        <div className="flex flex-col items-center justify-center space-y-4 p-6 bg-white max-w-md mx-auto my-8 pt-32">
            <h1 className={`${leagueSpartan.className} text-5xl sm:text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-b from-neutral-900 to-neutral-600 mb-6`}>
                LLM vs LLM
            </h1>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    White
                </label>
                <select
                    value={llm1}
                    onChange={(e) => setLlm1(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-700 text-center"
                >
                    <option value="" disabled>Select a model</option>
                    <option value="llama">llama-49b</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Black
                </label>
                <select
                    value={llm2}
                    onChange={(e) => setLlm2(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-700 text-center"
                >
                    <option value="" disabled>Select a model</option>
                    <option value="llama2">llama-49b</option>
                </select>
            </div>
          </div>
          
          <button
            onClick={startNewGame}
            disabled={loading}
            className="px-6 py-2 bg-black text-white font-medium rounded-full hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 mt-4"
          >
            {loading ? 'Starting...' : 'Start Game'}
          </button>
          
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 w-full max-h-screen">
          
          {/* Left panel */}
          <div className="lg:col-span-1 h-auto lg:h-[calc(100vh-14rem)]">
            <div className="bg-[#EEF2F5] p-4 rounded-lg h-full flex flex-col">
              {gameState && gameState.moves.length > 0 && (
                <PlayerInfo 
                  whitePlayer={gameState.moves[0]?.player}
                  blackPlayer={gameState.moves.length > 1 ? gameState.moves[1]?.player : (gameState.moves[0]?.player === llm1 ? llm2 : llm1)}
                  currentPlayer={gameState.current_player}
                  status={gameState.status}
                  winner={gameState.winner}
                />
              )}
              
              <div className="mt-auto pt-4">
                <button
                  onClick={playNextMove}
                  disabled={loading || gameState?.status !== 'in_progress'}
                  className="w-full px-4 py-2 bg-black text-white font-medium rounded-md focus:outline-none focus:ring-2 disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Request Next Move'}
                </button>
                
                {error && <p className="text-red-500 mt-2">{error}</p>}
              </div>
            </div>
          </div>
          
          {/* Middle - Chess board */}
          <div className="pl-7 lg:col-span-1 flex justify-center items-center w-full">
            <div className="w-full max-w-md mx-auto drop-shadow-[0_12px_25px_rgba(0,0,0,0.4)] pt-2 pl-2">
              <Chessboard 
                position={chessInstance.fen()} 
                boardOrientation="white"
                customSquareStyles={generateCustomSquareStyles()}
                showBoardNotation={false}
                boardWidth={boardWidth}
                customPieces={customPieces()}
              />
            </div>
          </div>
          
          {/* Right side - Move history */}
          <div className="lg:col-span-1 h-full overflow-hidden">
            {gameState && <GameMoves moves={gameState.moves} />}
          </div>
        </div>
      )}
    </div>
  );
}