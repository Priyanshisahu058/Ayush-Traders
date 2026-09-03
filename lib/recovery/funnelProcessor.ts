import { getSupabaseClient } from "../supabase/client";
import { getLocalFunnelEvents, FunnelEventPayload } from "./funnelEvents";
import { FunnelEventInput } from "./stage1Diagnosis";
import { AgentContext, executeTwoStagePipeline } from "./recoveryAgent";
import { executeRecoveryAction } from "./actionExecutor";
import { RecoveryOpportunity } from "./types";

export interface FunnelProcessorResult {
  processedCount: number;
  results: Array<{
    eventId?: string;
    eventType: string;
    orderId?: string;
    cartTotal: number;
    diagnosisText: string;
    proposedAction: string;
    proposedDiscountPercent: number;
    finalAction: string;
    finalDiscountPercent: number;
    gateOverrides: string[];
  }>;
}

/**
 * Reads unprocessed events from `funnel_events` table (or in-memory funnel events)
 * and executes the full Two-Stage Diagnose -> Decide -> Gate pipeline for each event.
 */
export async function processFunnelEvents(): Promise<FunnelProcessorResult> {
  const supabase = getSupabaseClient();
  const eventsToProcess: FunnelEventPayload[] = [];
  const processedResults: FunnelProcessorResult["results"] = [];

  // 1. Fetch unprocessed events from DB or memory store
  if (supabase) {
    try {
      const { data } = await supabase
        .from("funnel_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (data && data.length > 0) {
        for (const row of data) {
          eventsToProcess.push({
            orderId: row.order_id,
            customerId: row.customer_id,
            eventType: row.event_type,
            cartTotal: Number(row.cart_total) || 0,
            timeSinceEventHours: Number(row.time_since_event_hours) || 0,
            paymentAttemptStatus: row.payment_attempt_status,
            customerPurchaseHistoryCount: Number(row.customer_purchase_history_count) || 0,
            productCategory: row.product_category,
            rawContext: row.raw_context || {},
          });
        }
      }
    } catch (e) {
      console.warn("Notice querying funnel_events from Supabase:", e);
    }
  }

  // Fallback to local memory if database has no rows
  if (eventsToProcess.length === 0) {
    const memoryEvents = getLocalFunnelEvents();
    eventsToProcess.push(...memoryEvents);
  }

  // 2. Process each event reading directly from funnel_events data
  for (const eventRow of eventsToProcess) {
    const funnelInput: FunnelEventInput = {
      eventType: eventRow.eventType,
      cartTotal: eventRow.cartTotal,
      timeSinceEventHours: eventRow.timeSinceEventHours || 1.5,
      paymentAttemptStatus: eventRow.paymentAttemptStatus || "unpaid",
      customerPurchaseHistoryCount: eventRow.customerPurchaseHistoryCount || 0,
      productCategory: eventRow.productCategory || "jewellery",
      rawContext: eventRow.rawContext,
    };

    const opportunityType =
      eventRow.eventType === "authorized_not_captured" || eventRow.paymentAttemptStatus === "authorized_not_captured"
        ? "authorized_uncaptured"
        : eventRow.eventType === "payment_failed" || eventRow.paymentAttemptStatus === "failed"
        ? "payment_failure"
        : "cart_abandonment";

    const agentCtx: AgentContext = {
      opportunityType,
      orderId: eventRow.orderId,
      amount: eventRow.cartTotal,
      previousRetries: 0,
      orderPaymentStatus: "Unpaid",
      timeSinceEventHours: eventRow.timeSinceEventHours || 1.5,
      customerPurchaseHistoryCount: eventRow.customerPurchaseHistoryCount || 0,
      paymentAttemptStatus: eventRow.paymentAttemptStatus,
    };

    // Execute full two-stage diagnose -> decide -> gate pipeline
    const pipelineRes = await executeTwoStagePipeline(funnelInput, agentCtx);

    // Build opportunity and execute bounded action
    const opportunity: RecoveryOpportunity = {
      id: `opp_fnl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: opportunityType,
      orderId: eventRow.orderId,
      amount: eventRow.cartTotal,
      currency: "INR",
      reason: pipelineRes.reason,
      status: "action_ready",
      priority: eventRow.cartTotal > 3000 ? "high" : "medium",
      recommendedAction: pipelineRes.finalAction,
      aiExplanation: pipelineRes.diagnosisText,
      attemptCount: 0,
      revenueAtRisk: eventRow.cartTotal,
      revenueRecovered: 0,
      createdAt: new Date().toISOString(),
    };

    await executeRecoveryAction(opportunity, pipelineRes.proposedAction as any, pipelineRes.proposedDiscountPercent);

    processedResults.push({
      eventType: eventRow.eventType,
      orderId: eventRow.orderId,
      cartTotal: eventRow.cartTotal,
      diagnosisText: pipelineRes.diagnosisText,
      proposedAction: pipelineRes.proposedAction,
      proposedDiscountPercent: pipelineRes.proposedDiscountPercent,
      finalAction: pipelineRes.finalAction,
      finalDiscountPercent: pipelineRes.finalDiscountPercent,
      gateOverrides: pipelineRes.gateOverrides,
    });
  }

  return {
    processedCount: processedResults.length,
    results: processedResults,
  };
}
