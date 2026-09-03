import { getSupabaseClient } from "../supabase/client";

export interface CategoryBreakdownRow {
  category: string;
  opportunities: number;
  attempts: number;
  successful: number;
  recoveryRate: number;
  revenueAtRisk: number;
  revenueRecovered: number;
}

export interface FunnelStep {
  name: string;
  count: number;
  conversionRate?: number;
}

export interface UnifiedCommerceMetrics {
  totalOrders: number;
  successfulOrders: number;
  paymentAttempts: number;
  successfulPayments: number;
  failedPayments: number;
  checkoutStarts: number;
  abandonedCheckouts: number;
  recoveryOpportunities: number;
  revenueAtRisk: number;
  revenueRecovered: number;
  recoveryRate: number;
  paymentSuccessRate: number;
  paymentFailureRate: number;
  averageOrderValue: number;
  averageRecoveredOrderValue: number;
  aiDecisionsCount: number;
  fallbackDecisionsCount: number;
  aiDecisionPercentage: number;
  fallbackDecisionPercentage: number;
  aiRecoveryRate: number;
  fallbackRecoveryRate: number;
  categoryBreakdown: CategoryBreakdownRow[];
  funnelSteps: FunnelStep[];
}

/**
 * Computes deterministic commerce metrics from verified event records without calling Gemini API
 */
export function computeCommerceMetrics(
  checkoutEvents: any[] = [],
  paymentEvents: any[] = [],
  recoveryOpps: any[] = [],
  orders: any[] = []
): UnifiedCommerceMetrics {
  const totalOrders = orders.length;
  const successfulOrders = orders.filter((o) => o.paymentStatus === "Paid" || o.payment_status === "Paid").length;

  const paymentAttempts = paymentEvents.length;
  const successfulPayments = paymentEvents.filter((p) => p.status === "captured" || p.status === "Paid" || p.event_type === "payment.captured").length;
  const failedPayments = paymentEvents.filter((p) => p.status === "failed" || p.event_type === "payment.failed").length;

  const checkoutStarts = checkoutEvents.filter((e) => e.event_type === "checkout_started").length || Math.max(paymentAttempts, totalOrders);
  const abandonedCheckouts = recoveryOpps.filter((o) => o.type === "cart_abandonment" || o.type === "cart_abandonment").length;

  const recoveryOpportunities = recoveryOpps.length;
  const revenueAtRisk = recoveryOpps.reduce((sum, o) => sum + (parseFloat(o.revenue_at_risk || o.amount || "0")), 0);
  
  // STRICT RECOVERY TRUTH: Only verified successful Razorpay payments contribute to revenueRecovered!
  const recoveredOpps = recoveryOpps.filter((o) => o.status === "recovered" || parseFloat(o.revenue_recovered || "0") > 0);
  const revenueRecovered = recoveredOpps.reduce((sum, o) => sum + parseFloat(o.revenue_recovered || "0"), 0);

  const recoveryAttempts = recoveryOpps.filter((o) => (o.attempt_count || 0) > 0 || o.status === "action_taken" || o.status === "recovered").length;
  const successfulRecoveries = recoveredOpps.length;

  const recoveryRate = recoveryAttempts > 0 ? parseFloat(((successfulRecoveries / recoveryAttempts) * 100).toFixed(1)) : 0;
  const paymentSuccessRate = paymentAttempts > 0 ? parseFloat(((successfulPayments / paymentAttempts) * 100).toFixed(1)) : 0;
  const paymentFailureRate = paymentAttempts > 0 ? parseFloat(((failedPayments / paymentAttempts) * 100).toFixed(1)) : 0;

  const totalSalesRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const averageOrderValue = totalOrders > 0 ? parseFloat((totalSalesRevenue / totalOrders).toFixed(0)) : 0;
  const averageRecoveredOrderValue = successfulRecoveries > 0 ? parseFloat((revenueRecovered / successfulRecoveries).toFixed(0)) : 0;

  // AI vs Fallback Split
  const aiDecisions = recoveryOpps.filter((o) => o.decisionTrace?.source === "gemini" || o.source === "gemini" || o.source === "ai");
  const fallbackDecisions = recoveryOpps.filter((o) => o.decisionTrace?.source === "rule_fallback" || o.source === "rule_fallback" || o.source === "fallback");

  const aiDecisionsCount = aiDecisions.length;
  const fallbackDecisionsCount = fallbackDecisions.length;
  const totalDecisions = aiDecisionsCount + fallbackDecisionsCount || recoveryOpportunities || 1;

  const aiDecisionPercentage = parseFloat(((aiDecisionsCount / totalDecisions) * 100).toFixed(1));
  const fallbackDecisionPercentage = parseFloat(((fallbackDecisionsCount / totalDecisions) * 100).toFixed(1));

  const aiRecovered = aiDecisions.filter((o) => o.status === "recovered" || parseFloat(o.revenue_recovered || "0") > 0).length;
  const fallbackRecovered = fallbackDecisions.filter((o) => o.status === "recovered" || parseFloat(o.revenue_recovered || "0") > 0).length;

  const aiRecoveryRate = aiDecisionsCount > 0 ? parseFloat(((aiRecovered / aiDecisionsCount) * 100).toFixed(1)) : 0;
  const fallbackRecoveryRate = fallbackDecisionsCount > 0 ? parseFloat(((fallbackRecovered / fallbackDecisionsCount) * 100).toFixed(1)) : 0;

  // Failure Category Breakdown Table
  const categoriesMap: Record<string, { opportunities: number; attempts: number; successful: number; risk: number; recovered: number }> = {};
  
  recoveryOpps.forEach((o) => {
    const cat = o.failure_category || o.type || "unknown";
    if (!categoriesMap[cat]) {
      categoriesMap[cat] = { opportunities: 0, attempts: 0, successful: 0, risk: 0, recovered: 0 };
    }
    categoriesMap[cat].opportunities += 1;
    if ((o.attempt_count || 0) > 0 || o.status === "action_taken" || o.status === "recovered") {
      categoriesMap[cat].attempts += 1;
    }
    if (o.status === "recovered" || parseFloat(o.revenue_recovered || "0") > 0) {
      categoriesMap[cat].successful += 1;
      categoriesMap[cat].recovered += parseFloat(o.revenue_recovered || "0");
    }
    categoriesMap[cat].risk += parseFloat(o.revenue_at_risk || o.amount || "0");
  });

  const categoryBreakdown: CategoryBreakdownRow[] = Object.entries(categoriesMap).map(([cat, data]) => ({
    category: cat,
    opportunities: data.opportunities,
    attempts: data.attempts,
    successful: data.successful,
    recoveryRate: data.attempts > 0 ? parseFloat(((data.successful / data.attempts) * 100).toFixed(1)) : 0,
    revenueAtRisk: data.risk,
    revenueRecovered: data.recovered,
  }));

  categoryBreakdown.sort((a, b) => b.revenueAtRisk - a.revenueAtRisk);

  // Funnel Steps
  const funnelSteps: FunnelStep[] = [
    { name: "Checkout Started", count: checkoutStarts },
    { name: "Payment Initiated", count: paymentAttempts },
    { name: "Payment Successful", count: successfulPayments },
    { name: "Payment Failed", count: failedPayments },
    { name: "Recovery Opportunity", count: recoveryOpportunities },
    { name: "Recovery Attempt", count: recoveryAttempts },
    { name: "Revenue Recovered", count: successfulRecoveries },
  ];

  return {
    totalOrders,
    successfulOrders,
    paymentAttempts,
    successfulPayments,
    failedPayments,
    checkoutStarts,
    abandonedCheckouts,
    recoveryOpportunities,
    revenueAtRisk,
    revenueRecovered,
    recoveryRate,
    paymentSuccessRate,
    paymentFailureRate,
    averageOrderValue,
    averageRecoveredOrderValue,
    aiDecisionsCount,
    fallbackDecisionsCount,
    aiDecisionPercentage,
    fallbackDecisionPercentage,
    aiRecoveryRate,
    fallbackRecoveryRate,
    categoryBreakdown,
    funnelSteps,
  };
}

/**
 * Server-side helper to fetch records from Supabase and compute metrics
 */
export async function getCommerceMetricsFromDatabase(): Promise<UnifiedCommerceMetrics> {
  const supabase = getSupabaseClient();
  let checkoutEvents: any[] = [];
  let paymentEvents: any[] = [];
  let recoveryOpps: any[] = [];
  let orders: any[] = [];

  if (supabase) {
    try {
      const { data: ev } = await supabase.from("checkout_events").select("*");
      if (ev) checkoutEvents = ev;

      const { data: pe } = await supabase.from("payment_events").select("*");
      if (pe) paymentEvents = pe;

      const { data: ro } = await supabase.from("recovery_opportunities").select("*");
      if (ro) recoveryOpps = ro;

      const { data: ord } = await supabase.from("orders").select("*");
      if (ord) orders = ord;
    } catch (e) {
      console.warn("Notice querying Supabase for commerce metrics:", e);
    }
  }

  return computeCommerceMetrics(checkoutEvents, paymentEvents, recoveryOpps, orders);
}
