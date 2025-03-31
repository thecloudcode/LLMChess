package handlers

import (
	"Backend/server"
	"encoding/json"
	"fmt"
	"github.com/gorilla/websocket"
	"net/http"
	"strings"
)

// Message structs for client communication
type ServerResponse struct {
	Moves   string `json:"moves"`
	Fen     string `json:"fen"`
	Status  string `json:"status"`
	Message string `json:"message"`
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func HandleWebSocketConnection(chessServer *server.ChessServer, w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("WebSocket upgrade error:", err)
		http.Error(w, "Failed to upgrade WebSocket", http.StatusInternalServerError)
		return
	}
	defer conn.Close()

	// Send initial message
	initialResp := ServerResponse{
		Fen:     "startpos",
		Status:  "ready",
		Message: "Game initialized. Press Start to begin the game.",
	}

	err = conn.WriteJSON(initialResp)
	if err != nil {
		fmt.Println("Failed to send initial message:", err)
		return
	}

	for {
		// Read message from client
		_, message, err := conn.ReadMessage()
		if err != nil {
			fmt.Println("WebSocket read error:", err)
			break
		}

		// Print raw message for debugging
		fmt.Printf("Received raw message: %s\n", string(message))

		// Get the client action from the message
		clientAction := strings.TrimSpace(string(message))

		// Try to parse as JSON if it starts with {
		if strings.HasPrefix(clientAction, "{") {
			var jsonMsg map[string]string
			if err := json.Unmarshal(message, &jsonMsg); err == nil {
				if action, ok := jsonMsg["action"]; ok {
					clientAction = action
				}
			}
		}

		fmt.Println("Processed action:", clientAction)

		// Handle different actions
		var response ServerResponse

		switch clientAction {
		case "play":
			// Play the game and get the response
			gameResult := chessServer.PlayGame()

			response = ServerResponse{
				Moves:   gameResult,
				Fen:     chessServer.GameFen,
				Status:  "ok",
				Message: gameResult,
			}

		default:
			// Treat any unknown command as "play" for simplicity
			gameResult := chessServer.PlayGame()

			response = ServerResponse{
				Moves:   gameResult,
				Fen:     chessServer.GameFen,
				Status:  "ok",
				Message: gameResult,
			}
		}

		// Send response to WebSocket client
		err = conn.WriteJSON(response)
		if err != nil {
			fmt.Println("WebSocket write error:", err)
			break
		}
	}
}
