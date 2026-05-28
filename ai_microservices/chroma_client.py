"""
ChromaDB client for fetching document chunks directly by metadata filter.
No RAG/similarity search — uses collection.get() with where clause.
"""

import chromadb
from config import settings

# Global client reference
_chroma_client = None
_collection = None


def init_chroma():
    """
    Initialize ChromaDB client connection.
    Connects to the cloud-hosted ChromaDB instance using API key auth.
    """
    global _chroma_client, _collection

    print(f"Connecting to ChromaDB at {settings.chroma_host}:{settings.chroma_port}...")

    # Build client with cloud credentials
    _chroma_client = chromadb.HttpClient(
        host=settings.chroma_host,
        port=settings.chroma_port,
        ssl=settings.chroma_ssl,
        tenant=settings.chroma_tenant,
        database=settings.chroma_database,
        headers={
            "x-chroma-token": settings.chroma_api_key,
        } if settings.chroma_api_key else None,
    )

    # Get (or verify) the collection used by the RAG pipeline
    _collection = _chroma_client.get_or_create_collection(
        name=settings.chroma_collection,
    )

    count = _collection.count()
    print(f"  ✓ Connected to ChromaDB collection '{settings.chroma_collection}' ({count} documents)\n")


def get_document_chunks(document_id: str) -> list[dict]:
    """
    Fetch all chunks for a given document ID from ChromaDB.

    The RAG pipeline (ragService.js) stores chunks with metadata:
        { documentId: string, userId: string, fileName: string }

    This function uses collection.get() with a where filter — NOT a
    similarity search. It retrieves all chunks belonging to the document.

    Returns:
        List of dicts with 'id', 'text', and 'metadata' for each chunk.
    """
    if _collection is None:
        raise RuntimeError("ChromaDB not initialized. Call init_chroma() first.")

    results = _collection.get(
        where={"documentId": document_id},
        include=["documents", "metadatas"],
    )

    chunks = []
    if results and results["documents"]:
        for i, doc_text in enumerate(results["documents"]):
            chunk = {
                "id": results["ids"][i] if results["ids"] else f"chunk-{i}",
                "text": doc_text,
                "metadata": results["metadatas"][i] if results["metadatas"] else {},
            }
            chunks.append(chunk)

    return chunks
