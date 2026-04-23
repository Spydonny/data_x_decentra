# Architecture

## System Overview

KYA sits between agent clients and Solana execution. The backend evaluates intents with Gemini, optionally records results on-chain, and exposes the same trust layer through REST and MCP.

```text
+------------------+        +------------------------+        +----------------------+
| Agent / Wallet   | -----> | KYA API + MCP          | -----> | Gemini Policy Engine |
| Client           |        | FastAPI decision layer |        | Intent analysis      |
+------------------+        +------------------------+        +----------------------+
         |                              |
         |                              v
         |                    +------------------------+
         |                    | Solana KYA Program     |
         |                    | AgentRecord /          |
         |                    | IntentRecord PDAs      |
         |                    +------------------------+
         |                              ^
         v                              |
+------------------+                    |
| Dashboard /      | -------------------+
| Explorer         |
+------------------+
```

## Components

### `kya_front`
React and Vite dashboard for landing, registration, explorer, and trust-oriented UI flows.

### `kya-backend`
FastAPI service exposing `/health`, `/verify-intent`, `/agents/*`, and `/mcp/*` endpoints.

### Gemini decision service
Parses intent text, applies mission-aware context, and returns a structured `approve`, `reject`, or `escalate` outcome with reasoning and risk.

### Solana service and Anchor program
Reads and writes `AgentRecord` and `IntentRecord` PDAs so agent identity and intent history remain auditable on-chain.

### MCP layer
Makes the same trust primitives available to agent frameworks over stdio and HTTP/SSE transports.

## Decision Flow

1. An agent client, operator, or dashboard submits an intent.
2. The backend loads mission context when an `agent_id` is supplied.
3. Gemini evaluates the request and returns a structured decision plus risk score.
4. If Solana credentials are configured, the result is logged on-chain.
5. Frontends, operators, and external agents query state through REST or MCP.

## Data Model

- `AgentRecord` stores identity, trust level, limits, and metadata.
- `IntentRecord` stores the intent decision, reasoning, amount, destination, and timestamp.
