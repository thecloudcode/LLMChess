from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from typing import List
from threading import Lock
import asyncio

app = FastAPI()

shared_data = ["apple", "banana", "cherry", "date", "elderberry"]
data_lock = Lock()

active_connections: List[WebSocket] = []

async def broadcast_data(data):
    for connection in active_connections:
        await connection.send_json({"message":data})

async def getValue(index: int):
    await asyncio.sleep(1)
    with data_lock:
        if index<0 or index>=len(shared_data):
            raise IndexError("Index out of range")
        return shared_data[index]

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        active_connections.remove(websocket)

@app.post("/endpoint1/")
async def endpoint1(message:str):
    with data_lock:
        shared_data["messages"].append(f"Endpoint1: {message}")
    await broadcast_data()
    return {"status": "Message from endpoint1 added"}

