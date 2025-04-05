package api

import (
	"Backend/stockfish"
	"encoding/json"
	"net/http"
	"strings"
)

type ChessRequest struct {
	Moves []string `json:"moves"`
}

type ChessResponse struct {
	BestMove    string   `json:"best_move"`
	Line        []string `json:"line"`
	Explanation string   `json:"explanation"`
}

func StockfishLLMHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}
	var req ChessRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	bestMove := stockfish.Findbestmove(req.Moves)
	line := stockfish.Research(req.Moves)
	prompt := "The current chess position has the following moves: " +
		strings.Join(req.Moves, " ") +
		". The engine recommends the next move: " + bestMove +
		". Explain why this move is good and the idea behind the next few moves: " +
		strings.Join(line, " ")
	explanation := GetResponse(prompt)

	resp := ChessResponse{
		BestMove:    bestMove,
		Line:        line,
		Explanation: explanation,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
