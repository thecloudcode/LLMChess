import requests
import time
from typing import Dict, Any
from prettytable import PrettyTable
import chess
import os
import json
from bson import ObjectId


# Custom JSON encoder to handle MongoDB ObjectId
class MongoJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        return super().default(obj)


class ChessTestClient:
    def __init__(self, base_url="http://localhost:8000"):
        """Initialize the test client with the API base URL."""
        self.base_url = base_url
        self.game_id = None
        self.board = chess.Board()

    def create_game(self, white_llm: str, black_llm: str, white_personality: str, black_personality: str) -> Dict[
        str, Any]:
        """Create a new chess game."""
        url = f"{self.base_url}/api/games"
        payload = {
            "white_llm": white_llm,
            "black_llm": black_llm,
            "white_personality": white_personality,
            "black_personality": black_personality
        }

        try:
            response = requests.post(url, json=payload)
            response_data = response.json()

            if response.status_code == 200:
                self.game_id = response_data["game_id"]
                print(f"Game created successfully with ID: {self.game_id}")
                print(f"White: {white_llm} ({white_personality})")
                print(f"Black: {black_llm} ({black_personality})")
            else:
                print(f"Failed to create game: {response_data}")

            return response_data
        except requests.exceptions.ConnectionError:
            print("ERROR: Could not connect to the server!")
            print("Please make sure the FastAPI server is running and accessible at the specified URL.")
            return None

    def play_move(self) -> Dict[str, Any]:
        """Request the next move to be played."""
        if not self.game_id:
            print("No active game. Create a game first.")
            return None

        url = f"{self.base_url}/api/games/{self.game_id}/move"
        try:
            response = requests.post(url)
            response_data = response.json()

            if response.status_code == 200:
                print(f"Move processing status: {response_data['status']}")
            else:
                print(f"Failed to process move: {response_data}")

            return response_data
        except requests.exceptions.ConnectionError:
            print("ERROR: Could not connect to the server!")
            return None

    def get_game_state(self) -> Dict[str, Any]:
        """Get the current state of the game."""
        if not self.game_id:
            print("No active game. Create a game first.")
            return None

        url = f"{self.base_url}/api/games/{self.game_id}"
        try:
            response = requests.get(url)

            if response.status_code == 200:
                # Parse response data manually to handle ObjectId
                game_data = json.loads(response.text, strict=False)
                return game_data
            else:
                print(f"Failed to get game state: {response.text}")
                return None
        except requests.exceptions.ConnectionError:
            print("ERROR: Could not connect to the server!")
            return None
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
            print(f"Response text: {response.text[:200]}...")  # Show the first 200 chars
            return None

    def display_ascii_board(self, fen: str = None):
        """Display the current board state in ASCII format."""
        if fen:
            try:
                self.board = chess.Board(fen)
            except ValueError as e:
                print(f"Invalid FEN string: {e}")
                return

        # For terminal display, print ASCII representation
        print("\nCurrent Board State:")
        print(self.board)
        print(f"\nFEN: {self.board.fen()}")

        # Print move status
        turn = "White" if self.board.turn else "Black"
        print(f"Current turn: {turn}")

        # Print check status
        if self.board.is_check():
            print(f"{turn} is in CHECK")

        # Print game status
        if self.board.is_checkmate():
            print("CHECKMATE")
        elif self.board.is_stalemate():
            print("STALEMATE")
        elif self.board.is_insufficient_material():
            print("DRAW (Insufficient material)")

    def display_moves(self, moves):
        """Display the move history in a table."""
        if not moves:
            print("\nNo moves recorded yet.")
            return

        table = PrettyTable()
        table.field_names = ["Move #", "Player", "Move", "Resulting Position"]

        for move in moves:
            # Handle potentially missing fields
            move_num = move.get("number", "?")
            player = move.get("player", "?").capitalize()
            move_text = move.get("move", "?")
            fen = move.get("fen", "?")

            table.add_row([
                move_num,
                player,
                move_text,
                fen[:30] + "..." if len(fen) > 30 else fen
            ])

        print("\nMove History:")
        print(table)

    def display_thoughts(self, thoughts):
        """Display the LLM's thoughts."""
        if not thoughts:
            print("\nNo thoughts recorded yet.")
            return

        for thought in thoughts:
            print(f"\n{thought.get('player', '?').upper()} PLAYER'S THOUGHTS (Move #{thought.get('number', '?')}):")
            print("=" * 80)
            print(thought.get("thoughts", "No thoughts recorded"))
            print("=" * 80)

    def display_dialogues(self, dialogues):
        """Display the LLM's dialogue."""
        if not dialogues:
            print("\nNo dialogues recorded yet.")
            return

        for dialogue in dialogues:
            print(f"\n{dialogue.get('player', '?').upper()} PLAYER'S DIALOGUE (Move #{dialogue.get('number', '?')}):")
            print("-" * 80)
            print(dialogue.get("dialogue", "No dialogue recorded"))
            print("-" * 80)

    def poll_until_move_complete(self, interval=3, max_attempts=20):
        """Poll the game state until the move is complete."""
        attempts = 0
        last_move_count = 0

        while attempts < max_attempts:
            game_state = self.get_game_state()
            if not game_state:
                return None

            current_move_count = len(game_state.get("moves", []))

            if current_move_count > last_move_count:
                print(f"Move completed! (Attempt {attempts + 1})")
                return game_state

            print(f"Waiting for move to complete... (Attempt {attempts + 1})")
            time.sleep(interval)
            attempts += 1
            last_move_count = current_move_count

        print("Timed out waiting for move to complete.")
        return None

    def auto_play(self, moves=100, interval=3):
        """Automatically play a sequence of moves."""
        for i in range(moves):
            print(f"\n{'=' * 30} MOVE {i + 1} {'=' * 30}")

            # Request the next move
            self.play_move()

            # Wait for the move to be processed
            game_state = self.poll_until_move_complete(interval=interval)

            if not game_state:
                print("Failed to get updated game state after move.")
                return

            # Display the updated board
            self.display_ascii_board(game_state.get("fen", ""))

            # Display move history
            self.display_moves(game_state.get("moves", []))

            # Display thoughts and dialogues
            self.display_thoughts(game_state.get("latest_thoughts", []))
            self.display_dialogues(game_state.get("latest_dialogues", []))

            # Check if the game is over
            if game_state.get("is_game_over", False):
                print(f"\nGAME OVER! Result: {game_state.get('result', 'Unknown')}")
                break

    def run_demo(self):
        """Run a demo of the chess battle."""
        # Create a new game
        game_data = self.create_game(
            white_llm="deepseek",
            black_llm="llama",
            white_personality="Aggressive, risk-taking grandmaster",
            black_personality="Methodical, defensive strategic player"
        )

        if not game_data:
            print("Failed to create game. Exiting demo.")
            return

        # Auto-play 10 moves
        self.auto_play(moves=10)

    def run_mock_demo(self):
        """Run a demo with mock data (no server connection required)"""
        self.game_id = "mock-game-id"
        print("Running MOCK demo (no server connection required)")
        print("White: deepseek (Aggressive, risk-taking grandmaster)")
        print("Black: llama (Methodical, defensive strategic player)")

        # Create a mock game with sample moves
        sample_moves = [
            {"number": 1, "player": "white", "move": "e2e4",
             "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"},
            {"number": 2, "player": "black", "move": "e7e5",
             "fen": "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2"}
        ]

        sample_thoughts = [
            {"number": 1, "player": "white",
             "thoughts": "I'll start with the King's Pawn opening to control the center. This gives me good control of the d5 and f5 squares and allows for rapid development of my kingside pieces. It's an aggressive opening that sets the tone for my attacking style."},
            {"number": 2, "player": "black",
             "thoughts": "I'll mirror with e5 to contest the center and aim for an even position. This classic response prevents White from establishing a strong pawn center and gives me equal opportunities for piece development. It's a methodical approach that should lead to balanced chances."}
        ]

        sample_dialogues = [
            {"number": 1, "player": "white",
             "dialogue": "Let's start aggressively and see how you respond! I'm opening with the King's Pawn, a direct thrust into the center!"},
            {"number": 2, "player": "black",
             "dialogue": "A classic opening. I'll respond methodically and look for strategic opportunities. I'll counter with the symmetric response, maintaining balance while I assess your intentions."}
        ]

        # Display the mock game
        for i in range(2):
            print(f"\n{'=' * 30} MOVE {i + 1} {'=' * 30}")
            move = sample_moves[i]
            self.display_ascii_board(move["fen"])
            self.display_moves(sample_moves[:i + 1])
            self.display_thoughts([sample_thoughts[i]])
            self.display_dialogues([sample_dialogues[i]])


if __name__ == "__main__":
    # Modify this URL if your server is running on a different host or port
    server_url = "http://localhost:8000"

    # You can also pass the URL as a command line argument
    import sys

    if len(sys.argv) > 1:
        if sys.argv[1] == "--mock":
            # Run with mock data (no server needed)
            client = ChessTestClient()
            client.run_mock_demo()
            sys.exit(0)
        else:
            server_url = sys.argv[1]

    print(f"Connecting to server at: {server_url}")
    client = ChessTestClient(base_url=server_url)

    try:
        client.run_demo()
    except Exception as e:
        print(f"\nERROR: {type(e).__name__}: {e}")
        print("\nTrying mock demo instead...\n")
        client.run_mock_demo()