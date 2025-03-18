from fastapi import FastAPI
from database import games_collection

app = FastAPI()

@app.post("/add_game/")
async def add_game(game_id: str, player: str):
    game_data = {"game_id": game_id, "player": player}
    result = await games_collection.insert_one(game_data)
    return {"message": "Game added!", "id": str(result.inserted_id)}

@app.get("/games/")
async def get_games():
    games = await games_collection.find().to_list(100)
    return {"games": games}
