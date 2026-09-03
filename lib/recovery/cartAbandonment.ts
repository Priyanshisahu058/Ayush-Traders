import { CheckoutEvent, RecoveryOpportunity } from "./types";
import { getSupabaseClient } from "../supabase/client";
import { recordFunnelEvent } from "./funnelEvents";

// Set to prevent duplicate abandonment processing per session
const processedAbandonmentSessions = new Set<string>();
const localAbandonmentOpportunities: RecoveryOpportunity[] = [];

export interface AbandonmentCheckOptions {
  sessionId: string;
  cartValue: number;
  itemsCount: number;
  lastActivityTime?: string;
  inactivityThresholdMs?: number; // default 15 minutes = 900,000 ms
  forceTestMode?: boolean;
}

/**
 * Deterministically checks whether a session constitutes a cart abandonment opportunity
 */
export async function detectCartAbandonment(
  options: AbandonmentCheckOptions
): Promise<{ isAbandoned: boolean; opportunity?: RecoveryOpportunity }> {
  const { sessionId, cartValue, itemsCount, lastActivityTime, inactivityThresholdMs = 15 * 60 * 1000, forceTestMode = false } = options;

  // Rule 1: Must have items and cart value > 0
  if (itemsCount <= 0 || cartValue <= 0) {
    return { isAbandoned: false };
  }

  // Rule 2: Idempotency check - ignore if already generated opportunity
  if (processedAbandonmentSessions.has(sessionId)) {
    const existing = localAbandonmentOpportunities.find((o) => o.sessionId === sessionId);
    return { isAbandoned: true, opportunity: existing };
  }

  // Rule 3: Check activity inactivity time
  const now = Date.now();
  const lastActive = lastActivityTime ? new Date(lastActivityTime).getTime() : now;
  const elapsed = now - lastActive;

  if (!forceTestMode && elapsed < inactivityThresholdMs) {
    return { isAbandoned: false };
  }

  // Rule 4: Verify DB that no successful payment exists for this session
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data: paidEvent } = await supabase
        .from("checkout_events")
        .select("id")
        .eq("session_id", sessionId)
        .eq("event_type", "payment_success")
        .maybeSingle();

      if (paidEvent) {
        return { isAbandoned: false }; // Already paid!
      }
    } catch (e) {}
  }

  // Create idempotent recovery opportunity for abandoned cart
  processedAbandonmentSessions.add(sessionId);
  const nowIso = new Date().toISOString();
  const opportunity: RecoveryOpportunity = {
    id: `opp_abn_${Date.now()}_${sessionId.slice(0, 6)}`,
    type: "cart_abandonment",
    sessionId,
    amount: cartValue,
    currency: "INR",
    reason: `Cart abandoned with ${itemsCount} item(s) worth ₹${cartValue.toLocaleString("en-IN")}.`,
    status: "action_ready",
    priority: cartValue > 3000 ? "high" : "medium",
    recommendedAction: "remind_customer_to_checkout",
    aiExplanation: `The customer added ₹${cartValue.toLocaleString("en-IN")} of products and reached checkout but did not complete payment. No successful payment exists, so this cart is eligible for a recovery reminder.`,
    attemptCount: 0,
    revenueAtRisk: cartValue,
    revenueRecovered: 0,
    createdAt: nowIso,
    decisionTrace: {
      eventType: "cart_abandonment",
      previousRetries: 0,
      orderPaymentStatus: "unpaid",
      retryAllowed: true,
      agentDecision: "remind_customer_to_checkout",
      confidence: 0.95,
      source: "rule_fallback",
    },
  };

  localAbandonmentOpportunities.push(opportunity);

  // Write directly into standalone funnel_events table
  const elapsedHours = Number((elapsed / (1000 * 60 * 60)).toFixed(2));
  await recordFunnelEvent({
    eventType: "cart_abandoned",
    cartTotal: cartValue,
    timeSinceEventHours: elapsedHours,
    paymentAttemptStatus: "unpaid",
    rawContext: { sessionId, itemsCount, lastActivityTime },
  });

  await saveOpportunityToSupabase(opportunity);

  return { isAbandoned: true, opportunity };
}

async function saveOpportunityToSupabase(opportunity: RecoveryOpportunity) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    await supabase.from("recovery_opportunities").insert({
      opportunity_id: opportunity.id,
      type: opportunity.type,
      session_id: opportunity.sessionId || null,
      order_id: opportunity.orderId || null,
      amount: opportunity.amount,
      currency: opportunity.currency,
      reason: opportunity.reason,
      status: opportunity.status,
      recommended_action: opportunity.recommendedAction,
      ai_explanation: opportunity.aiExplanation,
      revenue_at_risk: opportunity.revenueAtRisk,
      revenue_recovered: opportunity.revenueRecovered,
      created_at: opportunity.createdAt,
    });
  } catch (e) {
    console.warn("Notice saving recovery opportunity to Supabase:", e);
  }
}
