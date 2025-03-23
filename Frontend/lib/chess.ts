import { Chess, Move } from "chess.js";


// Create a chess instance
const chess = new Chess();

// Get the current board state in FEN notation
export function getFen(): string {
  return chess.fen();
}

// Attempt to make a move
export function makeMove(move: string): boolean {
  try {
    const result: Move | null = chess.move(move);
    return result !== null;
  } catch (error) {
    console.error('Invalid move:', error);
    return false;
  }
}

// Get legal moves from current board state
export function getLegalMoves(): string[] {
  return chess.moves();
}

// Reset the board to the starting position
export function resetBoard(): void {
  chess.reset();
}

// ✅ Use 'game_over()' instead of 'isGameOver()'
export function isGameOver(): boolean {
  return chess.isGameOver(); // Fix applied here
}

// Display the board state in ASCII format (optional for debugging)
export function printBoard(): void {
  console.log(chess.ascii());
}
