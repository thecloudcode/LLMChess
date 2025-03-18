import os
import motor.motor_asyncio
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()
MONGO_URL = os.environ.get("MONGODB_URL")

client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URL)
db = client.llm_chess

games_collection = db.games
moves_collection = db.moves
thoughts_collection = db.thoughts
dialogues_collection = db.dialogues

class GameRequest(BaseModel):
    game_id: str
    player: str

def convert(doc):
    doc["_id"] = str(doc["_id"])
    return doc

@app.post("/add_game/")
async def add_game(game_id: str, player: str):
    game_data = {"game_id": game_id, "player": player}
    result = await games_collection.insert_one(game_data)
    return {"message": "Game added!", "id": str(result.inserted_id)}

@app.get("/games/")
async def get_games():
    games_cursor = games_collection.find({})
    games_list = await games_cursor.to_list(None)
    return [convert(game) for game in games_list]
