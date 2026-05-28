---
name: Trie
categories:
- data-structures
tags:
- fundamentals
- interview-prep
code_lang: python
---

A trie (prefix tree) is a tree where each node represents one character of a string. Paths from root to marked nodes spell out stored words. Enables O(m) lookup, insert, and prefix search where *m* is the word length — independent of the number of words stored.

**Key operations:**
- **insert(word):** walk/create nodes character by character, mark terminal.
- **search(word):** walk nodes; return true only if terminal node reached.
- **startsWith(prefix):** walk nodes; return true if path exists (no terminal check).

**Use cases:** autocomplete, spell-checkers, IP routing tables, dictionary word problems.

```python
class TrieNode:
    def __init__(self):
        self.children: dict[str, "TrieNode"] = {}
        self.is_end = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word: str) -> None:
        node = self.root
        for ch in word:
            node = node.children.setdefault(ch, TrieNode())
        node.is_end = True

    def search(self, word: str) -> bool:
        node = self.root
        for ch in word:
            if ch not in node.children:
                return False
            node = node.children[ch]
        return node.is_end

    def starts_with(self, prefix: str) -> bool:
        node = self.root
        for ch in prefix:
            if ch not in node.children:
                return False
            node = node.children[ch]
        return True
```
