import json
import asyncio
from typing import List, Dict, Any, Generator
from sse_starlette.sse import ServerSentEvent
from groq import Groq

from chroma_client import get_document_chunks
from config import settings
from rank_bm25 import BM25Okapi

class ChatAgent:
    def __init__(self):
        self.groq_client = Groq(api_key=settings.groq_api_key) if settings.groq_api_key else None
        self.model = "meta-llama/llama-4-scout-17b-16e-instruct"
        self._document_cache = {} # Cache chunks for current chat requests
        
    def _get_document_text_and_bm25(self, document_ids: List[str]):
        """Fetch chunks, build full text, and build BM25 index on the fly."""
        all_chunks = []
        for doc_id in document_ids:
            if doc_id not in self._document_cache:
                chunks = get_document_chunks(doc_id)
                self._document_cache[doc_id] = chunks
            all_chunks.extend(self._document_cache[doc_id])
            
        full_text = " ".join([c["text"] for c in all_chunks])
        
        # Build BM25
        tokenized_corpus = [doc["text"].split(" ") for doc in all_chunks]
        bm25 = BM25Okapi(tokenized_corpus) if tokenized_corpus else None
        
        return all_chunks, full_text, bm25
        
    def search_keyword(self, query: str, document_ids: List[str], top_k: int = 3) -> str:
        """BM25 Keyword search tool."""
        all_chunks, _, bm25 = self._get_document_text_and_bm25(document_ids)
        if not bm25 or not all_chunks:
            return "No documents found to search."
            
        tokenized_query = query.split(" ")
        doc_scores = bm25.get_scores(tokenized_query)
        
        # Get top k
        top_indices = sorted(range(len(doc_scores)), key=lambda i: doc_scores[i], reverse=True)[:top_k]
        
        results = []
        for idx in top_indices:
            if doc_scores[idx] > 0: # Only return matches
                results.append(all_chunks[idx]["text"])
                
        if not results:
            return "No exact keyword matches found."
            
        return "\n\n".join(results)
        
    def semantic_search(self, query: str, document_ids: List[str], top_k: int = 3) -> str:
        """Semantic vector search using Chroma DB."""
        # For simplicity in this microservice context without full RAG pipeline initialized here,
        # we will simulate the hybrid aspect by using the same chunks (retrieved via metadata) 
        # and letting LLM act on it, OR ideally we would query chroma's collection directly.
        from chroma_client import _collection
        if not _collection:
            return "Vector database not connected."
            
        # Ensure we only search within the requested documents
        where_filter = {"documentId": {"$in": document_ids}} if len(document_ids) > 1 else {"documentId": document_ids[0]}
        if not document_ids:
            return "No documents provided to search."
            
        results = _collection.query(
            query_texts=[query],
            n_results=top_k,
            where=where_filter
        )
        
        if not results or not results["documents"] or not results["documents"][0]:
            return "No semantically relevant context found."
            
        return "\n\n".join(results["documents"][0])

    def summarize_document(self, document_ids: List[str]) -> str:
        """Summarize tool."""
        _, full_text, _ = self._get_document_text_and_bm25(document_ids)
        if not full_text:
            return "Document is empty."
        # Truncate text to fit context window for summary if needed
        return f"Document text (truncated): {full_text[:10000]}"
        
    async def process_chat_stream(self, messages: List[Dict[str, str]], document_ids: List[str]) -> Generator[ServerSentEvent, None, None]:
        """Process chat and yield SSE streams."""
        if not self.groq_client:
            yield ServerSentEvent(data=json.dumps({"type": "error", "message": "Groq API key not set."}))
            return

        # Define tools for the agent
        tools = [
            {
                "type": "function",
                "function": {
                    "name": "semantic_search",
                    "description": "Search the documents for semantically relevant context based on meaning and concepts.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {"type": "string", "description": "The search query."}
                        },
                        "required": ["query"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "keyword_search",
                    "description": "Search the documents for exact keyword matches. Use this for specific names, numbers, or exact phrases.",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {"type": "string", "description": "The search query."}
                        },
                        "required": ["query"]
                    }
                }
            }
        ]
        
        system_prompt = {
            "role": "system",
            "content": "You are an expert AI legal assistant. You have access to tools to search the user's documents. "
                       "First, determine if the user's latest query is a completely NEW question or a FOLLOW-UP to the immediate conversation history. "
                       "If it is a FOLLOW-UP query, rely primarily on the existing conversation context to answer it, or formulate a new search query if more information is needed. "
                       "If it is a NEW query, you MUST use the search tools (semantic_search or keyword_search) to find relevant clauses and information in the documents before answering. "
                       "Use keyword_search for specific names, numbers, or exact phrases, and semantic_search for general legal concepts. "
                       "Only answer based on the provided document context. If the information is not in the documents, state that clearly."
        }
        
        # Prepare messages
        chat_messages = [system_prompt] + messages
        
        # 1. First call to LLM to decide if tool use is needed
        try:
            response = self.groq_client.chat.completions.create(
                model=self.model,
                messages=chat_messages,
                tools=tools,
                tool_choice="auto",
                max_tokens=1024
            )
            
            response_message = response.choices[0].message
            tool_calls = response_message.tool_calls
            
            if tool_calls:
                # LLM wants to call a tool
                chat_messages.append({
                    "role": "assistant",
                    "content": response_message.content or "",
                    "tool_calls": [
                        {
                            "id": t.id,
                            "type": "function",
                            "function": {
                                "name": t.function.name,
                                "arguments": t.function.arguments
                            }
                        } for t in tool_calls
                    ]
                })
                
                for tool_call in tool_calls:
                    function_name = tool_call.function.name
                    function_args = json.loads(tool_call.function.arguments)
                    
                    yield ServerSentEvent(data=json.dumps({
                        "type": "tool_call", 
                        "name": function_name,
                        "query": function_args.get("query", "")
                    }))
                    
                    # Execute tool
                    tool_result = ""
                    if function_name == "semantic_search":
                        tool_result = self.semantic_search(function_args.get("query"), document_ids)
                    elif function_name == "keyword_search":
                        tool_result = self.search_keyword(function_args.get("query"), document_ids)
                        
                    chat_messages.append({
                        "tool_call_id": tool_call.id,
                        "role": "tool",
                        "name": function_name,
                        "content": tool_result
                    })
                    
                # 2. Second call to LLM with tool results (Streaming)
                stream = self.groq_client.chat.completions.create(
                    model=self.model,
                    messages=chat_messages,
                    stream=True,
                    max_tokens=2048
                )
                
                for chunk in stream:
                    if chunk.choices[0].delta.content:
                        yield ServerSentEvent(data=json.dumps({
                            "type": "content",
                            "content": chunk.choices[0].delta.content
                        }))
            else:
                # No tools needed, stream answer directly
                # To stream directly, we need to recreate the request with stream=True
                # since the first one was stream=False to check for tool calls
                stream = self.groq_client.chat.completions.create(
                    model=self.model,
                    messages=chat_messages,
                    stream=True,
                    max_tokens=2048
                )
                
                for chunk in stream:
                    if chunk.choices[0].delta.content:
                        yield ServerSentEvent(data=json.dumps({
                            "type": "content",
                            "content": chunk.choices[0].delta.content
                        }))
                        
        except Exception as e:
            print(f"Chat agent error: {e}")
            yield ServerSentEvent(data=json.dumps({"type": "error", "message": str(e)}))

chat_agent_instance = ChatAgent()
