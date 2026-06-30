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
GROQ_MODEL      = "llama-3.1-8b-instant"
COLLECTION_NAME = "my_docs"
TOP_K           = 5
# ──────────────────────────────────────────────────────────

model = None
collection = None

def load():
    global model, collection
    model = SentenceTransformer("all-MiniLM-L6-v2")
    client = chromadb.PersistentClient(path="./chroma_db")
    collection = client.get_collection(COLLECTION_NAME)

def ask(question: str) -> dict:
    question_embedding = model.encode([question]).tolist()
    results = collection.query(
        query_embeddings=question_embedding,
        n_results=TOP_K,
        include=["documents", "metadatas", "distances"],
    )
    chunks = results["documents"][0]
    sources = list(set(m["source"] for m in results["metadatas"][0]))

    context = "\n\n---\n\n".join(chunks)
    prompt = f"""You are a helpful assistant. Answer the user's question using ONLY the context below.
If the answer is not in the context, say "I don't have enough information in the documents to answer that."

Context:
{context}

Question: {question}

Answer:"""

    client = Groq(api_key=GROQ_API_KEY)
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
    )
    return {
        "answer": response.choices[0].message.content,
        "sources": sources
    }