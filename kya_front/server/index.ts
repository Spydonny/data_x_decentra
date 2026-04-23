import cors from "cors";
import express from "express";
import { z } from "zod";

type Agent = {
  owner: string; // base58 pubkey owner (agent_id)
  agentName: string;
  description: string;
  maxAmount: bigint;
  trustLevel: number; // 0..100
  agentRecordAddress: string;
  intentLogAddress: string;
  bump: number; // 0..255
  nextIntentId: number;
  createdAt: number;
  logs: Array<{
    intent_id: number;
    decision: "approve" | "reject" | "escalate";
    is_approved: boolean;
    timestamp: number;
    action: "transfer" | "pay" | "swap" | "unknown";
    amount_sol: number;
    recipient: string;
    risk_level: number;
    reasoning: string;
    tx_signature: string | null;
    intent_text: string;
  }>;
};

const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomBase58(len: number) {
  let out = "";
  for (let i = 0; i < len; i += 1) out += BASE58[randInt(0, BASE58.length - 1)];
  return out;
}
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
async function jitter(min = 500, max = 1500) {
  const ms = randInt(min, max);
  await sleep(ms);
  return ms;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

const agents = new Map<string, Agent>();

const app = express();
app.use(cors());
app.use(express.json({ limit: "256kb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "kya-api" });
});

const RegisterSchema = z.object({
  agent_name: z.string().min(1).max(256),
  description: z.string().max(2000).optional(),
  max_amount: z.union([z.number().int().nonnegative(), z.string().regex(/^\d+$/)]),
});

function safeMaxAmount(maxAmount: bigint) {
  return Number(maxAmount <= BigInt(Number.MAX_SAFE_INTEGER) ? maxAmount : BigInt(Number.MAX_SAFE_INTEGER));
}

function agentView(agent: Agent) {
  return {
    owner: agent.owner,
    agent_record_address: agent.agentRecordAddress,
    trust_level: agent.trustLevel,
    agent_name: agent.agentName,
    description: agent.description,
    max_amount: safeMaxAmount(agent.maxAmount),
    total_logs: agent.logs.length,
    bump: agent.bump,
    created_at: agent.createdAt,
  };
}

app.post("/agents/register", async (req, res) => {
  await jitter(650, 1250);
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
    return;
  }

  const owner = randomBase58(44);
  const maxAmount =
    typeof parsed.data.max_amount === "string" ? BigInt(parsed.data.max_amount) : BigInt(parsed.data.max_amount);

  const agent: Agent = {
    owner,
    agentName: parsed.data.agent_name,
    description: parsed.data.description?.trim() || "No description provided.",
    maxAmount,
    trustLevel: randInt(0, 25),
    agentRecordAddress: randomBase58(44),
    intentLogAddress: randomBase58(44),
    bump: randInt(0, 255),
    nextIntentId: randInt(100, 900),
    createdAt: Date.now(),
    logs: [],
  };
  agents.set(owner, agent);

  res.json({
    agent_id: agent.owner,
    pda_address: agent.agentRecordAddress,
    intent_log_address: agent.intentLogAddress,
    transaction_signature: randomBase58(88),
  });
});

app.get("/agents", async (_req, res) => {
  await jitter(220, 520);
  const items = [...agents.values()]
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((agent) => agentView(agent));
  res.json({ items });
});

function isBase58Pubkey(s: string) {
  if (typeof s !== "string") return false;
  if (s.length < 32 || s.length > 50) return false;
  for (const ch of s) if (!BASE58.includes(ch)) return false;
  return true;
}

app.get("/agents/:agent_id", async (req, res) => {
  await jitter(500, 950);
  const agentId = req.params.agent_id;
  if (!isBase58Pubkey(agentId)) {
    res.status(400).json({ error: "invalid_agent_id" });
    return;
  }
  const agent = agents.get(agentId);
  if (!agent) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  res.json(agentView(agent));
});

app.get("/agents/:agent_id/logs", async (req, res) => {
  await jitter(600, 1200);
  const agentId = req.params.agent_id;
  if (!isBase58Pubkey(agentId)) {
    res.status(400).json({ error: "invalid_agent_id" });
    return;
  }
  const agent = agents.get(agentId);
  if (!agent) {
    res.status(404).json({ error: "not_found" });
    return;
  }

  res.json({
    owner: agent.owner,
    intent_log_address: agent.intentLogAddress,
    logs: agent.logs,
  });
});

const VerifySchema = z.object({
  agent_id: z.string().optional(),
  intent_text: z.string().min(1),
  context_json: z.union([z.string(), z.null()]).optional(),
  action: z.enum(["transfer", "pay", "swap"]).optional(),
  amount_sol: z.number().nonnegative().optional(),
  recipient: z.string().min(1).max(256).optional(),
});

function computeRisk(intentText: string, contextJson?: string | null) {
  const t = intentText.toLowerCase();
  let risk = 12;

  if (t.includes("transfer")) risk += 10;
  if (t.includes("send")) risk += 8;
  if (t.includes("drain")) risk += 55;
  if (t.includes("withdraw")) risk += 18;
  if (t.includes("all funds") || t.includes("everything")) risk += 45;
  if (t.includes("unknown") || t.includes("new address")) risk += 22;
  if (t.includes("bypass") || t.includes("ignore policy")) risk += 40;

  if (contextJson && contextJson.trim() !== "" && contextJson.trim() !== "{}") risk -= 6;
  risk += randInt(-6, 14);

  return clamp(risk, 0, 100);
}

function decide(risk: number) {
  if (risk >= 78) return "reject" as const;
  if (risk >= 48) return "escalate" as const;
  return "approve" as const;
}

function trustDeltaFor(decision: "approve" | "reject" | "escalate", riskScore01: number) {
  if (decision === "approve") return clamp(Math.round((0.9 - riskScore01) * 3), 1, 3);
  if (decision === "escalate") return -clamp(Math.round((riskScore01 - 0.35) * 4), 1, 4);
  return -clamp(Math.round((riskScore01 + 0.15) * 5), 2, 8);
}

function inferAction(intentText: string): "transfer" | "pay" | "swap" | "unknown" {
  const lowered = intentText.toLowerCase();
  if (lowered.includes("transfer")) return "transfer";
  if (lowered.includes("pay")) return "pay";
  if (lowered.includes("swap")) return "swap";
  return "unknown";
}

function inferAmountSol(intentText: string) {
  const match = intentText.match(/(\d+(?:\.\d+)?)\s*sol/i);
  if (!match) return 0;
  const value = Number(match[1]);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function inferRecipient(intentText: string) {
  const arrowIdx = intentText.indexOf("->");
  if (arrowIdx < 0) return "unknown";
  const tail = intentText.slice(arrowIdx + 2).trim();
  if (!tail) return "unknown";
  const contextSplit = tail.indexOf("|");
  const recipient = contextSplit >= 0 ? tail.slice(0, contextSplit).trim() : tail;
  return recipient.length > 0 ? recipient.slice(0, 128) : "unknown";
}

app.post("/verify-intent", async (req, res) => {
  const parsed = VerifySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_request", details: parsed.error.flatten() });
    return;
  }

  let agent: Agent | null = null;
  if (parsed.data.agent_id) {
    if (!isBase58Pubkey(parsed.data.agent_id)) {
      res.status(400).json({ error: "invalid_agent_id" });
      return;
    }
    const found = agents.get(parsed.data.agent_id);
    if (!found) {
      res.status(404).json({ error: "not_found" });
      return;
    }
    agent = found;
  }

  // Step-like delays (no streaming, but never instant).
  await jitter(500, 1500); // intent parsing
  await jitter(500, 1500); // policy matching
  await jitter(500, 1500); // risk scoring
  await jitter(500, 1500); // tx simulation
  await jitter(500, 1500); // decision

  const risk = computeRisk(parsed.data.intent_text, parsed.data.context_json);
  const decision = decide(risk);

  const reasoning =
    decision === "reject"
      ? "Rejected due to elevated risk score and intent keywords indicating unsafe operation."
      : decision === "escalate"
        ? "Escalated due to moderate risk score and insufficient context for deterministic approval."
        : "Intent looks routine and non-harmful under simulated policy constraints.";

  const maybeSig = Math.random() < 0.35 ? randomBase58(88) : null;
  let intentId: number | null = null;

  if (agent) {
    intentId = agent.nextIntentId;
    agent.nextIntentId += 1;

    const action = parsed.data.action ?? inferAction(parsed.data.intent_text);
    const amountSol = parsed.data.amount_sol ?? inferAmountSol(parsed.data.intent_text);
    const recipient = parsed.data.recipient ?? inferRecipient(parsed.data.intent_text);
    const riskScore01 = clamp(risk / 100, 0, 1);

    agent.trustLevel = clamp(agent.trustLevel + trustDeltaFor(decision, riskScore01), 0, 100);

    agent.logs.push({
      intent_id: intentId,
      decision,
      is_approved: decision === "approve",
      timestamp: Date.now(),
      action,
      amount_sol: amountSol,
      recipient,
      risk_level: risk,
      reasoning,
      tx_signature: maybeSig,
      intent_text: parsed.data.intent_text,
    });
  }

  res.json({
    decision,
    reasoning,
    risk_level: risk,
    intent_log_signature: maybeSig,
    intent_id: intentId,
    total_logs: agent ? agent.logs.length : undefined,
    updated_trust_level: agent ? agent.trustLevel : undefined,
  });
});

const port = Number(process.env.PORT || 8000);
app.listen(port, () => {
  console.log(`[kya-api] listening on http://localhost:${port}`);
});
