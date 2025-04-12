// main.go
package main

import (
	//"Backend/api"
	"Backend/game"
	"encoding/json"
	"fmt"
	"github.com/gorilla/mux" // Make sure this is installed
	"github.com/rs/cors"
	"log"
	"net/http"
	"time"
)

type GameRequest struct {
	LLM1 string `json:"llm1"`
	LLM2 string `json:"llm2"`
}

type MoveResponse struct {
	GameID        string            `json:"game_id"`
	CurrentPlayer string            `json:"current_player"`
	LastMove      string            `json:"last_move,omitempty"`
	Board         string            `json:"board"`
	Status        string            `json:"status"`
	Winner        string            `json:"winner,omitempty"`
	Moves         []game.MoveRecord `json:"moves"`
}

var gameManager *game.Manager

func main() {
	//http.HandleFunc("/api/chess", api.StockfishLLMHandler)
	//
	//log.Println("Chess server listening on port 8080...")
	//err := http.ListenAndServe(":8080", nil)
	//if err != nil {
	//	log.Fatal("Server failed:", err)
	//}
	log.Println("Starting Chess LLM Battle Server...")
	gameManager = game.NewManager()

	r := mux.NewRouter()
	r.HandleFunc("/new-game", newGameHandler).Methods("POST")
	r.HandleFunc("/game/{id}", getGameHandler).Methods("GET")
	r.HandleFunc("/play-move/{id}", playMoveHandler).Methods("POST")
	r.HandleFunc("/games", listGamesHandler).Methods("GET")
	r.HandleFunc("/game-updates/{id}", gameUpdatesHandler).Methods("GET")

	// Serve static files for the frontend
	r.PathPrefix("/").Handler(http.FileServer(http.Dir("./static")))

	// Enable CORS
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"}, // Replace "*" with your frontend URL in production
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type"},
		AllowCredentials: true,
	})
	
	handler := c.Handler(r)

	port := "8080"
	log.Printf("Server running on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}

func gameUpdatesHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	gameID := vars["id"]

	// Check if game exists
	_, exists := gameManager.GetGame(gameID)
	if !exists {
		http.Error(w, "Game not found", http.StatusNotFound)
		return
	}

	// Set headers for SSE
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// Create a channel to receive game updates
	updateChan := gameManager.SubscribeToGame(gameID)

	// Send initial game state
	gameState, _ := gameManager.GetGame(gameID)
	response := prepareMoveResponse(gameID, gameState)

	data, _ := json.Marshal(response)
	fmt.Fprintf(w, "data: %s\n\n", data)
	w.(http.Flusher).Flush()

	// Keep connection open and send updates
	for {
		select {
		case <-r.Context().Done():
			gameManager.UnsubscribeFromGame(gameID, updateChan)
			return
		case <-updateChan:
			gameState, exists := gameManager.GetGame(gameID)
			if !exists {
				return
			}

			response := prepareMoveResponse(gameID, gameState)
			data, _ := json.Marshal(response)

			fmt.Fprintf(w, "data: %s\n\n", data)
			w.(http.Flusher).Flush()
		}
	}
}

func newGameHandler(w http.ResponseWriter, r *http.Request) {
	var req GameRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.LLM1 == "" || req.LLM2 == "" {
		http.Error(w, "Both LLM1 and LLM2 must be specified", http.StatusBadRequest)
		return
	}

	gameID := gameManager.CreateGame(req.LLM1, req.LLM2)

	// Start the game
	go playGame(gameID)

	resp := map[string]string{
		"game_id": gameID,
		"message": fmt.Sprintf("New game created between %s and %s", req.LLM1, req.LLM2),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func getGameHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	gameID := vars["id"]

	gameState, exists := gameManager.GetGame(gameID)
	if !exists {
		http.Error(w, "Game not found", http.StatusNotFound)
		return
	}

	response := prepareMoveResponse(gameID, gameState)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func playMoveHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	gameID := vars["id"]

	gameState, exists := gameManager.GetGame(gameID)
	if !exists {
		http.Error(w, "Game not found", http.StatusNotFound)
		return
	}

	if gameState.Status != game.InProgress {
		http.Error(w, "Game is already complete", http.StatusBadRequest)
		return
	}

	// Trigger next move
	err := gameManager.PlayNextMove(gameID)
	if err != nil {
		http.Error(w, "Error playing move: "+err.Error(), http.StatusInternalServerError)
		return
	}

	gameState, _ = gameManager.GetGame(gameID)
	response := prepareMoveResponse(gameID, gameState)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func listGamesHandler(w http.ResponseWriter, r *http.Request) {
	games := gameManager.ListGames()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(games)
}

func prepareMoveResponse(gameID string, gameState *game.State) MoveResponse {
	var lastMove string
	if len(gameState.MoveHistory) > 0 {
		lastMoveRecord := gameState.MoveHistory[len(gameState.MoveHistory)-1]
		lastMove = lastMoveRecord.Move
	}

	return MoveResponse{
		GameID:        gameID,
		CurrentPlayer: gameState.CurrentPlayer,
		LastMove:      lastMove,
		Board:         gameState.Board.String(),
		Status:        string(gameState.Status),
		Winner:        gameState.Winner,
		Moves:         gameState.MoveHistory,
	}
}

func playGame(gameID string) {
	gameState, exists := gameManager.GetGame(gameID)
	if !exists {
		log.Printf("Game %s not found", gameID)
		return
	}

	// First move is by White
	err := gameManager.PlayNextMove(gameID)
	if err != nil {
		log.Printf("Error playing first move for game %s: %v", gameID, err)
		return
	}

	// Continue playing moves automatically until game is finished
	for {
		gameState, exists = gameManager.GetGame(gameID)
		if !exists || gameState.Status != game.InProgress {
			break
		}

		// Add a small delay to prevent overwhelming the LLM API
		time.Sleep(2 * time.Second)

		err = gameManager.PlayNextMove(gameID)
		if err != nil {
			log.Printf("Error playing move for game %s: %v", gameID, err)
			gameManager.EndGame(gameID, game.Error, "Error: "+err.Error())
			break
		}
	}
}
