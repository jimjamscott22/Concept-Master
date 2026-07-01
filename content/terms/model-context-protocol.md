---
name: Model Context Protocol (MCP)
categories:
- ai-assisted-development
tags:
- agentic-ai
- tooling
- api
related:
- tool-use
- ai-coding-agent
- json
code_lang: json
---

The Model Context Protocol (MCP) is an open standard, introduced by Anthropic, for connecting AI applications to external tools, data sources, and services through a common interface. Instead of every agent needing a custom integration for every tool, an **MCP server** exposes its capabilities in a standard way, and any **MCP client** — Claude Code, Cursor, other agent frameworks — can talk to it the same way.

**The core pieces:**
- **MCP server** — wraps an external system (a database, a ticketing tool, a filesystem) and exposes it as tools, resources, or prompts.
- **MCP client** — the AI application (embedded in an agent or editor) that discovers and calls what the server exposes.
- **Transport** — messages are JSON-RPC 2.0, typically sent over stdio (local process) or HTTP (remote server).

**Why it matters:** MCP is to AI tool integrations roughly what LSP (Language Server Protocol) is to editor language support — one server implementation works with every compliant client, instead of an N×M matrix of custom integrations.

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "search_issues",
    "arguments": { "query": "is:open label:bug" }
  }
}
```
