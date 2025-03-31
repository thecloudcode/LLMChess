package main

import (
	"Backend/handlers"
	"Backend/server"
	"Backend/stockfish"
	"log"
	"os"

	//"bufio"
	"fmt"
	//"github.com/gorilla/websocket"
	"net/http"
	//"os"
	//"os/exec"
	"strings"
	//"time"
	"github.com/joho/godotenv"
)

func getResponseStockfishLLM() {
	moves := []string{"e2e4"}
	firstMove := stockfish.Findbestmove(moves)
	res := append(moves, stockfish.Research(moves)...)

	prompt := fmt.Sprintf(
		"You are an excellent chess player. These are the series of moves played in the chess game: %s. "+
			"Stockfish suggested the move: %s, and predicts this to be the next 5 moves ahead: %s. "+
			"Summarize in one line why stockfish suggested that move and just output the summarization",
		strings.Join(moves, ", "),
		firstMove,
		strings.Join(res, ", "),
	)

	fmt.Println(prompt)
	//ress := api.GetResponse(prompt)
	//fmt.Println(ress)

}

func startGame() {

	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: Error loading .env file:", err)
	}
	
	if os.Getenv("STOCKFISH_PATH") == "" {
		log.Fatal("STOCKFISH_PATH environment variable must be set")
	}

	// Create chess server
	chessServer, err := server.NewChessServer()
	if err != nil {
		log.Fatalf("Failed to initialize chess server: %v", err)
	}

	// Serve static files (assuming you have an 'index.html' in the 'static' directory)
	http.Handle("/", http.FileServer(http.Dir("./static")))

	// WebSocket endpoint
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		handlers.HandleWebSocketConnection(chessServer, w, r)
	})

	// Start server
	port := "9090"
	fmt.Println("Chess server listening on port " + port + "...")
	fmt.Println("Access the application at http://localhost:" + port)

	err = http.ListenAndServe(":"+port, nil)
	if err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}

func startServer() {

	//port := 8080
	//chatServer := server.NewChatServer()
	//
	//http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
	//	handlers.HandleWebSocketConnection(chatServer, w, r)
	//})
	//
	//fmt.Printf("Websocket server listening on port %d\n", port)
	//http.ListenAndServe(fmt.Sprintf(":%d", port), nil)
}

func main() {
	startGame()
}
