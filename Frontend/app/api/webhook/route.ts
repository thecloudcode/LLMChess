import { NextRequest } from 'next/server';
import { getFen, makeMove, resetBoard, isGameOver } from '@/lib/chess';

// Create a Map to store active games (in a real app, this would be in a database)
// This is to ensure we don't lose state between SSE connections
const activeGames = new Map();

async function getMoveFromLlama(moves: string[], playerName: string = 'Llama') {
  const prompt = moves.length > 0 
    ? `You are ${playerName}. Given the chess moves so far: ${moves.join(', ')}, suggest the next chess move. First provide your move, then on a new line after "Reasoning:" explain why you're making this move and your strategic thinking. Your response will have two parts: 1) The move itself 2) Your reasoning.` 
    : `You are ${playerName}. Suggest a strong opening move in chess. First provide your move, then on a new line after "Reasoning:" explain why you're making this move and your strategic thinking. Your response will have two parts: 1) The move itself 2) Your reasoning.`;
  
  try {
    console.log(`Sending prompt to Llama API: ${prompt}`);
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/llama`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    
    if (!response.ok) {
      console.error(`API response not OK: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Error text: ${errorText}`);
      throw new Error(`Failed to get response from Llama API: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Llama API response:", data);
    
    if (!data.response) {
      console.error("No response field in API response:", data);
      throw new Error("Invalid API response format");
    }
    
    const move = extractMove(data.response);
    console.log(`Extracted move: ${move} from response: ${data.response}`);
    
    // Extract reasoning from the response
    const reasoning = extractReasoning(data.response);
    console.log(`Extracted reasoning: ${reasoning}`);
    
    return {
      move: move,
      fullResponse: data.response,
      reasoning: reasoning
    };
  } catch (error) {
    console.error("Error in getMoveFromLlama:", error);
    throw error;
  }
}

// Function to extract the move from LLM response
function extractMove(response: string) {
  if (!response) return null;
  
  // More comprehensive regex to catch different move formats
  const movePatterns = [
    /\b([a-h][1-8])\b/, // e4, d5
    /\b([KQRBN][a-h][1-8])\b/, // Nf3, Bc4
    /\b([KQRBN]x[a-h][1-8])\b/, // Nxe5, Bxf7
    /\b([a-h]x[a-h][1-8])\b/, // exd5, fxg7
    /\b(O-O(-O)?)\b/, // O-O, O-O-O
    /\b([KQRBN][a-h1-8]?[a-h][1-8])\b/, // Nbd2, R1e7
    /\b([KQRBN][a-h1-8]?x[a-h][1-8])\b/ // Nbxd5, R1xd7
  ];
  
  for (const pattern of movePatterns) {
    const match = response.match(pattern);
    if (match) return match[0];
  }
  
  return null;
}

// Function to extract reasoning from LLM response
function extractReasoning(response: string) {
  if (!response) return null;
  
  // Look for "Reasoning:" followed by text - compatible with older TS versions
  const reasoningIndex = response.indexOf("Reasoning:");
  if (reasoningIndex !== -1) {
    return response.substring(reasoningIndex + "Reasoning:".length).trim();
  }
  
  // If no "Reasoning:" marker is found, try to return everything after the move
  const move = extractMove(response);
  if (move) {
    const afterMove = response.substring(response.indexOf(move) + move.length).trim();
    if (afterMove) {
      return afterMove;
    }
  }
  
  // If all else fails, return the whole response as reasoning
  return response;
}

// Helper function to format SSE messages properly with careful error handling
function formatSseEvent(eventType: string, data: Record<string, unknown> | string) {
  try {
    // Handle undefined/null data
    if (data === undefined || data === null) {
      data = { message: "Empty data" };
    }
    
    // If data is already a string, wrap it in an object
    let jsonData;
    if (typeof data === 'string') {
      jsonData = JSON.stringify({ text: data });
    } else {
      jsonData = JSON.stringify(data);
    }
    
    // The SSE message format requires each line to start with "data: "
    return `event: ${eventType}\ndata: ${jsonData}\n\n`;
  } catch (error) {
    console.error(`Error formatting SSE event ${eventType}:`, error);
    // Return a fallback event that won't cause JSON parsing errors
    return `event: ${eventType}\ndata: {"error":"Failed to format event data"}\n\n`;
  }
}

export async function POST(_req: NextRequest) {
  console.log(`Chess webhook called with POST method ${_req}`);
  
  try {
    // Generate a unique game ID - in a real app, this would be more sophisticated
    const gameId = Date.now().toString();
    
    // Initialize the game state
    activeGames.set(gameId, {
      id: gameId,
      inProgress: true,
      players: ['Llama1', 'Llama2'],
      moves: [],
      responses: {},
      reasonings: {},
      currentPlayerIndex: 0,
      moveCounter: 0
    });
    
    // Return the game ID in headers so the client can use it later
    return new Response(JSON.stringify({ gameId }), {
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error("Error initializing game:", error);
    return new Response(JSON.stringify({ error: "Failed to initialize game" }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
}

export async function GET(_req: NextRequest) {
  console.log(`Chess webhook called with GET method - establishing SSE connection, ${_req}`);
  
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  
  // Function to send events 
  const sendEvent = async (event: string, data: Record<string, unknown> | string) => {
    try {
      const eventString = formatSseEvent(event, data);
      console.log(`Sending event: ${event} with data:`, data);
      await writer.write(new TextEncoder().encode(eventString));
    } catch (error) {
      console.error(`Error sending "${event}" event:`, error);
      // Try to send an error event if possible
      try {
        const errorEvent = formatSseEvent('error', { 
          message: `Internal error while sending ${event} event` 
        });
        await writer.write(new TextEncoder().encode(errorEvent));
      } catch (e) {
        console.error('Failed to send error event:', e);
      }
    }
  };
  
  // Start the chess game
  (async () => {
    try {
      console.log("Setting up new chess game");
      resetBoard(); // Start a new game
      
      // Set up two Llama players with different names
      const players = ['Llama1', 'Llama2'];
      let currentPlayerIndex = 0;
      let illegalMove = false;
      let gameOver = false;
      const moves: string[] = []; // Track moves
      const responses: Record<number, string> = {}; // Track full responses
      const reasonings: Record<number, string> = {}; // Track move reasonings
      
      // First make sure the SSE connection is working by sending a test message
      await sendEvent('connection-test', { message: 'SSE connection established' });
      
      // Wait a moment to ensure the client has received the test message
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Send initial game state
      await sendEvent('game-start', { message: 'Game started', players });
      
      // Wait another moment
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let moveCounter = 0;
      while (!gameOver && !illegalMove && moveCounter < 10) { // Added move counter as safety
        moveCounter++;
        const currentPlayer = players[currentPlayerIndex];
        console.log(`Current moves: ${moves.join(', ')}`);
        console.log(`${currentPlayer}'s turn (move ${moveCounter})`);
        
        // First, send a "thinking" event so the UI can show the player is thinking
        await sendEvent('thinking', { player: currentPlayer });
        
        try {
          // Get move from current Llama player
          const { move, fullResponse, reasoning } = await getMoveFromLlama(moves, currentPlayer);
          
          console.log(`${currentPlayer} response:`, fullResponse);
          responses[moves.length] = fullResponse;
          reasonings[moves.length] = reasoning || "No reasoning provided";
          
          // Send the full response first for display
          await sendEvent('response', { 
            player: currentPlayer, 
            response: fullResponse 
          });
          
          // Send the reasoning separately
          await sendEvent('reasoning', {
            player: currentPlayer,
            reasoning: reasoning || "No reasoning provided"
          });
          
          if (!move) {
            console.log(`${currentPlayer} failed to provide a valid move.`);
            await sendEvent('error', { 
              player: currentPlayer, 
              message: "Invalid Move" 
            });
            break;
          }
          
          console.log(`${currentPlayer} plays: ${move}`);
          
          // Try to make the move
          const isLegal = makeMove(move);
          console.log(`Move ${move} is legal: ${isLegal}`);
          
          if (!isLegal) {
            console.log(`${currentPlayer} made an illegal move: ${move}`);
            illegalMove = true;
            await sendEvent("illegal-move", { player: currentPlayer, move });
            break;
          }
          
          // Add the move to the list
          moves.push(move);
          
          // Check if game is over after the move
          gameOver = !!isGameOver(); // Convert to boolean, whatever the return type is
          console.log(`Game over status: ${gameOver}`);
          
          // Send the validated move
          await sendEvent('move', { 
            player: currentPlayer, 
            move,
            reasoning: reasoning || "No reasoning provided",
            fen: getFen(), // Send current board state too
            moveNumber: moveCounter
          });
          
          // Switch turns
          currentPlayerIndex = (currentPlayerIndex + 1) % 2;
        } catch (error) {
          console.error(`Error during ${currentPlayer}'s turn:`, error);
          await sendEvent('error', { 
            player: currentPlayer, 
            message: "Error processing move: " + (error instanceof Error ? error.message : String(error)) 
          });
          break;
        }
      }
      
      // Determine game result
      let result;
      if (illegalMove) {
        result = `${players[(currentPlayerIndex + 1) % 2]} wins by illegal move`;
      } else if (gameOver) {
        // If there's a winner when the game is over, it's the last player who moved
        result = `Game over: ${players[(currentPlayerIndex + 1) % 2]} wins`;
      } else {
        result = "Game stopped after maximum moves";
      }
      
      console.log(`Game result: ${result}`);
      await sendEvent("game-over", { 
        result, 
        moves, 
        responses,
        reasonings,
        finalFen: getFen()
      });
      
    } catch (error) {
      console.error('Error in chess game:', error);
      try {
        await sendEvent('error', { 
          message: "Game error: " + (error instanceof Error ? error.message : String(error)) 
        });
      } catch (e) {
        console.error('Failed to send error event:', e);
      }
    } finally {
      try {
        await writer.close();
      } catch (e) {
        console.error('Error closing writer:', e);
      }
    }
  })().catch(error => {
    console.error("Unhandled error in game processing:", error);
  });
  
  // Return the readable stream immediately
  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}