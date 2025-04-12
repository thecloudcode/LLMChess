// static/app.js
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const llm1Input = document.getElementById('llm1');
    const llm2Input = document.getElementById('llm2');
    const startGameBtn = document.getElementById('start-game');
    const gamesContainer = document.getElementById('games-container');
    const gameView = document.getElementById('game-view');
    const gameIdSpan = document.getElementById('game-id');
    const whitePlayerSpan = document.getElementById('white-player');
    const blackPlayerSpan = document.getElementById('black-player');
    const gameStatusSpan = document.getElementById('game-status');
    const currentPlayerSpan = document.getElementById('current-player');
    const chessBoard = document.getElementById('chess-board');
    const moveHistory = document.getElementById('move-history');
    const playMoveBtn = document.getElementById('play-move');
    const backToListBtn = document.getElementById('back-to-list');

    // Current active game ID
    let activeGameId = null;

    // Fetch and display games list
    function fetchGames() {
        fetch('/games')
            .then(response => response.json())
            .then(games => {
                gamesContainer.innerHTML = '';

                if (Object.keys(games).length === 0) {
                    gamesContainer.innerHTML = '<p>No active games. Start a new game!</p>';
                    return;
                }

                const gamesList = document.createElement('ul');
                gamesList.className = 'games-list';

                for (const [id, game] of Object.entries(games)) {
                    const listItem = document.createElement('li');
                    listItem.className = 'game-item';

                    let statusClass = '';
                    switch (game.status) {
                        case 'in_progress': statusClass = 'status-in-progress'; break;
                        case 'checkmate': statusClass = 'status-checkmate'; break;
                        case 'draw': statusClass = 'status-draw'; break;
                        case 'error': statusClass = 'status-error'; break;
                    }

                    listItem.innerHTML = `
                        <div class="game-summary">
                            <div class="game-players">${game.white_player} (White) vs ${game.black_player} (Black)</div>
                            <div class="game-meta">
                                <span class="game-date">${new Date(game.created_at).toLocaleString()}</span>
                                <span class="game-status ${statusClass}">${formatStatus(game.status)}</span>
                                ${game.winner ? `<span class="game-winner">Winner: ${game.winner}</span>` : ''}
                            </div>
                        </div>
                        <button class="view-game" data-id="${id}">View Game</button>
                    `;
                    gamesList.appendChild(listItem);
                }

                gamesContainer.appendChild(gamesList);

                // Add event listeners to view buttons
                document.querySelectorAll('.view-game').forEach(button => {
                    button.addEventListener('click', function() {
                        const gameId = this.getAttribute('data-id');
                        viewGame(gameId);
                    });
                });
            })
            .catch(error => {
                console.error('Error fetching games:', error);
                gamesContainer.innerHTML = '<p>Error loading games. Please try again.</p>';
            });
    }

    // Format game status for display
    function formatStatus(status) {
        switch (status) {
            case 'in_progress': return 'In Progress';
            case 'checkmate': return 'Checkmate';
            case 'stalemate': return 'Stalemate';
            case 'draw': return 'Draw';
            case 'error': return 'Error';
            default: return status;
        }
    }

    // View a specific game
    function viewGame(gameId) {
        fetch(`/game/${gameId}`)
            .then(response => response.json())
            .then(game => {
                activeGameId = gameId;

                // Update game info
                gameIdSpan.textContent = gameId;
                whitePlayerSpan.textContent = game.moves.length > 0 ?
                    (game.moves[0].player === game.current_player ? game.current_player : getOpponent(game)) :
                    'Unknown';
                blackPlayerSpan.textContent = game.moves.length > 0 ?
                    (game.moves[0].player !== game.current_player ? game.current_player : getOpponent(game)) :
                    'Unknown';
                gameStatusSpan.textContent = formatStatus(game.status);
                currentPlayerSpan.textContent = game.current_player;

                // Display board
                chessBoard.textContent = game.board;

                // Display move history
                displayMoveHistory(game.moves);

                // Show game view, hide games list
                document.getElementById('setup-game').style.display = 'none';
                document.getElementById('game-list').style.display = 'none';
                gameView.style.display = 'block';

                // Disable play button if game is complete
                playMoveBtn.disabled = game.status !== 'in_progress';
            })
            .catch(error => {
                console.error('Error fetching game:', error);
                alert('Error loading game. Please try again.');
            });
    }

    // Helper to get opponent name
    function getOpponent(game) {
        if (game.moves.length < 2) return 'Unknown';

        for (let i = 1; i < game.moves.length; i++) {
            if (game.moves[i].player !== game.moves[i-1].player) {
                return game.moves[i].player;
            }
        }

        return 'Unknown';
    }

    // Display move history
    function displayMoveHistory(moves) {
        moveHistory.innerHTML = '';

        if (moves.length === 0) {
            moveHistory.innerHTML = '<p>No moves yet.</p>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'moves-table';

        // Header row
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>#</th>
                <th>Player</th>
                <th>Move</th>
                <th>Reasoning</th>
                <th>Response</th>
            </tr>
        `;
        table.appendChild(thead);

        // Body rows
        const tbody = document.createElement('tbody');
        moves.forEach((move, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${move.player}</td>
                <td><strong>${move.move}</strong></td>
                <td>${move.reasoning}</td>
                <td>${move.response}</td>
            `;
            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        moveHistory.appendChild(table);
    }

    // Event listeners
    startGameBtn.addEventListener('click', function() {
        const llm1 = llm1Input.value.trim();
        const llm2 = llm2Input.value.trim();

        if (!llm1 || !llm2) {
            alert('Please enter names for both LLMs');
            return;
        }

        fetch('/new-game', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                llm1: llm1,
                llm2: llm2
            })
        })
            .then(response => response.json())
            .then(data => {
                alert(`Game created! ID: ${data.game_id}`);
                llm1Input.value = '';
                llm2Input.value = '';
                fetchGames();
            })
            .catch(error => {
                console.error('Error creating game:', error);
                alert('Error creating game. Please try again.');
            });
    });

    playMoveBtn.addEventListener('click', function() {
        if (!activeGameId) return;

        this.disabled = true;
        this.textContent = 'Playing move...';

        fetch(`/play-move/${activeGameId}`, {
            method: 'POST'
        })
            .then(response => response.json())
            .then(game => {
                // Update game display
                gameStatusSpan.textContent = formatStatus(game.status);
                currentPlayerSpan.textContent = game.current_player;
                chessBoard.textContent = game.board;
                displayMoveHistory(game.moves);

                // Enable button if game still in progress
                playMoveBtn.disabled = game.status !== 'in_progress';
                playMoveBtn.textContent = 'Play Next Move';
            })
            .catch(error => {
                console.error('Error playing move:', error);
                alert('Error playing move. Please try again.');
                playMoveBtn.disabled = false;
                playMoveBtn.textContent = 'Play Next Move';
            });
    });

    backToListBtn.addEventListener('click', function() {
        activeGameId = null;
        gameView.style.display = 'none';
        document.getElementById('setup-game').style.display = 'block';
        document.getElementById('game-list').style.display = 'block';
        fetchGames();
    });

    // Initial load
    fetchGames();
});