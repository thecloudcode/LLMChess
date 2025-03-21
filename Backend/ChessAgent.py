import json
from typing import Dict, Any, Tuple, Optional, List
import chess
import random
from llm import create_llm_provider
import re


class ChessAgent:
    """Agent for playing chess with an LLM backend"""

    def __init__(self, model_name: str, personality: str, is_white: bool):
        self.model_name = model_name
        self.personality = personality
        self.is_white = is_white
        self.color = "white" if is_white else "black"
        self.llm_provider = create_llm_provider(model_name)

    async def generate_thoughts(self,
                                board: chess.Board,
                                move_history: list,
                                opponent_dialogue: Optional[str] = None) -> str:
        """Generate thoughts about the current position"""
        # Convert the board to a visual representation
        board_visual = str(board)
        # Create a more readable move history with numbering
        formatted_history = self._format_move_history(move_history)
        # Get legal moves with algebraic notation for better understanding
        legal_moves = self._get_legal_moves_with_notation(board)

        # Prepare the prompt
        prompt = f"""
        You are playing chess as {self.personality} with the {self.color} pieces.

        Current board position:
        {board_visual}

        Legal moves available (in UCI format): {', '.join([move.uci() for move in board.legal_moves])}
        Legal moves with algebraic notation: {legal_moves}

        Game history:
        {formatted_history}

        {"Your opponent just said: " + opponent_dialogue if opponent_dialogue else ""}

        Think through your strategy carefully. Consider:
        1. The current board position
        2. Possible threats from your opponent
        3. Your attacking opportunities
        4. Long-term strategic goals
        5. Several moves ahead

        Provide your detailed thought process as you analyze the position.
        Don't decide on a move yet, just think through the possibilities.
        """

        # Generate thoughts
        thoughts = await self.llm_provider.generate_response(prompt)
        return thoughts

    async def generate_move(self,
                            board: chess.Board,
                            move_history: list,
                            thoughts: str,
                            opponent_dialogue: Optional[str] = None,
                            opponent_name: str = "Opponent") -> Tuple[str, str]:
        """Generate a move and dialogue based on thoughts"""
        # Convert the board to a visual representation
        board_visual = str(board)
        # Create a more readable move history with numbering
        formatted_history = self._format_move_history(move_history)
        # Get legal moves with algebraic notation for better understanding
        legal_moves_with_notation = self._get_legal_moves_with_notation(board)
        # Get UCI format moves for validation
        legal_uci_moves = [move.uci() for move in board.legal_moves]

        # Create a structured example of expected output
        example_move = random.choice(list(board.legal_moves)) if board.legal_moves else None
        example_output = {
            "move": example_move.uci() if example_move else "e2e4",
            "dialogue": "This is where your dialogue goes."
        }

        # Prepare the prompt
        prompt = f"""
        You are playing chess as {self.personality} with the {self.color} pieces against {opponent_name}.

        Current board position:
        {board_visual}

        Legal moves available (in UCI format): {', '.join(legal_uci_moves)}
        Legal moves with algebraic notation: {legal_moves_with_notation}

        Game history:
        {formatted_history}

        {"Your opponent just said: " + opponent_dialogue if opponent_dialogue else ""}

        You've already analyzed the position with these thoughts:
        {thoughts}

        Now, choose your next move from the LEGAL MOVES LIST ONLY and respond with a JSON object exactly as follows:
        ```json
        {json.dumps(example_output, indent=2)}
        ```

        IMPORTANT: Your "move" MUST be one of these exact legal UCI format moves: {', '.join(legal_uci_moves)}
        DO NOT invent moves or use moves not in this list, as they will be rejected.
        Your dialogue should reflect your personality as {self.personality}.
        """

        # Generate move and dialogue
        response = await self.llm_provider.generate_response(prompt)

        # Extract JSON from the response
        json_match = re.search(r"```json\s*([\s\S]*?)\s*```", response)
        if json_match:
            response = json_match.group(1).strip()

        try:
            # Parse the response as JSON
            data = json.loads(response)
            move = data.get("move", "")
            dialogue = data.get("dialogue", "I make my move.")

            # Validate the move is legal
            if move not in legal_uci_moves:
                # If invalid, select a random legal move
                print(f"Warning: LLM proposed illegal move '{move}'. Selecting random legal move instead.")
                move = random.choice(legal_uci_moves) if legal_uci_moves else ""

            return move, dialogue

        except (json.JSONDecodeError, KeyError) as e:
            print(f"Error parsing LLM response: {str(e)}")
            print(f"Raw response: {response}")

            # Fallback: Extract move from the text
            for legal_move in legal_uci_moves:
                if legal_move in response:
                    dialogue = "I make this move."
                    return legal_move, dialogue

            # Last resort: Choose random legal move
            move = random.choice(legal_uci_moves) if legal_uci_moves else ""
            dialogue = "I make my move."
            return move, dialogue

    def _format_move_history(self, move_history: List[str]) -> str:
        """Format move history in a readable way with numbering"""
        if not move_history:
            return "No moves played yet."

        formatted = []
        for i in range(0, len(move_history), 2):
            move_num = i // 2 + 1
            white_move = move_history[i] if i < len(move_history) else ""
            black_move = move_history[i + 1] if i + 1 < len(move_history) else ""

            # Try to convert UCI to algebraic notation if board state was available
            formatted.append(f"{move_num}. {white_move} {black_move}".strip())

        return "\n".join(formatted)

    def _get_legal_moves_with_notation(self, board: chess.Board) -> str:
        """Get legal moves with algebraic notation for better understanding"""
        legal_moves = []
        for move in board.legal_moves:
            uci = move.uci()
            san = board.san(move)
            piece = board.piece_at(move.from_square)
            piece_name = "Pawn" if piece.piece_type == chess.PAWN else chess.piece_name(piece.piece_type)

            # Add additional context for the move
            legal_moves.append(f"{uci} ({san}, {piece_name})")

        return ", ".join(legal_moves)


class ChessGame:
    """Manages a chess game between two LLM agents"""

    def __init__(self, white_config: Dict[str, Any], black_config: Dict[str, Any]):
        self.board = chess.Board()
        self.white_agent = ChessAgent(
            model_name=white_config["model_name"],
            personality=white_config["personality"],
            is_white=True
        )
        self.black_agent = ChessAgent(
            model_name=black_config["model_name"],
            personality=black_config["personality"],
            is_white=False
        )
        self.move_history = []
        self.dialogue_history = []
        self.thought_history = []
        self.position_history = [self.board.fen()]

    async def play_turn(self) -> Dict[str, Any]:
        """Play a single turn of the chess game"""
        if self.board.is_game_over():
            return {
                "status": "game_over",
                "result": self.board.result(),
                "reason": self._get_game_over_reason(),
                "fen": self.board.fen()
            }

        # Determine the current player
        is_white_turn = self.board.turn == chess.WHITE
        current_agent = self.white_agent if is_white_turn else self.black_agent
        opponent_agent = self.black_agent if is_white_turn else self.white_agent

        # Get the last dialogue from the opponent, if available
        opponent_dialogue = None
        if self.dialogue_history:
            opponent_dialogue = self.dialogue_history[-1]["dialogue"]

        # Generate thoughts
        thoughts = await current_agent.generate_thoughts(
            self.board,
            self.move_history,
            opponent_dialogue
        )

        # Store the thoughts
        self.thought_history.append({
            "player": "white" if is_white_turn else "black",
            "thoughts": thoughts
        })

        # Generate move and dialogue
        move, dialogue = await current_agent.generate_move(
            self.board,
            self.move_history,
            thoughts,
            opponent_dialogue,
            opponent_name=opponent_agent.personality
        )

        # Make the move if valid
        try:
            if not move:
                return {
                    "status": "error",
                    "error": "No valid move generated",
                    "fen": self.board.fen()
                }

            chess_move = chess.Move.from_uci(move)
            if chess_move not in self.board.legal_moves:
                return {
                    "status": "error",
                    "error": f"Move {move} is not legal in current position",
                    "fen": self.board.fen()
                }

            self.board.push(chess_move)
            self.move_history.append(move)
            self.position_history.append(self.board.fen())

            # Store the dialogue
            self.dialogue_history.append({
                "player": "white" if is_white_turn else "black",
                "dialogue": dialogue
            })

            # Check for draw by repetition or 50-move rule
            is_repetition = self._check_threefold_repetition()

            return {
                "status": "success",
                "move": move,
                "thoughts": thoughts,
                "dialogue": dialogue,
                "fen": self.board.fen(),
                "is_check": self.board.is_check(),
                "is_checkmate": self.board.is_checkmate(),
                "is_stalemate": self.board.is_stalemate(),
                "is_repetition": is_repetition,
                "is_fifty_moves": self.board.is_fifty_moves(),
                "is_game_over": self.board.is_game_over(),
                "result": self.board.result() if self.board.is_game_over() else None
            }

        except ValueError as e:
            return {
                "status": "error",
                "error": f"Invalid move format: {str(e)}",
                "fen": self.board.fen()
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "fen": self.board.fen()
            }

    def _check_threefold_repetition(self) -> bool:
        """Check if the current position has occurred three times"""
        current_fen = self.board.fen().split(' ')[0]  # Only consider piece positions
        position_count = 0

        for fen in self.position_history:
            if fen.split(' ')[0] == current_fen:
                position_count += 1

        return position_count >= 3

    def _get_game_over_reason(self) -> str:
        """Get the reason why the game is over"""
        if self.board.is_checkmate():
            return "checkmate"
        elif self.board.is_stalemate():
            return "stalemate"
        elif self.board.is_insufficient_material():
            return "insufficient material"
        elif self.board.is_fifty_moves():
            return "fifty-move rule"
        elif self.board.can_claim_threefold_repetition():
            return "threefold repetition"
        else:
            return "unknown"