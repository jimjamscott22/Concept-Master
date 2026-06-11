---
name: Facade Pattern
categories:
- design-patterns
- design
tags:
- fundamentals
- interview-prep
related:
- adapter-pattern
- separation-of-concerns
code_lang: python
---

The facade pattern provides a simple interface over a more complex subsystem.

A facade does not remove the underlying complexity; it gives common callers a clean entry point so they do not need to coordinate many low-level objects themselves.

**Use it when:** a workflow requires several steps that most clients should not have to understand.

```python
class ReportFacade:
    def __init__(self, loader, analyzer, exporter):
        self.loader = loader
        self.analyzer = analyzer
        self.exporter = exporter

    def build_pdf(self, path: str) -> bytes:
        rows = self.loader.load(path)
        summary = self.analyzer.summarize(rows)
        return self.exporter.to_pdf(summary)
```
