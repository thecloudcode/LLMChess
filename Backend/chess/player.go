package chess

import (
	"bufio"
	"os/exec"
	"sync"
)

type Stockfish struct {
	cmd    *exec.Cmd
	stdin  *bufio.Writer
	stdout *bufio.Scanner
	mu     sync.Mutex // Added missing mutex field
}
