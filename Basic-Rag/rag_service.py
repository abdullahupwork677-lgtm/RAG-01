import os
from dotenv import load_dotenv
import chromadb
from sentence_transformers import SentenceTransformer
from groq import Groq

load_dotenv()

# ─── Config ───────────────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY not set. Add it to your .env file.")

# Model routing: pick GROQ_FAST_MODEL for quick/simple questions and
# GROQ_PRO_MODEL for complex/analytical ones. Both default to the same
# model so it works out of the box; override in .env to enable routing.
GROQ_FAST_MODEL = os.getenv("GROQ_FAST_MODEL", "openai/gpt-oss-20b")
GROQ_PRO_MODEL  = os.getenv("GROQ_PRO_MODEL", "openai/gpt-oss-20b")

COLLECTION_NAME = "my_docs"
TOP_K           = 8
# ──────────────────────────────────────────────────────────

_COMPLEX_MARKERS = (
    "explain", "compare", "difference", "analyze", "summarize", "evaluate",
    "relationship", "impact", "cause", "why does", "how does", "what are the main",
    "pros and cons", "advantages", "disadvantages", "implications",
)


def _is_complex(question: str) -> bool:
    lowered = question.lower()
    if len(question) > 90:
        return True
    return any(marker in lowered for marker in _COMPLEX_MARKERS)


model = None
collection = None


def load():
    global model, collection
    model = SentenceTransformer("all-MiniLM-L6-v2")
    client = chromadb.PersistentClient(path="./chroma_db")
    try:
        collection = client.get_collection(COLLECTION_NAME)
    except Exception:
        collection = client.create_collection(COLLECTION_NAME)


def reload_collection():
    global collection
    client = chromadb.PersistentClient(path="./chroma_db")
    try:
        collection = client.get_collection(COLLECTION_NAME)
    except Exception:
        collection = client.create_collection(COLLECTION_NAME)


def _where_clause(sources=None, user_id=None):
    """Build a Chroma metadata filter scoped to the user (and sources)."""
    clauses = []
    if user_id:
        clauses.append({"user_id": {"$eq": user_id}})
    if sources:
        clauses.append({"source": {"$in": sources}})
    if not clauses:
        return None
    if len(clauses) == 1:
        return clauses[0]
    return {"$and": clauses}


def _query(question: str, sources=None, user_id=None):
    question_embedding = model.encode([question]).tolist()
    return collection.query(
        query_embeddings=question_embedding,
        n_results=TOP_K,
        include=["documents", "metadatas", "distances"],
        where=_where_clause(sources, user_id),
    )


def _completion(prompt: str, use_pro: bool) -> str:
    client = Groq(api_key=GROQ_API_KEY)
    models = [GROQ_PRO_MODEL, GROQ_FAST_MODEL] if use_pro else [GROQ_FAST_MODEL]
    for i, m in enumerate(models):
        try:
            response = client.chat.completions.create(
                model=m,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a precise research assistant. Answer using ONLY the "
                            "context provided. If the answer is not in the context, say: "
                            '"I don\'t have enough information in the documents to answer that."'
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
            )
            return response.choices[0].message.content
        except Exception:
            if i == len(models) - 1:
                raise
    raise RuntimeError("No LLM model available")


def _language_instruction(language):
    if not language or language.lower() in ("auto", "english", "en", ""):
        return ""
    return f"\nAnswer in {language}."


def ask(question: str, sources=None, language=None, user_id=None) -> dict:
    results = _query(question, sources=sources, user_id=user_id)

    docs = results["documents"][0]
    metas = results["metadatas"][0]
    dists = results["distances"][0]

    src_list = []
    seen = set()
    for text, m, d in zip(docs, metas, dists):
        key = (m.get("source"), m.get("page"))
        if key in seen:
            continue
        seen.add(key)
        src_list.append({
            "title": m.get("source"),
            "page": m.get("page") or None,
            "snippet": text[:400],
            "score": round(1 / (1 + d), 3),
            "url": m.get("url"),
        })

    context = "\n\n---\n\n".join(docs)
    language_note = _language_instruction(language)
    use_pro = _is_complex(question)

    prompt = f"""Use the context below to answer the question.
Context:
{context}

Question: {question}{language_note}

Answer:"""

    answer = _completion(prompt, use_pro=use_pro)
    return {
        "answer": answer,
        "sources": src_list,
        "model": GROQ_PRO_MODEL if use_pro else GROQ_FAST_MODEL,
    }


def summarize(sources=None, language=None, user_id=None) -> dict:
    data = collection.get(include=["documents", "metadatas"], where=_where_clause(sources, user_id))
    metas = data.get("metadatas", [])
    docs = data.get("documents", [])

    if not docs:
        raise RuntimeError("No documents found to summarize. Upload files first.")

    merged = sorted(
        zip(docs, metas),
        key=lambda x: (str(x[1].get("source", "")), x[1].get("chunk_index", 0)),
    )
    full_text = "\n\n".join(d for d, _ in merged)
    if len(full_text) > 14000:
        full_text = full_text[:14000] + "\n[...truncated...]"

    language_note = _language_instruction(language)
    prompt = f"""Summarize the following document content into clear bullet points.
Cover the main topics, key facts, and important details.

Document content:
{full_text}{language_note}

Summary:"""

    answer = _completion(prompt, use_pro=True)
    return {"answer": answer, "model": GROQ_PRO_MODEL}


def document_stats(user_id=None) -> dict:
    data = collection.get(include=["metadatas"], where=_where_clause(None, user_id))
    counts = {}
    for m in data.get("metadatas", []):
        src = str(m.get("source", "unknown"))
        counts[src] = counts.get(src, 0) + 1
    return counts