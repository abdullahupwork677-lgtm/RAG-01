from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import rag_service

router = APIRouter()

class QueryRequest(BaseModel):
    question: str

@router.post("/ask")
async def ask(request: QueryRequest):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")
    return rag_service.ask(request.question.strip())