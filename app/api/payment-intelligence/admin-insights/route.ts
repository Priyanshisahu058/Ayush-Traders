import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase/client";
import { GoogleGenAI } from "@google/genai";

export async function GET() {
  try {
    const supabase = getSupabaseClient();

    let events: any[] = [];
    let recoveryEvents: any[] = [];

    if (supabase) {
      try {
        const { data: evData } = await supabase.from("payment_events").select("*");
        if (evData) events = evData;

        const { data: recData } = await supabase.from("payment_recovery_events").select("*");
        if (recData) recoveryEvents = recData;
      } catch (e) {
        console.warn("Notice querying payment analytics from DB:", e);
      }
    }

    // -------------------------------------------------------------
    // Unique Payment Attempt Correlation & Deduplication Engine
    // -------------------------------------------------------------
    // Group raw lifecycle events by unique payment/order attempt correlation key
    const attemptGroups: Record<string, { orderId: string; statuses: Set<string>; reasons: Set<string> }> = {};

    events.forEach((e) => {
      const key = e.razorpay_payment_id || (e.razorpay_order_id ? `${e.order_id}_${e.razorpay_order_id}` : `${e.order_id}_att_${e.attempt_number || 1}`);
      if (!attemptGroups[key]) {
        attemptGroups[key] = {
          orderId: e.order_id || "unknown",
          statuses: new Set(),
          reasons: new Set(),
        };
      }
      if (e.status) attemptGroups[key].statuses.add(e.status.toLowerCase());
      if (e.event_type) attemptGroups[key].statuses.add(e.event_type.toLowerCase());
      if (e.failure_reason) attemptGroups[key].reasons.add(e.failure_reason);
    });

    let totalAttempts = 0;
    let successfulPayments = 0;
    let failedPayments = 0;
    const orderOutcomeMap: Record<string, { failed: boolean; captured: boolean }> = {};

    Object.entries(attemptGroups).forEach(([_, group]) => {
      const statuses = group.statuses;
      const isCaptured = statuses.has("captured") || statuses.has("paid") || statuses.has("payment.captured");
      const isFailed = statuses.has("failed") || statuses.has("payment.failed") || statuses.has("declined");

      if (isCaptured || isFailed || statuses.has("attempted") || statuses.has("created")) {
        totalAttempts++;
        if (isCaptured) {
          successfulPayments++;
        } else if (isFailed) {
          failedPayments++;
        }

        if (!orderOutcomeMap[group.orderId]) {
          orderOutcomeMap[group.orderId] = { failed: false, captured: false };
        }
        if (isFailed) orderOutcomeMap[group.orderId].failed = true;
        if (isCaptured) orderOutcomeMap[group.orderId].captured = true;
      }
    });

    const successRate = totalAttempts > 0 ? parseFloat(((successfulPayments / totalAttempts) * 100).toFixed(1)) : 0;

    // Calculate most common failure category from real database recovery events & failed attempts
    const failureCategoryCounts: Record<string, number> = {};
    recoveryEvents.forEach((r) => {
      const cat = r.failure_category || "unknown";
      if (cat !== "unknown") {
        failureCategoryCounts[cat] = (failureCategoryCounts[cat] || 0) + 1;
      }
    });

    let mostCommonFailure = "No failure data";
    let maxCount = 0;
    Object.entries(failureCategoryCounts).forEach(([cat, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonFailure = cat;
      }
    });

    // Count recovered payment attempts (orders with at least 1 failed attempt followed by a verified captured payment)
    let recoveredCount = 0;
    Object.values(orderOutcomeMap).forEach((outcome) => {
      if (outcome.failed && outcome.captured) {
        recoveredCount++;
      }
    });

    const recoveryRate = failedPayments > 0 ? parseFloat(((recoveredCount / failedPayments) * 100).toFixed(1)) : 0;

    // Statistical Summary from real records
    let aiSummary = totalAttempts === 0
      ? "Insufficient data to generate payment summary."
      : `Analyzed ${totalAttempts} unique payment attempt(s) with a ${successRate}% success rate. Most frequent issue: ${mostCommonFailure.replace(/_/g, " ")}.`;

    // Prompt Gemini for Merchant AI Summary based STRICTLY on calculated metrics
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && !apiKey.includes("your-gemini-api-key") && totalAttempts > 0) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const res = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: `You are an AI payment analytics assistant for an ecommerce store.
Summarize these EXACT database payment metrics in 2 professional sentences for the merchant dashboard.
DO NOT change or invent any numbers.
- Total Payment Attempts: ${totalAttempts}
- Successful Payments: ${successfulPayments}
- Failed Payments: ${failedPayments}
- Success Rate: ${successRate}%
- Most Common Failure Reason: ${mostCommonFailure}
- Recovered Failed Payments: ${recoveredCount}
- Recovery Rate: ${recoveryRate}%`,
        });

        if (res.text?.trim()) {
          aiSummary = res.text.trim();
        }
      } catch (err) {
        console.warn("Gemini merchant summary notice:", err);
      }
    }

    return NextResponse.json({
      success: true,
      metrics: {
        totalAttempts,
        successfulPayments,
        failedPayments,
        successRate,
        mostCommonFailure,
        recoveredCount,
        recoveryRate,
        aiSummary,
      },
    });
  } catch (err: any) {
    console.error("Admin insights API error:", err);
    return NextResponse.json(
      {
        success: false,
        metrics: {
          totalAttempts: 0,
          successfulPayments: 0,
          failedPayments: 0,
          successRate: 0,
          mostCommonFailure: "unknown",
          recoveredCount: 0,
          recoveryRate: 0,
          aiSummary: "Not enough data available yet to compute payment recovery analytics.",
        },
      },
      { status: 200 }
    );
  }
}
