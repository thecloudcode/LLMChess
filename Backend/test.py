# from fastapi import FastAPI
# from database import games_collection
#
# app = FastAPI()
#
# @app.post("/add_game/")
# async def add_game(game_id: str, player: str):
#     game_data = {"game_id": game_id, "player": player}
#     result = await games_collection.insert_one(game_data)
#     return {"message": "Game added!", "id": str(result.inserted_id)}
#
# @app.get("/games/")
# async def get_games():
#     games = await games_collection.find().to_list(100)
#     return {"games": games}


# from fastapi.testclient import TestClient
# from app import app
# import pytest
#
# client = TestClient(app)
#
# def test_create_game():
#     response = client.post(
#         "/api/games",
#         json={
#             "white_llm": "deepseek",
#             "black_llm": "llama",
#             "white_personality": "aggressive",
#             "black_personality": "defensive"
#         }
#     )
#     print(f"Status code: {response.status_code}")
#     print(f"Response JSON: {response.json()}")
#     assert response.status_code == 200
#     assert "game_id" in response.json()

#
# import requests
# import time
# from typing import Dict, Any
# from prettytable import PrettyTable
# import chess
# import os
#
#
# class ChessTestClient:
#     def __init__(self, base_url="http://localhost:8000"):
#         """Initialize the test client with the API base URL."""
#         self.base_url = base_url
#         self.game_id = None
#         self.board = chess.Board()
#
#     def create_game(self, white_llm: str, black_llm: str, white_personality: str, black_personality: str) -> Dict[
#         str, Any]:
#         """Create a new chess game."""
#         url = f"{self.base_url}/api/games"
#         payload = {
#             "white_llm": white_llm,
#             "black_llm": black_llm,
#             "white_personality": white_personality,
#             "black_personality": black_personality
#         }
#
#         response = requests.post(url, json=payload)
#         response_data = response.json()
#
#         if response.status_code == 200:
#             self.game_id = response_data["game_id"]
#             print(f"Game created successfully with ID: {self.game_id}")
#             print(f"White: {white_llm} ({white_personality})")
#             print(f"Black: {black_llm} ({black_personality})")
#         else:
#             print(f"Failed to create game: {response_data}")
#
#         return response_data
#
#     def play_move(self) -> Dict[str, Any]:
#         """Request the next move to be played."""
#         if not self.game_id:
#             print("No active game. Create a game first.")
#             return None
#
#         url = f"{self.base_url}/api/games/{self.game_id}/move"
#         response = requests.post(url)
#         response_data = response.json()
#
#         if response.status_code == 200:
#             print(f"Move processing status: {response_data['status']}")
#         else:
#             print(f"Failed to process move: {response_data}")
#
#         return response_data
#
#     def get_game_state(self) -> Dict[str, Any]:
#         """Get the current state of the game."""
#         if not self.game_id:
#             print("No active game. Create a game first.")
#             return None
#
#         url = f"{self.base_url}/api/games/{self.game_id}"
#         response = requests.get(url)
#
#         if response.status_code == 200:
#             game_data = response.json()
#             return game_data
#         else:
#             print(f"Failed to get game state: {response.text}")
#             return None
#
#     def display_ascii_board(self, fen: str = None):
#         """Display the current board state in ASCII format."""
#         if fen:
#             self.board = chess.Board(fen)
#
#         # For terminal display, print ASCII representation
#         print("\nCurrent Board State:")
#         print(self.board)
#         print(f"\nFEN: {self.board.fen()}")
#
#         # Print move status
#         turn = "White" if self.board.turn else "Black"
#         print(f"Current turn: {turn}")
#
#         # Print check status
#         if self.board.is_check():
#             print(f"{turn} is in CHECK")
#
#         # Print game status
#         if self.board.is_checkmate():
#             print("CHECKMATE")
#         elif self.board.is_stalemate():
#             print("STALEMATE")
#         elif self.board.is_insufficient_material():
#             print("DRAW (Insufficient material)")
#
#     def display_moves(self, moves):
#         """Display the move history in a table."""
#         table = PrettyTable()
#         table.field_names = ["Move #", "Player", "Move", "Resulting Position"]
#
#         for move in moves:
#             table.add_row([
#                 move["number"],
#                 move["player"].capitalize(),
#                 move["move"],
#                 move["fen"][:30] + "..." if len(move["fen"]) > 30 else move["fen"]
#             ])
#
#         print("\nMove History:")
#         print(table)
#
#     def display_thoughts(self, thoughts):
#         """Display the LLM's thoughts."""
#         for thought in thoughts:
#             print(f"\n{thought['player'].upper()} PLAYER'S THOUGHTS (Move #{thought['number']}):")
#             print("=" * 80)
#             print(thought["thoughts"])
#             print("=" * 80)
#
#     def display_dialogues(self, dialogues):
#         """Display the LLM's dialogue."""
#         for dialogue in dialogues:
#             print(f"\n{dialogue['player'].upper()} PLAYER'S DIALOGUE (Move #{dialogue['number']}):")
#             print("-" * 80)
#             print(dialogue["dialogue"])
#             print("-" * 80)
#
#     def poll_until_move_complete(self, interval=3, max_attempts=20):
#         """Poll the game state until the move is complete."""
#         attempts = 0
#         last_move_count = 0
#
#         while attempts < max_attempts:
#             game_state = self.get_game_state()
#             if not game_state:
#                 return None
#
#             current_move_count = len(game_state.get("moves", []))
#
#             if current_move_count > last_move_count:
#                 print(f"Move completed! (Attempt {attempts + 1})")
#                 return game_state
#
#             print(f"Waiting for move to complete... (Attempt {attempts + 1})")
#             time.sleep(interval)
#             attempts += 1
#             last_move_count = current_move_count
#
#         print("Timed out waiting for move to complete.")
#         return None
#
#     def auto_play(self, moves=10, interval=3):
#         """Automatically play a sequence of moves."""
#         for i in range(moves):
#             print(f"\n{'=' * 30} MOVE {i + 1} {'=' * 30}")
#
#             # Request the next move
#             self.play_move()
#
#             # Wait for the move to be processed
#             game_state = self.poll_until_move_complete(interval=interval)
#
#             if not game_state:
#                 print("Failed to get updated game state after move.")
#                 return
#
#             # Display the updated board
#             self.display_ascii_board(game_state["fen"])
#
#             # Display move history
#             self.display_moves(game_state["moves"])
#
#             # Display thoughts and dialogues
#             self.display_thoughts(game_state["latest_thoughts"])
#             self.display_dialogues(game_state["latest_dialogues"])
#
#             # Check if the game is over
#             if game_state.get("is_game_over", False):
#                 print(f"\nGAME OVER! Result: {game_state.get('result', 'Unknown')}")
#                 break
#
#     def run_demo(self):
#         """Run a demo of the chess battle."""
#         # Create a new game
#         self.create_game(
#             white_llm="deepseek",
#             black_llm="llama",
#             white_personality="Aggressive, risk-taking grandmaster",
#             black_personality="Methodical, defensive strategic player"
#         )
#
#         # Auto-play 10 moves
#         self.auto_play(moves=10)
#
#
# if __name__ == "__main__":
#     client = ChessTestClient()
#     client.run_demo()