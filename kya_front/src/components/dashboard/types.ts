export type AgentStatus = "trusted" | "risky" | "unknown";

export interface AgentRecord {
  id: string;
  name: string;
  status: AgentStatus;
  trust: number;
  verifications24h: number;
  rejected24h: number;
  intentCoverage: number;
  reasonSummary: string;
  reasoningLog: string[];
}
