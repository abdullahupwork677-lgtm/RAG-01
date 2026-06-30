import os
import chromadb
from sentence_transformers import SentenceTransformer
from groq import Groq

# ─── Config ───────────────────────────────────────────────
GROQ_API_KEY    = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY not set. Add it to your .env file.")
GROQ_MODEL      = "llama-3.1-8b-instant"           # Free & fast
COLLECTION_NAME = "my_docs"
TOP_K           = 5                          # How many chunks to retrieve
# ──────────────────────────────────────────────────────────

def load_retriever():
    """Load the embedding model and ChromaDB collection."""
    model = SentenceTransformer("all-MiniLM-L6-v2")
    client = chromadb.PersistentClient(path="./chroma_db")
    collection = client.get_collection(COLLECTION_NAME)
    return model, collection


def retrieve(question, model, collection, top_k=TOP_K):
    """Embed the question and find the most relevant chunks."""
    question_embedding = model.encode([question]).tolist()
    results = collection.query(
        query_embeddings=question_embedding,
        n_results=top_k,
        include=["documents", "metadatas", "distances"],
    )
    chunks = results["documents"][0]
    sources = [m["source"] for m in results["metadatas"][0]]
    return chunks, sources


def build_prompt(question, chunks):
    """Build the prompt that goes to the LLM."""
    context = "\n\n---\n\n".join(chunks)
    prompt = f"""You are a helpful assistant. Answer the user's question using ONLY the context below.
If the answer is not in the context, say "I don't have enough information in the documents to answer that."

Context:
{context}

Question: {question}

Answer:"""
    return prompt


def ask_groq(prompt):
    """Send the prompt to Groq and get a response."""
    client = Groq(api_key=GROQ_API_KEY)
    response = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,   # low temp = more factual, less creative
    )
    return response.choices[0].message.content


def query():
    print("\n🔄 Loading model and vector store...")
    try:
        model, collection = load_retriever()
    except Exception as e:
        print("❌ Could not load ChromaDB. Did you run ingest.py first?")
        print(f"   Error: {e}")
        return

    print("✅ Ready! Type your questions below.")
    print("   Type 'exit' to quit.\n")

    while True:
        question = input("You: ").strip()
        if not question:
            continue
        if question.lower() in ("exit", "quit"):
            print("Bye!")
            break

        # Step 1 — Retrieve relevant chunks
        chunks, sources = retrieve(question, model, collection)

        # Step 2 — Build prompt with context
        prompt = build_prompt(question, chunks)

        # Step 3 — Get answer from Groq
        print("\n🤖 Thinking...\n")
        answer = ask_groq(prompt)

        print(f"Assistant: {answer}")
        print(f"\n📄 Sources: {', '.join(set(sources))}\n")
        print("-" * 60)


if __name__ == "__main__":
    query()