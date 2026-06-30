# Archive — RAG Chat System

A full-stack **Retrieval-Augmented Generation (RAG)** application that lets you ask natural-language questions against your own documents. Uses semantic search to retrieve relevant context and answers via a large language model — no hallucination, no training required.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Archive                                  │
│                                                                 │
│  ┌─────────────────────────┐     ┌─────────────────────────────┐│
│  │     Backend (FastAPI)   │     │  Frontend (Next.js 16)      ││
│  │                         │     │                             ││
│  │  POST /rag/ask ────────┼─────┼► lib/api.ts                 ││
│  │  GET  /health           │     │                             ││
│  │                         │     │  app/page.tsx               ││
│  │  rag_service.py         │     │  components/                ││
│  │   ├─ ChromaDB (vector)  │     │   ├─ ChatMessage.tsx        ││
│  │   ├─ SentenceTransform  │     │   ├─ ChatInput.tsx          ││
│  │   └─ Groq (LLM)        │     │   └─ SourceList.tsx         ││
│  │                         │     │                             ││
│  │  ingest.py ──► docs/    │     │  Tailwind CSS v4            ││
│  │                         │     │  TypeScript                 ││
│  └─────────────────────────┘     └─────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

| Layer | Technology | Role |
|-------|-----------|------|
| **Vector Store** | ChromaDB | Stores document chunk embeddings locally |
| **Embeddings** | Sentence Transformers (`all-MiniLM-L6-v2`) | Converts text chunks to 384-dim vectors |
| **LLM** | Groq (`llama-3.1-8b-instant`) | Generates grounded answers from retrieved context |
| **API** | FastAPI | Serves the RAG pipeline over HTTP |
| **Frontend** | Next.js 16 + React 19 | Chat UI with source citations |

## Project Structure

```
Basic-Rag/                          ← Backend (this repo)
├── main.py                         FastAPI entry point
├── rag_service.py                  RAG pipeline (embed → retrieve → generate)
├── ingest.py                       Document ingestion script
├── query.py                        CLI query tool (alternative to API)
├── routes/rag.py                   API route definitions
├── docs/                           Place your PDFs and .txt files here
├── chroma_db/                      Vector database (auto-generated, gitignored)
├── requirements.txt
├── .env / .env.example
└── .gitignore

rag-chat-frontend/rag-chat-frontend/  ← Frontend (separate project)
├── app/page.tsx                    Chat screen
├── app/layout.tsx                  Root layout with fonts
├── app/globals.css                 Tailwind + custom design tokens
├── components/
│   ├── ChatMessage.tsx             Message bubble with sources
│   ├── ChatInput.tsx               Auto-growing textarea
│   └── SourceList.tsx              Collapsible source citations
├── lib/
│   ├── api.ts                      Backend API client
│   └── types.ts                    Shared TypeScript types
├── .env.local / .env.local.example
└── package.json
```

## Quick Start

### 1. Backend

```bash
cd Basic-Rag

python -m venv .venv
.venv\Scripts\activate     # Windows
pip install -r requirements.txt

cp .env.example .env
# Edit .env — set your Groq API key:
#   GROQ_API_KEY=gsk_...
```

**Ingest documents** (PDF or TXT):

```bash
# Place files in docs/ first, then:
python ingest.py
```

**Start the API server**:

```bash
python -m uvicorn main:app --reload
```

The API runs at `http://localhost:8000`.  
Try it: `curl http://localhost:8000/health`

### 2. Frontend

```bash
cd frontend

npm install
cp .env.local.example .env.local
# Edit if your backend isn't at localhost:8000

npm run dev
```

Open `http://localhost:3000`.

## API

### `POST /rag/ask`

```json
// Request
{ "question": "What is the policy on leaves?" }

// Response
{
  "answer": "The policy allows 15 days of annual leave per year...",
  "sources": ["HR_Policy_Document.pdf"]
}
```

### `GET /health`

```json
{ "status": "ok" }
```

## Key Features

- **Grounding** — Answers are generated exclusively from retrieved document chunks; the LLM is instructed to say "I don't know" if the context is insufficient.
- **Semantic chunking** — Documents are split into overlapping chunks (500 chars, 50 overlap) to preserve context boundaries.
- **Local vector store** — ChromaDB runs persistantly on disk; no external database needed.
- **Fast inference** — Groq's LPU hardware delivers sub-second LLM response times.
- **Responsive UI** — Clean, typography-focused chat interface with collapsible source citations and smooth animations.
