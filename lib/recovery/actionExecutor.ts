import { BoundedAction, RecoveryOpportunity } from "./types";
import { getSupabaseClient } from "../supabase/client";
import { applyPolicyGate } from "./policyGate";
import { createDiscountedRazorpayOrder, DiscountedOrderResult } from "./discountedOrder";

const activeOpportunitiesMemory: RecoveryOpportunity[] = [];
export const notificationDispatchLogMemory: Array<{
  opportunityId: string;
  type: string;
  recipient: string;
  message: string;
  dispatchedAt: string;
}> = [];

/**
 * US-5.2: Reminder Notification Dispatch Stub
 * Simulates SMS / WhatsApp / Email notification dispatch for checkout reminder actions
 */
export function sendReminderNotificationStub(
  opportunity: RecoveryOpportunity
): { success: boolean; dispatchLog: any } {
  const recipient = opportunity.sessionId
    ? `Customer Session ${opportunity.sessionId}`
    : `Order ${opportunity.orderId || opportunity.id}`;

  const message =
    `[AT Ornaments Reminder] Hi! You left ₹${opportunity.amount.toLocaleString(
      "en-IN"
    )} of handcrafted jewelry in your cart. ` +
    `Complete your purchase now before stock runs out: https://atornaments.in/checkout?session=${opportunity.sessionId || opportunity.id}`;

  const dispatchLog = {
    opportunityId: opportunity.id,
    type: "checkout_reminder_sms",
    recipient,
    message,
    dispatchedAt: new Date().toISOString(),
  };

  notificationDispatchLogMemory.push(dispatchLog);
  console.log(`[Reminder Notification Stub]: Dispatched to '${recipient}' -> "${message}"`);

  return { success: true, dispatchLog };
}

/**
 * Validates and executes a bounded recovery action, logging execution metrics
 */
export async function executeRecoveryAction(
  opportunity: RecoveryOpportunity,
  action: BoundedAction,
  proposedDiscountPercent?: number
): Promise<{
  success: boolean;
  opportunity: RecoveryOpportunity;
  message: string;
  discountedOrder?: DiscountedOrderResult;
  reminderStub?: any;
}> {
  const proposedDiscount = typeof proposedDiscountPercent === "number" ? proposedDiscountPercent : 0;

  // Pass raw Stage 2 output through Code-Level Policy Gate
  const gateResult = applyPolicyGate(
    { action, discountPercent: proposedDiscount },
    {
      orderPaymentStatus: opportunity.decisionTrace?.orderPaymentStatus,
      paymentAttemptStatus: opportunity.type === "authorized_uncaptured" ? "authorized_not_captured" : undefined,
      previousRetries: opportunity.attemptCount,
      orderId: opportunity.orderId,
      cartTotal: opportunity.amount,
    }
  );

  const gatedAction = gateResult.finalAction as BoundedAction;

  if (gatedAction === "no_action") {
    opportunity.status = opportunity.attemptCount >= 3 ? "failed" : "dismissed";
    opportunity.recommendedAction = "no_action";
    return {
      success: false,
      opportunity,
      message: gateResult.gateOverrides.length
        ? gateResult.gateOverrides[0]
        : "No action required.",
    };
  }

  // Execute Bounded Action
  opportunity.status = "action_taken";
  opportunity.attemptCount += 1;
  opportunity.recommendedAction = gatedAction;

  let discountedOrderResult: DiscountedOrderResult | undefined = undefined;
  let reminderStubResult: any | undefined = undefined;

  // US-5.1: If gated final action is offer_discount, create real discounted Razorpay order passing GATED finalDiscountPercent
  if (gatedAction === "offer_discount" && gateResult.finalDiscountPercent > 0) {
    discountedOrderResult = await createDiscountedRazorpayOrder(
      opportunity.orderId || opportunity.id,
      gateResult.finalDiscountPercent, // PASSING GATED DISCOUNT PERCENT
      opportunity.amount
    );
  }

  // US-5.2: If gated final action is reminder, dispatch reminder notification stub
  if (gatedAction === "remind_customer_to_checkout" || gatedAction === "send_reminder") {
    reminderStubResult = sendReminderNotificationStub(opportunity);
  }

  // Record in Memory
  const idx = activeOpportunitiesMemory.findIndex((o) => o.id === opportunity.id);
  if (idx >= 0) {
    activeOpportunitiesMemory[idx] = opportunity;
  } else {
    activeOpportunitiesMemory.push(opportunity);
  }

  // Sync with Supabase recovery_actions (extended) / recovery_opportunities
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from("recovery_opportunities").upsert({
        opportunity_id: opportunity.id,
        type: opportunity.type,
        session_id: opportunity.sessionId || null,
        order_id: opportunity.orderId || null,
        amount: opportunity.amount,
        currency: opportunity.currency,
        reason: opportunity.reason,
        status: opportunity.status,
        recommended_action: gatedAction,
        ai_explanation: opportunity.aiExplanation,
        revenue_at_risk: opportunity.revenueAtRisk,
        revenue_recovered: opportunity.revenueRecovered,
        attempt_count: opportunity.attemptCount,
        created_at: opportunity.createdAt,
      });

      await supabase.from("recovery_actions").insert({
        opportunity_id: opportunity.id,
        action_type: gatedAction,
        order_id: opportunity.orderId || null,
        session_id: opportunity.sessionId || null,
        attempt_number: opportunity.attemptCount,
        agent_decision: gatedAction,
        ai_confidence: opportunity.decisionTrace?.confidence || 0.9,
        diagnosis_text: opportunity.aiExplanation || opportunity.reason,
        proposed_action: action,
        proposed_discount_percent: proposedDiscount,
        final_action: gatedAction,
        final_discount_percent: gateResult.finalDiscountPercent,
        gate_overrides: gateResult.gateOverrides,
        outcome: opportunity.status,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn("Notice updating recovery_opportunities in Supabase:", err);
    }
  }

  return {
    success: true,
    opportunity,
    message: `Successfully executed recovery action '${gatedAction}'.`,
    discountedOrder: discountedOrderResult,
    reminderStub: reminderStubResult,
  };
}

/**
 * Marks a recovery opportunity as successfully RECOVERED when Razorpay verifies payment
 */
export async function markOpportunityRecovered(orderId: string, amount: number): Promise<boolean> {
  const opp = activeOpportunitiesMemory.find((o) => o.orderId === orderId);
  if (opp) {
    opp.status = "recovered";
    opp.revenueRecovered = amount;
    opp.resolvedAt = new Date().toISOString();
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase
        .from("recovery_opportunities")
        .update({
          status: "recovered",
          revenue_recovered: amount,
          resolved_at: new Date().toISOString(),
        })
        .eq("order_id", orderId);
    } catch (e) {}
  }

  return true;
}
