package stockfish

import (
	"bufio"
	"fmt"
	"os"
	"os/exec"
	"strings"
)

func ensureExecutable(path string) {
	err := os.Chmod(path, 0755) // rwxr-xr-x
	if err != nil {
		panic("Failed to make Stockfish executable: " + err.Error())
	}
}

func Findbestmove(moves []string) string {

	uciMoves := strings.Join(moves, " ")
	stockfishPath := os.Getenv("STOCKFISH_PATH")
	ensureExecutable(stockfishPath)

	if stockfishPath == "" {
		panic("STOCKFISH_PATH not set")
	}
	cmd := exec.Command(stockfishPath)
	stdin, _ := cmd.StdinPipe()
	stdout, _ := cmd.StdoutPipe()
	cmd.Start()

	reader := bufio.NewScanner(stdout)

	fmt.Fprintln(stdin, "uci")
	fmt.Fprintln(stdin, "isready")
	fmt.Fprintln(stdin, "ucinewgame")
	fmt.Fprintln(stdin, "position startpos moves "+uciMoves)
	fmt.Fprintln(stdin, "go depth 20")
	stdin.Close()

	for reader.Scan() {
		line := reader.Text()
		if strings.HasPrefix(line, "bestmove") {
			fields := strings.Fields(line)
			if len(fields) > 1 {
				return fields[1]
			}
		}
	}

	cmd.Wait()
	return ""
}

func Research(moves []string) []string {
	var futureMoves []string
	currentMoves := append([]string{}, moves...)

	for i := 0; i < 5; i++ {
		bestMove := Findbestmove(currentMoves)
		if bestMove == "" {
			break
		}
		futureMoves = append(futureMoves, bestMove)
		currentMoves = append(currentMoves, bestMove)
	}

	return futureMoves
}
