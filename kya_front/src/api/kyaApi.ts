import { z } from "zod";

const HealthResponseSchema = z.object({
  status: z.string(),
  service: z.string().optional(),
});

const RegisterResponseSchema = z.object({
  agent_id: z.string(),
  pda_address: z.string(),
  intent_log_address: z.string(),
  transaction_signature: z.string(),
});

const AgentResponseSchema = z.object({
  owner: z.string(),
  agent_record_address: z.string(),
  trust_level: z.number().int().min(0).max(100),
  agent_name: z.string(),
  description: z.string().optional(),
  max_amount: z.number().nonnegative(),
  total_logs: z.number().int().nonnegative(),
  bump: z.number().int().min(0).max(255),
  created_at: z.number().int().nonnegative().optional(),
});

const AgentListResponseSchema = z.object({
  items: z.array(AgentResponseSchema),
});

const VerifyIntentResponseSchema = z.object({
  decision: z.union([z.literal("approve"), z.literal("reject"), z.literal("escalate")]),
  reasoning: z.string(),
  risk_level: z.number().min(0).max(100),
  intent_log_signature: z.string().nullable(),
  intent_id: z.number().int().nonnegative().nullable().optional(),
  total_logs: z.number().int().nonnegative().optional(),
  updated_trust_level: z.number().int().min(0).max(100).optional(),
});

const AgentLogSchema = z.object({
  intent_id: z.number().int().nonnegative(),
  decision: z.union([z.literal("approve"), z.literal("reject"), z.literal("escalate")]),
  is_approved: z.boolean(),
  timestamp: z.number().int().nonnegative(),
  action: z.union([z.literal("transfer"), z.literal("pay"), z.literal("swap"), z.literal("unknown")]),
  amount_sol: z.number().nonnegative(),
  recipient: z.string(),
  risk_level: z.number().min(0).max(100),
  reasoning: z.string(),
  tx_signature: z.string().nullable(),
  intent_text: z.string(),
});

const AgentLogsResponseSchema = z.object({
  owner: z.string(),
  intent_log_address: z.string(),
  logs: z.array(AgentLogSchema),
});

function apiBaseUrl() {
  const raw = import.meta.env.VITE_KYA_API_URL as string | undefined;
  const url = (raw ?? "").trim();
  if (!url) throw new Error("Missing VITE_KYA_API_URL. Set it in .env (e.g. http://localhost:8000).");
  return url.replace(/\/+$/, "");
}

function toUrl(path: string) {
  if (!path.startsWith("/")) path = `/${path}`;
  return `${apiBaseUrl()}${path}`;
}

async function readJsonOrThrow(res: Response) {
  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    if (typeof data === "object" && data) {
      const errorField = (data as Record<string, unknown>).error;
      if (typeof errorField === "string" && errorField.trim()) {
        msg = `API error: ${errorField}`;
      }
    }
    throw new Error(msg);
  }
  return data;
}

async function get<T>(path: string, schema: z.ZodSchema<T>): Promise<T> {
  const res = await fetch(toUrl(path), { method: "GET" });
  const json = await readJsonOrThrow(res);
  return schema.parse(json);
}

async function post<T>(
  path: string,
  body: unknown,
  schema: z.ZodSchema<T>,
): Promise<T> {
  const res = await fetch(toUrl(path), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await readJsonOrThrow(res);
  return schema.parse(json);
}

export async function health() {
  return get("/health", HealthResponseSchema);
}

const LAMPORTS_PER_SOL = 1_000_000_000;
export function solToLamports(sol: number) {
  const n = Number.isFinite(sol) ? sol : 0;
  return String(Math.max(0, Math.round(n * LAMPORTS_PER_SOL)));
}

export function lamportsToSol(lamportsLike: number) {
  const n = Number.isFinite(lamportsLike) ? lamportsLike : 0;
  return n / LAMPORTS_PER_SOL;
}

export async function registerAgentApi(input: { agent_name: string; description?: string; max_amount_lamports: string }) {
  return post(
    "/agents/register",
    { agent_name: input.agent_name, description: input.description, max_amount: input.max_amount_lamports },
    RegisterResponseSchema,
  );
}

export async function getAgentApi(agentId: string) {
  return get(`/agents/${encodeURIComponent(agentId)}`, AgentResponseSchema);
}

export async function listAgentsApi() {
  return get("/agents", AgentListResponseSchema);
}

export async function getAgentLogsApi(agentId: string) {
  return get(`/agents/${encodeURIComponent(agentId)}/logs`, AgentLogsResponseSchema);
}

export async function verifyIntentApi(input: {
  agent_id?: string;
  intent_text: string;
  context_json?: string | null;
  action?: "transfer" | "pay" | "swap";
  amount_sol?: number;
  recipient?: string;
}) {
  return post("/verify-intent", input, VerifyIntentResponseSchema);
}

export type AgentLogsResponse = z.infer<typeof AgentLogsResponseSchema>;
export type AgentLog = z.infer<typeof AgentLogSchema>;
export type VerifyIntentResponse = z.infer<typeof VerifyIntentResponseSchema>;
export type AgentResponse = z.infer<typeof AgentResponseSchema>;
