import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import rag_service
from routes import rag
from routes import auth

@asynccontextmanager
async def lifespan(app: FastAPI):
    rag_service.load()  # load once at startup
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://rag.turboturismo.com"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(rag.router, prefix="/rag", tags=["RAG"])

@app.get("/health")
async def health():
    return {"status": "ok"}

