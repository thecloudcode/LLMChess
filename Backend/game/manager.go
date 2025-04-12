package game

import (
	"Backend/api"
	"errors"
	"fmt"
	"log"
	"math/rand"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/notnil/chess"
)

type GameStatus string

const (
	InProgress GameStatus = "in_progress"
	Checkmate  GameStatus = "checkmate"
	Stalemate  GameStatus = "stalemate"
	Draw       GameStatus = "draw"
	Error      GameStatus = "error"
)

type MoveRecord struct {
	Player    string    `json:"player"`
	Move      string    `json:"move"`
	Reasoning string    `json:"reasoning"`
	Response  string    `json:"response"`
	Timestamp time.Time `json:"timestamp"`
}

type State struct {
	LLM1          string       `json:"llm1"`
	LLM2          string       `json:"llm2"`
	WhitePlayer   string       `json:"white_player"`
	BlackPlayer   string       `json:"black_player"`
	CurrentPlayer string       `json:"current_player"`
	Board         *chess.Game  `json:"-"`
	Status        GameStatus   `json:"status"`
	Winner        string       `json:"winner"`
	MoveHistory   []MoveRecord `json:"move_history"`
	CreatedAt     time.Time    `json:"created_at"`
	UpdatedAt     time.Time    `json:"updated_at"`
}

type GameSummary struct {
	ID          string     `json:"id"`
	WhitePlayer string     `json:"white_player"`
	BlackPlayer string     `json:"black_player"`
	Status      GameStatus `json:"status"`
	MovesCount  int        `json:"moves_count"`
	Winner      string     `json:"winner"`
	CreatedAt   time.Time  `json:"created_at"`
}

type Manager struct {
	games       map[string]*State
	mutex       sync.RWMutex
	subscribers map[string][]chan struct{}
	subMutex    sync.RWMutex
}

func NewManager() *Manager {
	return &Manager{
		games:       make(map[string]*State),
		subscribers: make(map[string][]chan struct{}),
	}
}

func (m *Manager) CreateGame(llm1, llm2 string) string {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	gameID := uuid.New().String()

	// Randomly assign white and black
	var whitePlayer, blackPlayer string
	if rand.Intn(2) == 0 {
		whitePlayer = llm1
		blackPlayer = llm2
	} else {
		whitePlayer = llm2
		blackPlayer = llm1
	}

	m.games[gameID] = &State{
		LLM1:          llm1,
		LLM2:          llm2,
		WhitePlayer:   whitePlayer,
		BlackPlayer:   blackPlayer,
		CurrentPlayer: whitePlayer, // White always moves first
		Board:         chess.NewGame(),
		Status:        InProgress,
		MoveHistory:   []MoveRecord{},
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	log.Printf("Created new game %s: %s (White) vs %s (Black)", gameID, whitePlayer, blackPlayer)
	return gameID
}

func (m *Manager) GetGame(gameID string) (*State, bool) {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	game, exists := m.games[gameID]
	return game, exists
}

func (m *Manager) PlayNextMove(gameID string) error {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	game, exists := m.games[gameID]
	if !exists {
		return errors.New("game not found")
	}

	if game.Status != InProgress {
		return errors.New("game is already complete")
	}

	// Get the opponent player
	var opponent string
	if game.CurrentPlayer == game.WhitePlayer {
		opponent = game.BlackPlayer
	} else {
		opponent = game.WhitePlayer
	}

	// Generate the prompt for the current player
	prompt := generatePrompt(game, opponent)

	// Call the LLM API
	log.Printf("Requesting move from %s", game.CurrentPlayer)
	response := api.GetResponse(prompt)

	// Parse the response
	move, reasoning, message, err := parseResponse(response)
	if err != nil {
		game.Status = Error
		game.Winner = opponent // If a player makes an invalid response format, they lose
		return err
	}

	// Validate and make the move
	err = m.makeMove(gameID, move, reasoning, message)
	if err != nil {
		// Invalid move means the current player loses
		game.Status = Error
		game.Winner = opponent
		log.Printf("Invalid move by %s: %s", game.CurrentPlayer, err.Error())
		return err
	}

	// Update timestamps
	game.UpdatedAt = time.Now()
	m.notifySubscribers(gameID)
	return nil
}

func (m *Manager) makeMove(gameID, moveStr, reasoning, response string) error {
	game, exists := m.games[gameID]
	if !exists {
		return errors.New("game not found")
	}

	// Parse the move
	move, err := chess.AlgebraicNotation{}.Decode(game.Board.Position(), moveStr)
	if err != nil {
		return fmt.Errorf("invalid move format: %v", err)
	}

	// Validate the move
	validMoves := game.Board.ValidMoves()
	moveIsValid := false
	for _, validMove := range validMoves {
		if validMove.String() == move.String() {
			moveIsValid = true
			break
		}
	}

	if !moveIsValid {
		return fmt.Errorf("illegal move: %s", moveStr)
	}

	// Add move to history
	game.MoveHistory = append(game.MoveHistory, MoveRecord{
		Player:    game.CurrentPlayer,
		Move:      moveStr,
		Reasoning: reasoning,
		Response:  response,
		Timestamp: time.Now(),
	})

	// Make the move
	err = game.Board.Move(move)
	if err != nil {
		return fmt.Errorf("error making move: %v", err)
	}

	// Check game status
	if game.Board.Outcome() != chess.NoOutcome {
		switch game.Board.Outcome() {
		case chess.WhiteWon:
			game.Status = Checkmate
			game.Winner = game.WhitePlayer
		case chess.BlackWon:
			game.Status = Checkmate
			game.Winner = game.BlackPlayer
		case chess.Draw:
			game.Status = Draw
		}
		return nil
	}

	// Switch current player
	if game.CurrentPlayer == game.WhitePlayer {
		game.CurrentPlayer = game.BlackPlayer
	} else {
		game.CurrentPlayer = game.WhitePlayer
	}

	return nil
}

func (m *Manager) EndGame(gameID string, status GameStatus, winner string) {
	m.mutex.Lock()
	defer m.mutex.Unlock()

	game, exists := m.games[gameID]
	if !exists {
		return
	}

	game.Status = status
	game.Winner = winner
	game.UpdatedAt = time.Now()
	m.notifySubscribers(gameID)
}

func (m *Manager) ListGames() map[string]GameSummary {
	m.mutex.RLock()
	defer m.mutex.RUnlock()

	result := make(map[string]GameSummary)
	for id, game := range m.games {
		result[id] = GameSummary{
			ID:          id,
			WhitePlayer: game.WhitePlayer,
			BlackPlayer: game.BlackPlayer,
			Status:      game.Status,
			MovesCount:  len(game.MoveHistory),
			Winner:      game.Winner,
			CreatedAt:   game.CreatedAt,
		}
	}

	return result
}

func generatePrompt(game *State, opponent string) string {
	var sb strings.Builder

	// System instructions
	sb.WriteString("You are playing a game of chess. ")
	if game.CurrentPlayer == game.WhitePlayer {
		sb.WriteString("You are playing as WHITE. ")
	} else {
		sb.WriteString("You are playing as BLACK. ")
	}

	sb.WriteString(fmt.Sprintf("Your opponent is %s. ", opponent))
	sb.WriteString("You must respond with your next move in the following format:\n\n")
	sb.WriteString("MOVE: [your move in algebraic notation, e.g. e4, Nf3, etc.]\n")
	sb.WriteString("REASONING: [your reasoning for making this move]\n")
	sb.WriteString(fmt.Sprintf("RESPONSE: @%s [your message to your opponent]\n\n", opponent))

	// Provide current board state
	sb.WriteString("Current board state (FEN notation):\n")
	sb.WriteString(game.Board.FEN())
	sb.WriteString("\n\n")

	// ASCII representation of the board for better visualization
	sb.WriteString("Board visualization:\n")
	sb.WriteString(game.Board.Position().Board().Draw())
	sb.WriteString("\n\n")

	// Move history
	if len(game.MoveHistory) > 0 {
		sb.WriteString("Move history:\n")
		for i, move := range game.MoveHistory {
			moveNum := i/2 + 1
			if i%2 == 0 {
				sb.WriteString(fmt.Sprintf("%d. %s", moveNum, move.Move))
			} else {
				sb.WriteString(fmt.Sprintf(" %s\n", move.Move))
			}
		}
		if len(game.MoveHistory)%2 != 0 {
			sb.WriteString("\n")
		}
		sb.WriteString("\n")

		// Last move and message
		lastMove := game.MoveHistory[len(game.MoveHistory)-1]
		sb.WriteString(fmt.Sprintf("Last move by %s: %s\n", lastMove.Player, lastMove.Move))
		sb.WriteString(fmt.Sprintf("Message from opponent: %s\n\n", lastMove.Response))
	}

	sb.WriteString("Now, make your next move. Choose the best move according to chess principles. Remember to follow the response format strictly.")

	return sb.String()
}

func parseResponse(response string) (move, reasoning, message string, err error) {
	lines := strings.Split(response, "\n")

	var moveFound, reasoningFound, responseFound bool

	for _, line := range lines {
		line = strings.TrimSpace(line)

		if strings.HasPrefix(line, "MOVE:") {
			moveFound = true
			move = strings.TrimSpace(strings.TrimPrefix(line, "MOVE:"))
		} else if strings.HasPrefix(line, "REASONING:") {
			reasoningFound = true
			reasoning = strings.TrimSpace(strings.TrimPrefix(line, "REASONING:"))
		} else if strings.HasPrefix(line, "RESPONSE:") {
			responseFound = true
			message = strings.TrimSpace(strings.TrimPrefix(line, "RESPONSE:"))
		}
	}

	if !moveFound || !reasoningFound || !responseFound {
		return "", "", "", errors.New("response does not contain required MOVE, REASONING, and RESPONSE sections")
	}

	if move == "" {
		return "", "", "", errors.New("move is empty")
	}

	return move, reasoning, message, nil
}

func (m *Manager) SubscribeToGame(gameID string) chan struct{} {
	m.subMutex.Lock()
	defer m.subMutex.Unlock()

	ch := make(chan struct{}, 1)

	if _, exists := m.subscribers[gameID]; !exists {
		m.subscribers[gameID] = []chan struct{}{}
	}

	m.subscribers[gameID] = append(m.subscribers[gameID], ch)
	return ch
}
func (m *Manager) UnsubscribeFromGame(gameID string, ch chan struct{}) {
	m.subMutex.Lock()
	defer m.subMutex.Unlock()

	subs, exists := m.subscribers[gameID]
	if !exists {
		return
	}

	for i, sub := range subs {
		if sub == ch {
			m.subscribers[gameID] = append(subs[:i], subs[i+1:]...)
			close(ch)
			break
		}
	}
}
func (m *Manager) notifySubscribers(gameID string) {
	m.subMutex.RLock()
	subs, exists := m.subscribers[gameID]
	m.subMutex.RUnlock()

	if !exists {
		return
	}

	for _, ch := range subs {
		select {
		case ch <- struct{}{}:
		default:
			// Channel buffer is full, skip
		}
	}
}
