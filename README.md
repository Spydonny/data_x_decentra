# KYA - Know Your Agent

[![CI](https://github.com/Spydonny/data_x_decentra/actions/workflows/ci.yml/badge.svg)](https://github.com/Spydonny/data_x_decentra/actions/workflows/ci.yml)
[![Solana](https://img.shields.io/badge/Solana-devnet-14F195.svg)](https://solana.com)
[![AI Agents](https://img.shields.io/badge/AI%20Agents-Trust%20Layer-0EA5E9)](#)
[![MCP](https://img.shields.io/badge/MCP-HTTP%20%2B%20SSE-black)](kya-backend/README_MCP.md)

> KYA is an on-chain verification and reputation layer for AI agents on Solana. It evaluates intent with policy-aware AI checks, records decisions on-chain, and makes agent trust auditable through API, MCP, and dashboard surfaces.

[Frontend](kya_front/) · [Backend](kya-backend/) · [MCP Docs](kya-backend/README_MCP.md) · [Docs](docs/)

---

![KYA Dashboard](kya_front/src/assets/hero.png)

---

## Problem and Solution

### 1. No trust layer for AI agents
- **Problem:** Agents can already move funds, call APIs, and automate treasury flows, but counterparties cannot verify who controls them or whether they follow policy.
- **KYA:** Registers agents on-chain and binds actions to a verifiable agent identity.

### 2. Opaque decisions
- **Problem:** Approval and rejection logic usually happens off-chain, leaving no durable audit trail.
- **KYA:** Produces a structured decision, risk level, and intent history that can be queried later.

### 3. Weak policy enforcement
- **Problem:** Mission limits, action boundaries, and treasury rules are hard to enforce across autonomous systems.
- **KYA:** Verifies each intent against mission context and policy metadata before sensitive actions proceed.

### 4. Fragmented integration paths
- **Problem:** Builders need one trust layer that works for apps, operators, and agent frameworks.
- **KYA:** Ships the same core logic through FastAPI, MCP over stdio and HTTP/SSE, and a React dashboard.

---

## Why Solana

- **Finality** - fast settlement makes verification practical in real transaction flows
- **Cost** - low fees make frequent intent logging and trust updates affordable
- **PDA model** - deterministic accounts make agent history easy to derive and inspect
- **Composability** - KYA plugs into wallets, agent runtimes, and Solana-native programs

---

## Summary of Features

- On-chain agent registration via Anchor program
- Intent verification with `approve`, `reject`, and `escalate` outcomes
- Risk scoring and auditable intent logs
- FastAPI endpoints for registration, lookup, and verification
- MCP tools over stdio and HTTP/SSE for remote agent workflows
- React dashboard for explorer, registration, and trust-graph experiences
- Devnet-ready program config and backend tests

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| On-chain program | Rust · Anchor |
| Backend API | Python · FastAPI · Pydantic |
| AI policy engine | Google Gemini |
| Frontend | React 19 · TypeScript · Vite · Windi CSS |
| Integration | MCP · HTTP/SSE |
| Testing | pytest |

---

## Architecture

```text
+------------------+        +------------------------+        +----------------------+
| Agent / Wallet   | -----> | KYA API + MCP          | -----> | Gemini Policy Engine |
| or Agent Client  |        | FastAPI decision layer |        | Intent analysis      |
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
| Explorer / Admin |
+------------------+
```

See [docs/architecture.md](docs/architecture.md) for the full component breakdown.

---

## Core API Surfaces

- `GET /health`
- `POST /verify-intent`
- `POST /agents/register`
- `GET /agents/{agent_id}`
- `GET /agents/{agent_id}/logs`
- `GET /mcp/sse` plus JSON-RPC POST to the `endpoint` URL returned by the first SSE event

Full reference: [docs/api.md](docs/api.md) and [kya-backend/README_MCP.md](kya-backend/README_MCP.md)

---

## Repository Structure

| Path | Purpose |
|------|---------|
| `kya-backend/` | FastAPI API, MCP server, Solana integration, and tests |
| `kya_front/` | React dashboard and client-side API integration |
| `kya-solana-scripts/` | Anchor workspace and on-chain KYA program |
| `kya/` | Reserved module directory |
| `kya_react/` | Reserved module directory |

---

## Quick Start

**Prerequisites:** Python 3.11+, Node.js 20+, Rust, Anchor CLI, Solana CLI

```bash
# Clone the repository
git clone https://github.com/Spydonny/data_x_decentra.git
cd data_x_decentra

# Configure environments
cp kya-backend/.env.example kya-backend/.env
cp kya_front/.env.example kya_front/.env

# Backend
cd kya-backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend (new terminal)
cd ../kya_front
npm install
npm run dev
```

Optional checks:

```bash
cd kya-solana-scripts && anchor build
cd ../kya-backend && pytest -q
```

---

## Roadmap

- [x] FastAPI verification service
- [x] On-chain agent registration and logs
- [x] MCP transport for agent tooling
- [x] React dashboard and explorer flows
- [ ] Mainnet deployment
- [ ] Production auth and monitoring
- [ ] SDK / developer toolkit
- [ ] Multi-agent policy orchestration

Full roadmap: [docs/roadmap.md](docs/roadmap.md)

---

## Resources

- [Backend MCP Guide](kya-backend/README_MCP.md)
- [Architecture Notes](docs/architecture.md)
- [API Reference](docs/api.md)
- [Product Overview](docs/product.md)
