import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase/client";

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    let opportunities: any[] = [];
    let events: any[] = [];

    if (supabase) {
      try {
        const { data: oppData } = await supabase.from("recovery_opportunities").select("*").order("created_at", { ascending: false });
        if (oppData) opportunities = oppData;

        const { data: evData } = await supabase.from("checkout_events").select("*");
        if (evData) events = evData;
      } catch (e) {
        console.warn("Notice reading recovery metrics from Supabase DB:", e);
      }
    }

    const totalOpportunities = opportunities.length;
    const cartAbandonments = opportunities.filter((o) => o.type === "cart_abandonment").length;
    const paymentFailures = opportunities.filter((o) => o.type === "payment_failure").length;

    const revenueAtRisk = opportunities.reduce((sum, o) => sum + parseFloat(o.revenue_at_risk || o.amount || "0"), 0);
    const revenueRecovered = opportunities.reduce((sum, o) => sum + parseFloat(o.revenue_recovered || "0"), 0);

    const recoveryAttempts = opportunities.filter((o) => (o.attempt_count || 0) > 0 || o.status === "action_taken" || o.status === "recovered").length;
    const successfulRecoveries = opportunities.filter((o) => o.status === "recovered" || (parseFloat(o.revenue_recovered || "0") > 0)).length;

    const recoveryRate = recoveryAttempts > 0 ? parseFloat(((successfulRecoveries / recoveryAttempts) * 100).toFixed(1)) : 0;

    // Calculate top reason & top action
    const actionCounts: Record<string, number> = {};
    opportunities.forEach((o) => {
      const act = o.recommended_action || "retry_payment";
      actionCounts[act] = (actionCounts[act] || 0) + 1;
    });

    let topAction = "retry_payment";
    let maxActCount = 0;
    Object.entries(actionCounts).forEach(([act, cnt]) => {
      if (cnt > maxActCount) {
        maxActCount = cnt;
        topAction = act;
      }
    });

    let topReason = "Bank declined transaction";
    if (cartAbandonments > paymentFailures) {
      topReason = "Uncompleted checkout session";
    }

    return NextResponse.json({
      success: true,
      metrics: {
        totalOpportunities,
        cartAbandonments,
        paymentFailures,
        revenueAtRisk,
        recoveryAttempts,
        successfulRecoveries,
        revenueRecovered,
        recoveryRate,
        topReason,
        topAction,
      },
      opportunities: opportunities.slice(0, 10).map((o) => ({
        id: o.opportunity_id || o.id,
        type: o.type,
        amount: parseFloat(o.amount || "0"),
        reason: o.reason || "Payment failure detected",
        recommendedAction: o.recommended_action || "retry_payment",
        status: o.status || "action_ready",
        aiExplanation: o.ai_explanation,
        revenueAtRisk: parseFloat(o.revenue_at_risk || o.amount || "0"),
        revenueRecovered: parseFloat(o.revenue_recovered || "0"),
        createdAt: o.created_at,
      })),
    });
  } catch (err: any) {
    console.error("Admin checkout recovery metrics API error:", err);
    return NextResponse.json(
      {
        success: false,
        metrics: {
          totalOpportunities: 0,
          cartAbandonments: 0,
          paymentFailures: 0,
          revenueAtRisk: 0,
          recoveryAttempts: 0,
          successfulRecoveries: 0,
          revenueRecovered: 0,
          recoveryRate: 0,
          topReason: "None",
          topAction: "no_action",
        },
        opportunities: [],
      },
      { status: 200 }
    );
  }
}
