import os
import pdfplumber
import chromadb
from sentence_transformers import SentenceTransformer

# ─── Config ───────────────────────────────────────────────
DOCS_FOLDER = "docs"        # Put your PDFs/txt files here
CHUNK_SIZE   = 500          # Characters per chunk
CHUNK_OVERLAP = 50          # Overlap between chunks (avoids cutting context)
COLLECTION_NAME = "my_docs"
# ──────────────────────────────────────────────────────────


def load_pdf(filepath):
    """Extract all text from a PDF file."""
    text = ""
    with pdfplumber.open(filepath) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text


def load_txt(filepath):
    """Read a plain text file."""
    with open(filepath, "r", encoding="utf-8") as f:
        return f.read()


def load_all_docs(folder):
    """Load all PDFs and TXT files from the docs folder."""
    docs = []
    for filename in os.listdir(folder):
        filepath = os.path.join(folder, filename)
        if filename.endswith(".pdf"):
            print(f"  Loading PDF: {filename}")
            text = load_pdf(filepath)
            docs.append({"filename": filename, "text": text})
        elif filename.endswith(".txt"):
            print(f"  Loading TXT: {filename}")
            text = load_txt(filepath)
            docs.append({"filename": filename, "text": text})
    return docs


def chunk_text(text, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    """Split text into overlapping chunks."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        if chunk.strip():  # skip empty chunks
            chunks.append(chunk)
        start += chunk_size - overlap  # move forward with overlap
    return chunks


def ingest():
    print("\n🔍 Loading documents...")
    docs = load_all_docs(DOCS_FOLDER)

    if not docs:
        print(f"❌ No PDFs or TXT files found in '{DOCS_FOLDER}/' folder.")
        print("   Add some files and run ingest.py again.")
        return

    print(f"\n✂️  Chunking documents...")
    all_chunks = []
    all_ids    = []
    all_meta   = []

    for doc in docs:
        chunks = chunk_text(doc["text"])
        print(f"   {doc['filename']} → {len(chunks)} chunks")
        for i, chunk in enumerate(chunks):
            all_chunks.append(chunk)
            all_ids.append(f"{doc['filename']}_chunk_{i}")
            all_meta.append({"source": doc["filename"], "chunk_index": i})

    print(f"\n🧠 Generating embeddings for {len(all_chunks)} chunks...")
    print("   (First run downloads the model ~90MB, be patient)")
    model = SentenceTransformer("all-MiniLM-L6-v2")  # fast & good quality
    embeddings = model.encode(all_chunks, show_progress_bar=True)

    print(f"\n💾 Saving to ChromaDB...")
    client = chromadb.PersistentClient(path="./chroma_db")

    # Delete old collection if exists (fresh ingest)
    try:
        client.delete_collection(COLLECTION_NAME)
    except Exception:
        pass

    collection = client.create_collection(COLLECTION_NAME)
    collection.add(
        documents=all_chunks,
        embeddings=embeddings.tolist(),
        ids=all_ids,
        metadatas=all_meta,
    )

    print(f"\n✅ Done! {len(all_chunks)} chunks stored in ChromaDB.")
    print("   Now run: python query.py")


if __name__ == "__main__":
    ingest()