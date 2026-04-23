# API Reference

## REST Endpoints

### Health Check
```http
GET /health
```

Response:

```json
{
  "status": "ok",
  "service": "kya-api"
}
```

### Verify Intent
```http
POST /verify-intent
```

Request body:

```json
{
  "intent_text": "Send 0.5 SOL to the approved treasury wallet",
  "context_json": "{\"policy\":\"treasury\"}",
  "agent_id": "owner_pubkey_base58",
  "amount": 500000000,
  "destination": "destination_pubkey_base58",
  "intent_id": 1
}
```

Response body:

```json
{
  "decision": "approve",
  "reasoning": "The transfer matches the configured policy.",
  "risk_level": 18,
  "intent_log_signature": "5abc..."
}
```

### Register Agent
```http
POST /agents/register
```

Request body:

```json
{
  "agent_name": "Treasury Guardian",
  "description": "Approves routine treasury transfers under the daily cap.",
  "max_amount": 1000000000,
  "logger_authority": "logger_authority_pubkey_base58"
}
```

Response body:

```json
{
  "agent_id": "owner_pubkey_base58",
  "pda_address": "agent_record_pda_base58",
  "logger_authority": "logger_authority_pubkey_base58",
  "transaction_signature": "4def...",
  "eliza_status": "ok",
  "eliza_agent_id": "optional-eliza-id",
  "eliza_error": null
}
```

### Get Agent
```http
GET /agents/{agent_id}
```

Response fields:

- `owner`
- `logger_authority`
- `agent_record_address`
- `trust_level`
- `agent_name`
- `max_amount`
- `total_logs`
- `is_active`
- `created_at`
- `last_updated`
- `bump`

### Get Agent Logs
```http
GET /agents/{agent_id}/logs
```

Response fields:

- `owner`
- `agent_record_address`
- `total_logs`
- `logs[]`
- `logs[].intent_id`
- `logs[].decision`
- `logs[].decision_code`
- `logs[].reasoning`
- `logs[].amount`
- `logs[].destination`
- `logs[].timestamp`
- `logs[].intent_record_address`

## MCP Endpoints

### HTTP and SSE
- `GET /mcp/sse`
- `POST <endpoint from the first SSE event>`
- Header required on both requests: `X-API-KEY`
- Allowed API keys are configured through `KYA_MCP_API_KEYS`

### Tools
- `verify_intent`
- `register_agent`
- `get_agent_info`
- stdio mode also exposes `get_credential`

For transport details and remote client setup, see [kya-backend/README_MCP.md](../kya-backend/README_MCP.md).
