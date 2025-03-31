package stockfish

import (
	"bufio"
	"fmt"
	"os/exec"
	"strings"
)

func Findbestmove(moves []string) string {

	uciMoves := strings.Join(moves, " ")

	cmd := exec.Command("stockfish")
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
