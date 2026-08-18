---
name: Retrieval-Augmented Generation (RAG)
categories:
- ai-assisted-development
tags:
- agentic-ai
- fundamentals
- tooling
related:
- context-engineering
- hallucination
- prompt-engineering
code_lang: python
---

Retrieval-Augmented Generation (RAG) is a pattern where a language model answers a question using documents fetched at query time, not only the facts baked into its training weights.

The usual pipeline: embed the user query, search a vector (or hybrid) index for nearby chunks, stuff those chunks into the prompt, then generate. The model is grounded in *your* notes, API docs, or codebase instead of guessing.

**Why it exists:** models hallucinate when they lack a source. RAG shrinks that gap by supplying evidence, and it lets knowledge change without retraining — update the index, not the model.

**vs. stuffing the whole repo:** RAG is a form of **context engineering**. You retrieve only the slices that match the current question so the context window stays focused.

**Failure modes:** bad chunking, stale indexes, retrieving the wrong file, or prompting the model in a way that ignores the retrieved text.

```python
def answer(query: str, index, model) -> str:
    chunks = index.search(query, k=5)
    context = "\n\n".join(chunk.text for chunk in chunks)
    return model.complete(
        f"Use only the context.\n\n{context}\n\nQuestion: {query}"
    )
```
