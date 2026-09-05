import os
from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
import rag_service
import ingest

router = APIRouter()

DOCS_FOLDER = "docs"

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

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    allowed = {".pdf", ".txt"}
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{ext}' not supported. Upload PDF or TXT files.",
        )

    os.makedirs(DOCS_FOLDER, exist_ok=True)
    save_path = os.path.join(DOCS_FOLDER, file.filename)

    content = await file.read()
    with open(save_path, "wb") as f:
        f.write(content)

    try:
        result = ingest.ingest()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {e}")

    try:
        rag_service.reload_collection()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Collection reload failed: {e}")

    return {
        "filename": file.filename,
        "size": len(content),
        **result,
    }

@router.get("/documents")
async def list_documents():
    if not os.path.exists(DOCS_FOLDER):
        return {"documents": []}
    files = []
    for f in os.listdir(DOCS_FOLDER):
        if f.endswith((".pdf", ".txt")):
            path = os.path.join(DOCS_FOLDER, f)
            files.append({"name": f, "size": os.path.getsize(path)})
    return {"documents": files}
