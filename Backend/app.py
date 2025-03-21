from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from crewai import Agent, Task, Crew, Process
import chess
import uuid
from datetime import datetime
from database import games_collection, moves_collection, thoughts_collection, dialogues_collection
import asyncio
import json
from bson import ObjectId

from ChessAgent import ChessGame

app = FastAPI(title="LLM Chess")

active_games = {}


class MongoJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)


class MongoJSONResponse(JSONResponse):
    def render(self, content: Any) -> bytes:
        return json.dumps(
            content,
            ensure_ascii=False,
            allow_nan=False,
            cls=MongoJSONEncoder,
        ).encode("utf-8")


# Models
class GameCreate(BaseModel):
    white_llm: str
    black_llm: str
    white_personality: str
    black_personality: str


class GameResponse(BaseModel):
    game_id: str
    status: str
    message: Optional[str] = None


# Helper function to convert MongoDB documents to dict with string IDs
def serialize_mongo_doc(doc):
    if doc is None:
        return None

    result = {}
    for key, value in doc.items():
        if key == "_id":
            result["id"] = str(value)
        else:
            if isinstance(value, ObjectId):
                result[key] = str(value)
            elif isinstance(value, datetime):
                result[key] = value.isoformat()
            else:
                result[key] = value
    return result


@app.post("/api/games", response_model=GameResponse)
async def create_game(game_data: GameCreate):
    """Create a new chess game"""
    game_id = str(uuid.uuid4())

    white_config = {
        "model_name": game_data.white_llm,
        "personality": game_data.white_personality
    }

    black_config = {
        "model_name": game_data.black_llm,
        "personality": game_data.black_personality
    }

    game = ChessGame(white_config, black_config)
    active_games[game_id] = game

    # Store in database
    await games_collection.insert_one({
        "game_id": game_id,
        "white_llm": game_data.white_llm,
        "black_llm": game_data.black_llm,
        "white_personality": game_data.white_personality,
        "black_personality": game_data.black_personality,
        "status": "created",
        "created_at": datetime.now(),
        "fen": game.board.fen()
    })

    return {
        "game_id": game_id,
        "status": "created",
        "message": "Game created successfully"
    }


@app.post("/api/games/{game_id}/move")
async def play_move(game_id: str, background_tasks: BackgroundTasks):
    """Play the next move in the game"""
    if game_id not in active_games:
        # Try to load from database
        game_data = await games_collection.find_one({"game_id": game_id})
        if not game_data:
            raise HTTPException(status_code=404, detail="Game not found")

        # Recreate the game
        white_config = {
            "model_name": game_data["white_llm"],
            "personality": game_data["white_personality"]
        }

        black_config = {
            "model_name": game_data["black_llm"],
            "personality": game_data["black_personality"]
        }

        game = ChessGame(white_config, black_config)
        active_games[game_id] = game

        # Load the moves
        moves = await moves_collection.find({"game_id": game_id}).sort("number", 1).to_list(None)
        for move_data in moves:
            try:
                move = chess.Move.from_uci(move_data["move"])
                game.board.push(move)
                game.move_history.append(move_data["move"])
            except Exception as e:
                print(f"Error loading move: {str(e)}")

    game = active_games[game_id]

    # Process the move in the background
    background_tasks.add_task(process_move, game_id)

    return {
        "status": "processing",
        "message": "Move is being processed"
    }


async def process_move(game_id: str):
    """Process the next move in the chess game"""
    game = active_games[game_id]

    try:
        # Play the turn
        result = await game.play_turn()

        # Store the move
        if result["status"] == "success":
            move_number = len(game.move_history)
            is_white = (move_number % 2 == 1)

            # Store the move
            await moves_collection.insert_one({
                "game_id": game_id,
                "number": move_number,
                "player": "white" if is_white else "black",
                "move": result["move"],
                "fen": result["fen"],
                "timestamp": datetime.now()
            })

            # Store the thoughts
            await thoughts_collection.insert_one({
                "game_id": game_id,
                "number": move_number,
                "player": "white" if is_white else "black",
                "thoughts": result["thoughts"],
                "timestamp": datetime.now()
            })

            # Store the dialogue
            await dialogues_collection.insert_one({
                "game_id": game_id,
                "number": move_number,
                "player": "white" if is_white else "black",
                "dialogue": result["dialogue"],
                "timestamp": datetime.now()
            })

            # Update the game status
            await games_collection.update_one(
                {"game_id": game_id},
                {"$set": {
                    "fen": result["fen"],
                    "is_game_over": result["is_game_over"],
                    "result": result["result"] if result["is_game_over"] else None,
                    "updated_at": datetime.now()
                }}
            )
    except Exception as e:
        print(f"Error processing move: {str(e)}")
        await games_collection.update_one(
            {"game_id": game_id},
            {"$set": {
                "status": "error",
                "error": str(e),
                "updated_at": datetime.now()
            }}
        )


@app.get("/api/games/{game_id}", response_class=MongoJSONResponse)
async def get_game(game_id: str):
    """Get the current state of a game"""
    game_data = await games_collection.find_one({"game_id": game_id})
    if not game_data:
        raise HTTPException(status_code=404, detail="Game not found")

    # Get the moves
    moves = await moves_collection.find({"game_id": game_id}).sort("number", 1).to_list(None)
    serialized_moves = [serialize_mongo_doc(move) for move in moves]

    # Get the latest thoughts
    latest_thoughts = await thoughts_collection.find({"game_id": game_id}).sort("number", -1).limit(2).to_list(None)
    serialized_thoughts = [serialize_mongo_doc(thought) for thought in latest_thoughts]

    # Get the latest dialogues
    latest_dialogues = await dialogues_collection.find({"game_id": game_id}).sort("number", -1).limit(2).to_list(None)
    serialized_dialogues = [serialize_mongo_doc(dialogue) for dialogue in latest_dialogues]

    # Serialize the main game data
    serialized_game = serialize_mongo_doc(game_data)

    response_data = {
        **serialized_game,
        "moves": serialized_moves,
        "latest_thoughts": serialized_thoughts,
        "latest_dialogues": serialized_dialogues
    }

    return response_data


@app.get("/api/games", response_class=MongoJSONResponse)
async def list_games():
    """List all games"""
    games = await games_collection.find().sort("created_at", -1).to_list(None)
    serialized_games = [serialize_mongo_doc(game) for game in games]
    return serialized_games


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)