---
name: Embeddings
categories:
- ai-assisted-development
tags:
- fundamentals
- tooling
related:
- context-engineering
- retrieval-augmented-generation
code_lang: python
---

An embedding is a numeric vector that represents the meaning of text (or code, images, audio) so similar items land close together in that vector space.

Embedding models map a sentence or function into hundreds or thousands of floating-point numbers. **Cosine similarity** or dot product then ranks nearest neighbors: a query vector against a library of chunk vectors. That search is the retrieval step in **RAG** and in "find related files" features inside coding agents.

**Properties that matter:**
- **Dimensionality:** more dimensions can capture nuance, at a cost in storage and latency.
- **Model choice:** code embeddings and prose embeddings are not interchangeable; mix them and neighbors get worse.
- **Chunking:** you embed *pieces*. Too large and the vector is muddy; too small and you lose surrounding meaning.

Embeddings are not a database by themselves. You store them in a vector index (or a database with a vector column) and keep the original text alongside so the LLM can read it later.

```python
def cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = sum(x * x for x in a) ** 0.5
    mag_b = sum(y * y for y in b) ** 0.5
    return dot / (mag_a * mag_b)

# Higher score => more similar meaning
score = cosine(embed("binary search tree"), embed("ordered binary tree"))
```
