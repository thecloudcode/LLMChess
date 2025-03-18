import os

from fastapi import FastAPI, HTTPException, BackgroundTasks
import motor.motor_asyncio

app = FastAPI(title="LLMChess")

client = motor.motor_asyncio.AsyncIOMotorClient(os.environ.get("MONGODB_URL"))