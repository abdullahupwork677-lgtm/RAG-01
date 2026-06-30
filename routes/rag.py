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
    try:
        return rag_service.ask(request.question.strip())
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))