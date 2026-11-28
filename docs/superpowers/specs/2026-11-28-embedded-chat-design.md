# Concept Master Embedded Chat Design

## Goal and scope

Help a learner understand the glossary entry they are reading. They can ask for a simpler explanation, a comparison, or a walkthrough of the entry’s code, then ask follow-up questions without leaving the term detail view.

Version 1 is for a local or private Concept Master installation. The person running the app configures LM Studio or Ollama and optionally Gemini. The learner chooses among configured providers. The first release covers glossary term details.

## Learner experience

**Open and ask.** Place **Ask about this term** beside the Definition, Code, and Diagram tab row. It opens a panel headed **Ask about [term name]** with a provider selector, starter questions, and a composer. Local is preselected when available. When Gemini is the only configured option, the learner selects it before sending. The panel stays available when the learner switches reference tabs.

**Start with the material on screen.** For DNS Record, suggested questions include “Explain it simply” and “How do A and CNAME records differ?” When the term has an example, offer “Walk me through the `dig` example.” Choosing a starter places it in the composer for editing. In the Code tab, offer **Include code example** so the learner can explicitly attach the term’s stored code. A code-specific starter preselects that option and keeps it visible before sending.

**Follow up.** Keep the transcript and draft in memory, keyed by term slug and provider, for the current app session. Reopening the panel restores that conversation. **New chat** clears the active conversation and draft. Changing terms closes the panel and ends any active request. Switching providers opens that provider’s conversation. On a provider error, keep the submitted question available for retry.

## Visual and responsive design

Give the panel the feel of an annotation beside a reference. Keep the glossary’s reading column and use a single accent edge where the panel meets it. Left-align answer prose and code. Set answer prose in the app’s current reading type, Source Serif 4 in hybrid mode and JetBrains Mono in mono mode. Use JetBrains Mono for code and compact controls.

Use the existing semantic tokens across all themes. The Midnight reference palette is page `#0F1216`, panel `#151A21`, divider `#2B333E`, primary text `#E9EEF4`, secondary text `#A9B6C4`, and accent `#7CC4FF`. Use secondary text for provider and status labels where the dimmer theme token would miss contrast.

```text
Roomy term detail pane
DNS Record    Definition   Code   Diagram   [Ask about this term]
┌───────────────────────────────────┬──────────────────────────────┐
│ Definition or code                │ Ask about DNS Record         │
│                                   │ Provider [Local ▾] [Close]   │
│                                   │ Questions and answers        │
│                                   │ [Ask a follow-up…]  [Send]   │
└───────────────────────────────────┴──────────────────────────────┘
```

Use the width of the detail pane to choose the layout. A starting threshold of about 920 px leaves room for a roughly 340 px panel and a readable reference column. Below the threshold, place the panel inline after the active reference content. Opening it moves keyboard focus to the composer when ready, or to the provider control when a choice is required. Closing returns focus to the launcher. Escape closes the panel when focus is inside it and preserves the selected term. Scope the existing arrow-key shortcuts so they respect the chat controls. Announce generation status and completed replies without reading every streamed chunk.

## Providers and deployment

**Local.** Use a single OpenAI-compatible adapter for LM Studio and Ollama. The runtime URL and model are fixed by backend configuration. Suggested settings are `CHAT_LOCAL_BASE_URL`, `CHAT_LOCAL_MODEL`, and optional `CHAT_LOCAL_API_TOKEN`. For a native backend, example base URLs are `http://127.0.0.1:1234/v1` for LM Studio and `http://127.0.0.1:11434/v1` for Ollama. The adapter calls `/chat/completions` relative to that base. [LM Studio compatibility](https://lmstudio.ai/docs/developer/openai-compat) · [Ollama compatibility](https://docs.ollama.com/api/openai-compatibility)

**Gemini.** Use a dedicated Gemini adapter and a server-side Google AI Studio key. Suggested settings are `GEMINI_API_KEY` and `CHAT_GEMINI_MODEL`. The adapter calls the Gemini API at Google’s fixed origin and uses its streaming content endpoint. Keep the model configurable and use an authorization key from Google AI Studio. [Gemini API keys](https://aistudio.google.com/docs/api-key) · [Gemini streaming reference](https://aistudio.google.com/api-reference/generate-content/stream-generate-content)

**Deployment.** Default `CHAT_ENABLED` to false. When enabled, only complete provider configurations appear as selectable. If neither is configured, show a short setup message. Docker Desktop can reach a model on the host via `host.docker.internal` when the runtime is reachable from the container. A runtime in the same Compose network uses its service name. Keep the chat API behind loopback bindings or an authenticated private deployment. The backend accepts provider IDs and uses administrator-configured endpoints. [Docker Desktop networking](https://docs.docker.com/desktop/features/networking/) · [LM Studio network binding](https://lmstudio.ai/docs/developer/core/server/serve-on-network)

## Conversation data and privacy

Resolve the term from its slug on the server. Build a bounded request with a tutor instruction, the term name and definition, the optional code example and language, the most recent completed turns for that term and provider, and the learner’s question. Tell the model to lead with a direct explanation, use a small example when helpful, and flag uncertainty. Treat glossary text and code as reference data. Show the term as context in the panel and keep answers visibly distinct from the glossary entry.

Before the first Gemini send in a session, show **Send to Google Gemini** with the categories of data included and a **Cancel** action. Subsequent sends keep **Gemini · sends to Google** visible by the composer. Provider switching keeps the other provider’s transcript out of the request. Local failures offer retry with Local and leave cloud selection to the learner.

Enable Gemini only where the deployment meets Google’s audience and use terms. The Google terms restrict apps directed toward or likely to be accessed by people under 18 and describe different data handling by service tier and region. The learner-facing notice should link to those terms, name what leaves the app, and advise users to keep sensitive material out of cloud prompts. [Gemini API terms](https://aistudio.google.com/docs/terms)

Keep credentials in the FastAPI environment. Store chats in browser memory and keep request logs to provider, outcome, timing, and a correlation ID. Exclude prompt text, transcripts, headers, and keys from routine logs. Render assistant answers as text or Markdown with raw HTML and remote images disabled. Code is displayed as a snippet. The tutor has a text-only interface.

## API and failure behavior

**`GET /api/chat/providers`** returns whether chat is enabled and each provider’s ID, display name, and configuration state. Configuration and reachability are distinct. Check reachability when a learner sends a question.

**`POST /api/chat/messages`** accepts a term slug, provider ID, current question, include-code flag, and bounded history containing completed user and assistant turns. Start with at most four prior exchanges and a 4 KiB question limit. Bound total input and generated output to the configured model’s budget, reserving output capacity and trimming older context first. Return a streamed response with text chunks and a terminal completion or error event. Keep separate request timeouts for connection, idle generation, and total duration.

Allow one active request in the panel. **Stop**, closing the panel, switching providers, and navigating away cancel the browser request and close the upstream stream where supported. Guard updates by request, term, and provider so late chunks cannot enter another transcript. Keep interrupted replies labeled in the panel and exclude them from follow-up context. Retry resends the original question without duplicating it in history.

- **Local model unreachable or missing.** Explain whether the learner should start the model server or ask the operator to check the configured model.

- **Gemini rejects the key or exceeds quota.** Show specific guidance to check the key or wait for quota, and keep the question available.

- **Provider blocks a response, stalls, or returns an empty answer.** Explain what happened and offer an appropriate retry or rewrite action.

- **Term changed or deleted.** Handle a stale slug explicitly and return the learner to a valid glossary entry before another send.

## Implementation sequence

1. Add backend configuration and a chat router. Reuse the glossary’s term lookup and add request bounds and provider error mapping.

2. Add the provider adapters and normalize their streaming responses. Confirm local routing in native and Compose runs and keep Gemini credentials on the backend.

3. Add the panel to the React term detail view. Wire the term and provider state, composer, cloud send notice, streaming, cancellation, and keyboard behavior.

4. Document native and Compose setup, then run the acceptance checks with provider stubs and representative live connections.

## Acceptance criteria

- [ ] A learner can open chat from Definition, Code, and Diagram where available, send a suggested or typed question, and continue with a follow-up.

- [ ] The panel sits beside the reference where the detail pane has room and opens inline where it does not. Verify mobile, all three browse layouts, light and dark themes, high contrast, and keyboard-only use.

- [ ] LM Studio and Ollama both answer through the Local adapter. Local-only mode works without contacting Google. A native run and a Docker Compose run can reach their documented local runtime.

- [ ] Gemini sends only after explicit selection and first-send confirmation. Captured requests contain the expected term context and Gemini history. They contain no Local conversation, and keys stay absent from browser responses and routine logs.

- [ ] A local outage, invalid Gemini key, quota error, timeout, blocked answer, and empty reply each show actionable feedback. A recoverable error preserves the question for retry.

- [ ] Stop, close, navigation, provider switching, and term deletion leave the correct transcript in view. Late chunks cannot appear in another term or provider’s conversation.

- [ ] Reload clears session chats. The glossary remains usable when chat is disabled or the configured providers are unavailable.
