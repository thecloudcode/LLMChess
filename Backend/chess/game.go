package chess

import (
	"bufio"
	"fmt"
	"os"
	"os/exec"
	"strings"
	"sync"
	//"sync"
	//"github.com/joho/godotenv"
)

func NewStockfish() (*Stockfish, error) {
	cmd := exec.Command(os.Getenv("STOCKFISH_PATH"))
	if cmd.Path == "" {
		return nil, fmt.Errorf("STOCKFISH_PATH environment variable not set")
	}

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, err
	}

	stdin, err := cmd.StdinPipe()
	if err != nil {
		return nil, err
	}

	scanner := bufio.NewScanner(stdout)
	if err := cmd.Start(); err != nil {
		return nil, err
	}

	sf := &Stockfish{
		cmd:    cmd,
		stdin:  bufio.NewWriter(stdin),
		stdout: scanner,
		mu:     sync.Mutex{},
	}

	sf.SendCommand("uci")
	sf.WaitForUciOk() // Wait for UCI initialization
	sf.SendCommand("isready")
	sf.WaitForReadyOk() // Wait for engine to be ready

	return sf, nil
}

func (s *Stockfish) SendCommand(cmd string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	fmt.Fprintln(s.stdin, cmd)
	s.stdin.Flush()
}

// Wait for "uciok" response
func (s *Stockfish) WaitForUciOk() {
	for s.stdout.Scan() {
		line := s.stdout.Text()
		if line == "uciok" {
			break
		}
	}
}

// Wait for "readyok" response
func (s *Stockfish) WaitForReadyOk() {
	for s.stdout.Scan() {
		line := s.stdout.Text()
		if line == "readyok" {
			break
		}
	}
}

func (s *Stockfish) ReadResponse() string {
	s.mu.Lock()
	defer s.mu.Unlock()
	var res string
	for s.stdout.Scan() {
		line := s.stdout.Text()
		if strings.HasPrefix(line, "bestmove") {
			res = line
			break
		}
	}
	return res
}

func (s *Stockfish) GetBestMove(fen string) string {
	// Fix position command syntax
	if strings.HasPrefix(fen, "startpos") {
		s.SendCommand("position " + fen)
	} else {
		s.SendCommand("position fen " + fen)
	}

	s.SendCommand("go depth 10 movetime 1000") // Limit depth and time for faster response
	return s.ReadResponse()
}

func (s *Stockfish) Close() {
	s.SendCommand("quit")
	s.cmd.Wait()
}
