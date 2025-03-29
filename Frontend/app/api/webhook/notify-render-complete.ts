import { NextRequest } from 'next/server';

// Global variable to track render completion status
interface RenderState {
  lastCompletedMove: number;
  waitingForRender: boolean;
}

// Store for all active games - in a real app, this would be in a database
const renderStates = new Map<string, RenderState>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { moveCount, gameId = 'default' } = body;
    
    console.log(`Received render completion notification for move #${moveCount}, game ${gameId}`);
    
    if (!renderStates.has(gameId)) {
      renderStates.set(gameId, {
        lastCompletedMove: 0,
        waitingForRender: false
      });
    }
    
    const state = renderStates.get(gameId)!;
    
    // Update the last completed move
    state.lastCompletedMove = moveCount;
    state.waitingForRender = false;
    
    console.log(`Updated render state: ${JSON.stringify(state)}`);
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Error processing render notification:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to process render notification",
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Helper function to check if we're waiting for a render
export function setWaitingForRender(gameId: string = 'default') {
  if (!renderStates.has(gameId)) {
    renderStates.set(gameId, {
      lastCompletedMove: 0,
      waitingForRender: true
    });
  } else {
    const state = renderStates.get(gameId)!;
    state.waitingForRender = true;
  }
}

// Helper function to wait for render to complete
export async function waitForRenderComplete(gameId: string = 'default', moveNumber: number): Promise<void> {
  if (!renderStates.has(gameId)) {
    renderStates.set(gameId, {
      lastCompletedMove: 0,
      waitingForRender: true
    });
  }
  
  const state = renderStates.get(gameId)!;
  
  console.log(`Checking render state for move #${moveNumber}, current state:`, state);
  
  // If we're not waiting for render or this move has already been rendered, continue immediately
  if (!state.waitingForRender || state.lastCompletedMove >= moveNumber) {
    console.log(`No need to wait for render, continuing`);
    return;
  }
  
  // Wait for the render to complete with a timeout
  console.log(`Waiting for render to complete for move #${moveNumber}`);
  const TIMEOUT_MS = 10000; // 10 seconds timeout
  const POLL_INTERVAL_MS = 100; // Check every 100ms
  
  return new Promise((resolve, _reject) => {
    const startTime = Date.now();
    
    const checkRenderStatus = () => {
      const state = renderStates.get(gameId)!;
      
      // Render is complete if we're not waiting anymore or the completed move number is high enough
      if (!state.waitingForRender || state.lastCompletedMove >= moveNumber) {
        console.log(`Render complete for move #${moveNumber}`);
        resolve();
        return;
      }
      
      // Check for timeout
      if (Date.now() - startTime > TIMEOUT_MS) {
        console.warn(`Timed out waiting for render completion of move #${moveNumber}`);
        state.waitingForRender = false; // Reset the waiting state to avoid deadlock
        resolve(); // Resolve anyway to continue the game
        return;
      }
      
      // Check again later
      setTimeout(checkRenderStatus, POLL_INTERVAL_MS);
    };
    
    checkRenderStatus();
  });
}