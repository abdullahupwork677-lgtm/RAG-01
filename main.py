from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import rag_service
from routes import rag

@asynccontextmanager
async def lifespan(app: FastAPI):
    rag_service.load()  # load once at startup
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Register Routes ───────────────────────────────────────
app.include_router(rag.router, prefix="/rag", tags=["RAG"])
# app.include_router(auth.router, prefix="/auth", tags=["Auth"])  # add more later

@app.get("/health")
async def health():
    return {"status": "ok"}

