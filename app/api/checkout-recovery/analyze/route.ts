import { NextResponse } from "next/server";
import { executeTwoStagePipeline } from "@/lib/recovery/recoveryAgent";
import { RecoveryOpportunity } from "@/lib/recovery/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      opportunityType,
      orderId,
      sessionId,
      amount,
      failureCategory,
      previousRetries,
      orderPaymentStatus,
      timeSinceEventHours,
      customerPurchaseHistoryCount,
      paymentAttemptStatus,
      allowUnclampedProposalForTesting,
      overridePolicyState,
    } = body;

    const ctx = {
      opportunityType: (opportunityType || "cart_abandonment") as any,
      orderId,
      sessionId,
      amount: typeof amount === "number" ? amount : parseFloat(amount || "0"),
      failureCategory,
      previousRetries: typeof previousRetries === "number" ? previousRetries : 0,
      orderPaymentStatus: orderPaymentStatus || "Unpaid",
      timeSinceEventHours: typeof timeSinceEventHours === "number" ? timeSinceEventHours : 1.5,
      customerPurchaseHistoryCount: typeof customerPurchaseHistoryCount === "number" ? customerPurchaseHistoryCount : 0,
      paymentAttemptStatus,
    };

    const funnelInput = {
      eventType: opportunityType || "cart_abandoned",
      cartTotal: ctx.amount,
      timeSinceEventHours: ctx.timeSinceEventHours,
      paymentAttemptStatus: ctx.paymentAttemptStatus || "unpaid",
      customerPurchaseHistoryCount: ctx.customerPurchaseHistoryCount,
      productCategory: "jewellery",
    };

    const pipelineRes = await executeTwoStagePipeline(
      funnelInput,
      ctx,
      overridePolicyState,
      allowUnclampedProposalForTesting
    );

    const decision = {
      proposedAction: pipelineRes.proposedAction,
      proposedDiscountPercent: pipelineRes.proposedDiscountPercent,
      decision: pipelineRes.finalAction,
      finalDiscountPercent: pipelineRes.finalDiscountPercent,
      reason: pipelineRes.gateOverrides.length > 0 ? pipelineRes.gateOverrides[0] : pipelineRes.reason,
      gateOverrides: pipelineRes.gateOverrides,
      confidence: pipelineRes.confidence,
      source: pipelineRes.source,
    };

    const opportunity: RecoveryOpportunity = {
      id: `opp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: ctx.opportunityType,
      orderId,
      sessionId,
      amount: ctx.amount,
      currency: "INR",
      reason: decision.reason,
      status: "action_ready",
      priority: ctx.amount > 3000 ? "high" : "medium",
      recommendedAction: decision.decision,
      aiExplanation: pipelineRes.diagnosisText,
      attemptCount: ctx.previousRetries,
      revenueAtRisk: ctx.amount,
      revenueRecovered: 0,
      createdAt: new Date().toISOString(),
      decisionTrace: {
        eventType: ctx.opportunityType,
        failureCategory: ctx.failureCategory,
        previousRetries: ctx.previousRetries,
        orderPaymentStatus: ctx.orderPaymentStatus,
        retryAllowed: ctx.previousRetries < 3 && ctx.orderPaymentStatus !== "Paid",
        agentDecision: decision.decision,
        confidence: decision.confidence,
        source: decision.source,
      },
    };

    return NextResponse.json({
      success: true,
      decision,
      opportunity,
    });
  } catch (err: any) {
    console.error("Checkout recovery analyze error:", err);
    return NextResponse.json(
      {
        success: false,
        decision: {
          decision: "retry_payment",
          reason: "Payment failure detected. Retry option provided as safe default.",
          confidence: 0.7,
          source: "rule_fallback",
        },
      },
      { status: 200 }
    );
  }
}
