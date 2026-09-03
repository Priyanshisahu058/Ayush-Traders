import { GoogleGenAI, Type } from "@google/genai";
import { BoundedAction, AgentDecision, RecoveryOpportunity } from "./types";
import { getSupabaseClient } from "../supabase/client";
import { applyPolicyGate, DEFAULT_POLICY_STATE, getAgentPolicyState, PolicyState } from "./policyGate";
import { FunnelEventInput, diagnoseRecoveryEvent } from "./stage1Diagnosis";

const GEMINI_MODEL = "gemini-3.6-flash";
const MAX_RETRY_ATTEMPTS = 3;

/**
 * Reconciled Action Enum Validation Set (Problem 4 resolution)
 * Validates model outputs against the complete set of permitted actions across PRD & Stage 2 prompts.
 */
export const ALLOWED_ACTIONS_SET = new Set<string>([
  "retry_payment",
  "retry_payment_link",
  "choose_another_payment_method",
  "remind_customer_to_checkout",
  "send_reminder",
  "offer_discount",
  "wait_and_monitor",
  "no_action",
]);

export const STAGE2_DECISION_SYSTEM_PROMPT = `You are Stage 2: Decision Engine for AT Ornaments Cart Recovery Agent.
Your task is to take the Stage 1 behavioral diagnosis and event context to decide the optimal, safest recovery action and proposed discount percentage.

HARD BUSINESS RULES (FIRST LINE OF DEFENSE):
1. Maximum 10% discount: Proposed discount percentage MUST NOT exceed 10%.
2. No discount if payment_attempt_status is 'authorized_not_captured': Set proposed_discount_percent = 0 and force proposed_action = 'retry_payment_link'.
3. no_action if time_since_event_hours < 1: If less than 1 hour has elapsed since event, output proposed_action = 'no_action' and proposed_discount_percent = 0.
4. Prefer send_reminder over offer_discount for first-time customers (customer_purchase_history_count = 0) with low cart_total (< ₹2500): Recommend 'remind_customer_to_checkout' with 0% discount rather than monetary discount.

PERMITTED ACTIONS:
- 'retry_payment_link' (for technical/network payment glitches)
- 'choose_another_payment_method' (for bank/card declines)
- 'remind_customer_to_checkout' (for cart abandonments & trust nudges)
- 'offer_discount' (only for high-value, price-sensitive cart abandonments where customer has evaluated product)
- 'wait_and_monitor' (for recent events < 1 hour)
- 'no_action' (for paid orders, max retry limits, or budget exhaustion)

OUTPUT FORMAT:
Output strictly valid JSON matching responseSchema with fields: proposed_action, proposed_discount_percent, reason, confidence.`;

const stage2DecisionSchema = {
  type: Type.OBJECT,
  properties: {
    proposed_action: {
      type: Type.STRING,
      description: "Must be ONE of: 'retry_payment_link', 'choose_another_payment_method', 'remind_customer_to_checkout', 'offer_discount', 'wait_and_monitor', 'no_action'",
    },
    proposed_discount_percent: {
      type: Type.NUMBER,
      description: "Proposed discount percentage between 0 and 10 (maximum 10%). Default 0.",
    },
    reason: {
      type: Type.STRING,
      description: "Concise 1-2 sentence explanation of why this action was proposed based on the diagnosis.",
    },
    confidence: {
      type: Type.NUMBER,
      description: "Confidence score between 0.0 and 1.0 based on diagnosis and context.",
    },
  },
  required: ["proposed_action", "proposed_discount_percent", "reason", "confidence"],
};

export interface AgentContext {
  opportunityType: "cart_abandonment" | "payment_failure" | "authorized_uncaptured";
  orderId?: string;
  sessionId?: string;
  amount: number;
  failureCategory?: string;
  previousRetries: number;
  orderPaymentStatus: string;
  timeSinceEventHours?: number;
  customerPurchaseHistoryCount?: number;
  paymentAttemptStatus?: string;
}

export interface DetailedStage2Output {
  proposedAction: string;
  proposedDiscountPercent: number;
  decision: BoundedAction;
  reason: string;
  confidence: number;
  source: "gemini" | "rule_fallback" | "llm_failure_fallback";
}

/**
 * Deterministic Fallback Rules with Discount Path Support
 */
export function getDeterministicDecision(
  ctx: AgentContext,
  allowUnclampedProposalForTesting = false
): DetailedStage2Output {
  let proposedAction = "retry_payment";
  let proposedDiscountPercent = 0;
  let reason = "A recoverable payment failure was detected. Offering customer a payment retry path.";
  let confidence = 0.8;

  if (ctx.opportunityType === "cart_abandonment") {
    // High-value repeat customer cart abandonment -> Propose offer_discount
    if (ctx.amount >= 5000 && (ctx.customerPurchaseHistoryCount ?? 0) >= 1) {
      proposedAction = "offer_discount";
      proposedDiscountPercent = allowUnclampedProposalForTesting ? 25 : 10;
      reason = `High cart value ₹${ctx.amount.toLocaleString("en-IN")} abandoned by repeat customer after ${ctx.timeSinceEventHours ?? 2} hours. Proposing promotional discount incentive.`;
      confidence = 0.92;
    } else {
      proposedAction = "remind_customer_to_checkout";
      proposedDiscountPercent = 0;
      reason = `Customer added ₹${ctx.amount.toLocaleString("en-IN")} of items to cart without completing checkout.`;
      confidence = 0.9;
    }
  } else {
    const cat = (ctx.failureCategory || "unknown").toLowerCase();
    if (cat === "network_failure" || cat === "timeout") {
      proposedAction = "retry_payment";
      reason = "The payment failed due to a temporary network issue. Retrying payment is the safest recovery path.";
      confidence = 0.92;
    } else if (cat === "bank_declined" || cat === "card_declined" || cat === "insufficient_funds") {
      proposedAction = "choose_another_payment_method";
      reason = "The card/bank declined the payment. Recommending another card or UPI option.";
      confidence = 0.88;
    }
  }

  const gateResult = applyPolicyGate(
    { action: proposedAction, discountPercent: proposedDiscountPercent },
    {
      orderPaymentStatus: ctx.orderPaymentStatus,
      paymentAttemptStatus: ctx.opportunityType === "authorized_uncaptured" ? "authorized_not_captured" : ctx.paymentAttemptStatus,
      previousRetries: ctx.previousRetries,
      orderId: ctx.orderId,
      cartTotal: ctx.amount,
      timeSinceEventHours: ctx.timeSinceEventHours,
    }
  );

  const mappedDecision = (gateResult.finalAction === "retry_payment_link" ? "retry_payment" : gateResult.finalAction) as BoundedAction;

  return {
    proposedAction,
    proposedDiscountPercent,
    decision: mappedDecision,
    reason: gateResult.gateOverrides.length ? gateResult.gateOverrides[0] : reason,
    confidence,
    source: "rule_fallback",
  };
}

/**
 * Executes Stage 2 LLM Decision Engine consuming Stage 1 Diagnosis text
 */
export async function evaluateRecoveryAgentDecision(
  ctx: AgentContext,
  diagnosisText?: string,
  allowUnclampedProposalForTesting = false
): Promise<DetailedStage2Output> {
  const fallbackDetailed = getDeterministicDecision(ctx, allowUnclampedProposalForTesting);

  if (ctx.orderPaymentStatus === "Paid" || ctx.previousRetries >= MAX_RETRY_ATTEMPTS) {
    return fallbackDetailed;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes("your-gemini-api-key")) {
    return fallbackDetailed;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const effectiveDiagnosis = diagnosisText || "No diagnosis provided. Evaluate based on event context signals.";
    
    const systemPromptToUse = allowUnclampedProposalForTesting
      ? STAGE2_DECISION_SYSTEM_PROMPT.replace("Maximum 10% discount: Proposed discount percentage MUST NOT exceed 10%.", "Discount percentage may be proposed based on customer value.")
      : STAGE2_DECISION_SYSTEM_PROMPT;

    const prompt = `Given this Stage 1 behavioral diagnosis: "${effectiveDiagnosis}", decide the optimal recovery action for this event context:
- Opportunity Type: ${ctx.opportunityType}
- Order ID: ${ctx.orderId || "N/A"}
- Amount: ₹${ctx.amount}
- Failure Category: ${ctx.failureCategory || "N/A"}
- Previous Retries: ${ctx.previousRetries}
- Time Since Event: ${ctx.timeSinceEventHours ?? 1} hours
- Payment Attempt Status: ${ctx.paymentAttemptStatus || "unpaid"}
- Customer Purchase History Count: ${ctx.customerPurchaseHistoryCount ?? 0}
- Current Order Payment Status: ${ctx.orderPaymentStatus}

Select proposed_action and proposed_discount_percent strictly according to instructions.`;

    const generatePromise = ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: systemPromptToUse,
        responseMimeType: "application/json",
        responseSchema: stage2DecisionSchema,
        temperature: 0.1,
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Stage 2 Gemini API call timed out after 12000ms")), 12000)
    );

    const res = await Promise.race([generatePromise, timeoutPromise]);

    const text = res.text?.trim();
    if (text) {
      const parsed = JSON.parse(text);
      const rawAction = parsed.proposed_action || "retry_payment";
      const rawDiscount = typeof parsed.proposed_discount_percent === "number" ? parsed.proposed_discount_percent : 0;
      const confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0.85;

      if (!ALLOWED_ACTIONS_SET.has(rawAction) && !ALLOWED_ACTIONS_SET.has(rawAction.replace(/_link$/, ""))) {
        return fallbackDetailed;
      }

      const mappedDecision = (rawAction === "retry_payment_link" ? "retry_payment" : rawAction) as BoundedAction;

      return {
        proposedAction: rawAction,
        proposedDiscountPercent: rawDiscount,
        decision: mappedDecision,
        reason: parsed.reason || fallbackDetailed.reason,
        confidence,
        source: "gemini",
      };
    }
  } catch (err: any) {
    console.warn("[Stage 2 Decision] Gemini LLM API failure caught, defaulting safely to no_action with llm_failure_fallback:", err?.message || err);
    return {
      proposedAction: "no_action",
      proposedDiscountPercent: 0,
      decision: "no_action",
      reason: `LLM API Error encountered: ${err?.message || "Gemini Service Failure"}. Defaulted safely to no_action per reliability safety policy.`,
      confidence: 0.0,
      source: "llm_failure_fallback",
    };
  }

  return fallbackDetailed;
}

/**
 * Executes Full Two-Stage LLM Pipeline (Stage 1 Diagnosis -> Stage 2 Decision -> Code-Level Policy Gate)
 */
export async function executeTwoStagePipeline(
  eventInput: FunnelEventInput,
  ctx: AgentContext,
  overridePolicyState?: Partial<PolicyState>,
  allowUnclampedProposalForTesting = false
): Promise<{
  diagnosisText: string;
  proposedAction: string;
  proposedDiscountPercent: number;
  finalAction: BoundedAction;
  finalDiscountPercent: number;
  gateOverrides: string[];
  reason: string;
  confidence: number;
  source: "gemini" | "rule_fallback" | "llm_failure_fallback";
}> {
  const diagnosisText = await diagnoseRecoveryEvent(eventInput);
  const decisionResult = await evaluateRecoveryAgentDecision(ctx, diagnosisText, allowUnclampedProposalForTesting);

  const activePolicyState = overridePolicyState
    ? { ...DEFAULT_POLICY_STATE, ...overridePolicyState }
    : await getAgentPolicyState();

  const gateResult = applyPolicyGate(
    { action: decisionResult.proposedAction, discountPercent: decisionResult.proposedDiscountPercent },
    {
      orderPaymentStatus: ctx.orderPaymentStatus,
      paymentAttemptStatus: eventInput.paymentAttemptStatus || (ctx.opportunityType === "authorized_uncaptured" ? "authorized_not_captured" : undefined),
      previousRetries: ctx.previousRetries,
      orderId: ctx.orderId,
      cartTotal: ctx.amount,
      timeSinceEventHours: eventInput.timeSinceEventHours || ctx.timeSinceEventHours,
    },
    activePolicyState
  );

  return {
    diagnosisText,
    proposedAction: decisionResult.proposedAction,
    proposedDiscountPercent: decisionResult.proposedDiscountPercent,
    finalAction: gateResult.finalAction as BoundedAction,
    finalDiscountPercent: gateResult.finalDiscountPercent,
    gateOverrides: gateResult.gateOverrides,
    reason: decisionResult.reason,
    confidence: decisionResult.confidence,
    source: decisionResult.source,
  };
}
