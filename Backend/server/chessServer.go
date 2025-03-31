package server

import (
	"Backend/chess"
	"fmt"
	"strings"
	"sync"
)

type ChessServer struct {
	Engine1  *chess.Stockfish
	Engine2  *chess.Stockfish
	GameFen  string
	MoveList []string
	Mu       sync.Mutex
}

func NewChessServer() (*ChessServer, error) {
	engine1, err := chess.NewStockfish()
	if err != nil {
		return nil, err
	}
	engine2, err := chess.NewStockfish()
	if err != nil {
		engine1.Close()
		return nil, err
	}

	return &ChessServer{
		Engine1:  engine1,
		Engine2:  engine2,
		GameFen:  "startpos",
		MoveList: []string{},
	}, nil
}

func (s *ChessServer) PlayGame() string {
	// Ensure the ChessServer is properly initialized
	if s == nil || s.Engine1 == nil || s.Engine2 == nil {
		return "Error: Chess Server not initialized"
	}

	s.Mu.Lock() // Thread-safe access
	defer s.Mu.Unlock()

	// Engine 1 plays
	moveOutput1 := s.Engine1.GetBestMove(s.GameFen)
	move1 := extractMove(moveOutput1)
	fmt.Println("Engine 1 move:", move1)

	if move1 == "" {
		return "Error: Engine 1 failed to produce a valid move"
	}

	// Add move to move list
	s.MoveList = append(s.MoveList, move1)

	// Update position
	s.GameFen = applyMove(s.GameFen, move1)

	if isGameOver(s.GameFen) {
		return "Game Over! Engine 1 Wins!"
	}

	// Engine 2 plays
	moveOutput2 := s.Engine2.GetBestMove(s.GameFen)
	move2 := extractMove(moveOutput2)
	fmt.Println("Engine 2 move:", move2)

	if move2 == "" {
		return "Error: Engine 2 failed to produce a valid move"
	}

	// Add move to move list
	s.MoveList = append(s.MoveList, move2)

	// Update position
	s.GameFen = applyMove(s.GameFen, move2)

	if isGameOver(s.GameFen) {
		return "Game Over! Engine 2 Wins!"
	}

	return fmt.Sprintf("Engine 1: %s, Engine 2: %s", move1, move2)
}

// Extract actual move from Stockfish output (e.g., "bestmove e2e4 ponder d7d5")
func extractMove(output string) string {
	parts := strings.Split(output, " ")
	if len(parts) >= 2 && parts[0] == "bestmove" {
		return parts[1]
	}
	return ""
}

// Implement proper move application
func applyMove(fen, move string) string {
	// For startpos format
	if strings.HasPrefix(fen, "startpos") {
		if !strings.Contains(fen, "moves") {
			return "startpos moves " + move
		} else {
			return fen + " " + move
		}
	}

	// For regular FEN format (would need actual chess logic implementation)
	// For now, just append the move to track history
	return fen + " " + move
}

// Implement proper game over check (would need actual chess logic)
func isGameOver(fen string) bool {
	// Count the number of moves
	movesCount := 0
	if strings.Contains(fen, "moves") {
		movesArr := strings.Split(fen, "moves ")
		if len(movesArr) > 1 {
			movesCount = len(strings.Split(movesArr[1], " "))
		}
	}

	// For demonstration, end the game after 30 moves (15 per side)
	// In a real implementation, you would check for checkmate, stalemate, etc.
	return movesCount >= 30
}
