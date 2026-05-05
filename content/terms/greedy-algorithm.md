---
name: Greedy Algorithm
categories:
- algorithms
tags:
- fundamentals
- interview-prep
code_lang: python
---

A greedy algorithm builds a solution step by step, always making the locally optimal choice at each step, hoping to reach a globally optimal solution.

**Works when:** the problem has the *greedy-choice property* — a local optimum leads to a global optimum — and *optimal substructure*.

**Classic examples:** coin change (canonical denominations), interval scheduling, Huffman coding, Dijkstra's shortest path.

**Pitfall:** greedy fails when local optima don't compose into a global optimum (e.g., coin change with arbitrary denominations — use DP instead).

```python
def coin_change_greedy(coins: list[int], amount: int) -> list[int]:
    """Works correctly only for canonical coin systems (e.g. US coins)."""
    coins.sort(reverse=True)
    result = []
    for coin in coins:
        while amount >= coin:
            result.append(coin)
            amount -= coin
    return result  # e.g. coin_change_greedy([25,10,5,1], 41) -> [25,10,5,1]
```
