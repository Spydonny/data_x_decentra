export type AgentStatus = "trusted" | "risky" | "unknown";

export type VerificationDecision = "approve" | "reject" | "flag";

export type VerificationStepId =
  | "intent_parsing"
  | "policy_matching"
  | "risk_scoring"
  | "tx_preflight"
  | "execution_decision";

export type VerificationStepStatus = "pending" | "running" | "success" | "warning" | "error";

export type VerificationStep = {
  id: VerificationStepId;
  title: string;
  status: VerificationStepStatus;
  summary: string;
  log: string[];
  startedAt?: number;
  completedAt?: number;
  durationMs?: number;
};

export type AgentDecisionEvent = {
  id: string;
  timestamp: number;
  decision: VerificationDecision;
  action: string;
  amountSol: number;
  recipient: string;
  reason: string;
  riskScore: number; // 0..1
  txSig: string;
  steps: VerificationStep[];
};

export type AgentRecord = {
  id: string;
  name: string;
  description: string;
  pdaAddress: string;
  status: AgentStatus;
  trustScore: number; // 0..100
  transactionLimitSol: number;
  totalChecks: number;
  rejectedActions: number;
  intentCoveragePct: number;
  createdAt: number;
  behavior: "safe" | "malicious" | "unknown";
  decisionHistory: AgentDecisionEvent[];
};

export type ExplorerFeedItem = {
  id: string;
  timestamp: number;
  agentId: string;
  agentName: string;
  action: string;
  amountSol: number;
  recipient: string;
  decision: VerificationDecision;
  reasonShort: string;
  recordTag: "Verification record";
};

export type VerificationRequest = {
  agentId: string;
  action: "transfer" | "pay" | "swap";
  amountSol: number;
  recipient: string;
  context?: string;
};

export type VerificationResult = {
  request: VerificationRequest;
  decision: VerificationDecision;
  reason: string;
  reasonShort: string;
  riskScore: number;
  trustDelta: number;
  updatedTrustScore: number;
  txSig: string;
  steps: VerificationStep[];
  wroteMockChainRecord: boolean;
  timestamp: number;
};
