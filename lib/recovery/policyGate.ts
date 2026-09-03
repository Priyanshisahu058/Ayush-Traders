import { getSupabaseClient } from "../supabase/client";

export interface PolicyState {
  dailyDiscountBudget: number;
  discountSpentToday: number;
  policyDate: string;
  maxDiscountPercent: number;
  maxActionsPerOrder: number;
}

export interface ProposedAction {
  action: string;
  discountPercent?: number;
}

export interface GateContext {
  orderPaymentStatus?: string;
  paymentAttemptStatus?: string; // e.g. 'authorized_not_captured'
  previousRetries?: number;
  orderId?: string;
  cartTotal?: number;
  previousActionsCount?: number;
  timeSinceEventHours?: number;
}

export interface GateResult {
  finalAction: string;
  finalDiscountPercent: number;
  gateOverrides: string[];
}

export const DEFAULT_POLICY_STATE: PolicyState = {
  dailyDiscountBudget: 5000,
  discountSpentToday: 0,
  policyDate: new Date().toISOString().split("T")[0],
  maxDiscountPercent: 10,
  maxActionsPerOrder: 1,
};

// In-memory fallback tracking for daily discount spend
let localDiscountSpentToday = 0;
let localPolicyDate = new Date().toISOString().split("T")[0];

/**
 * Single, consolidated policy gate checkpoint.
 * Evaluates all safety constraints, budget ceilings, and discount rules post-LLM.
 */
export function applyPolicyGate(
  proposal: ProposedAction,
  context: GateContext,
  overridePolicyState?: Partial<PolicyState>
): GateResult {
  const state: PolicyState = {
    ...DEFAULT_POLICY_STATE,
    ...overridePolicyState,
  };

  const gateOverrides: string[] = [];
  let finalAction = proposal.action || "no_action";
  let finalDiscountPercent = proposal.discountPercent ?? 0;

  // 1. HARD RULE: Paid orders receive NO recovery action
  if (
    context.orderPaymentStatus === "Paid" ||
    context.orderPaymentStatus === "captured"
  ) {
    if (finalAction !== "no_action") {
      gateOverrides.push(
        "Blocked recovery action: Order is already verified as Paid"
      );
      finalAction = "no_action";
      finalDiscountPercent = 0;
    }
    return { finalAction, finalDiscountPercent, gateOverrides };
  }

  // 1b. HARD RULE: Too early event (timeSinceEventHours < 1.0h) receives NO recovery action
  if (typeof context.timeSinceEventHours === "number" && context.timeSinceEventHours < 1.0) {
    if (finalAction !== "no_action") {
      gateOverrides.push(
        `Blocked recovery action: Elapsed time (${context.timeSinceEventHours}h) is less than 1.0 hour threshold (too early)`
      );
      finalAction = "no_action";
      finalDiscountPercent = 0;
    }
    return { finalAction, finalDiscountPercent, gateOverrides };
  }

  // 2. HARD RULE: Maximum retry limit reached (Cap = 3 retries)
  if (typeof context.previousRetries === "number" && context.previousRetries >= 3) {
    if (finalAction !== "no_action") {
      gateOverrides.push(
        `Blocked recovery action: Maximum retry limit (3) reached`
      );
      finalAction = "no_action";
      finalDiscountPercent = 0;
    }
    return { finalAction, finalDiscountPercent, gateOverrides };
  }

  // 3. HARD RULE: One recovery action per order ceiling
  if (
    typeof context.previousActionsCount === "number" &&
    context.previousActionsCount >= state.maxActionsPerOrder
  ) {
    if (finalAction !== "no_action") {
      gateOverrides.push(
        `Blocked recovery action: Order reached max actions per order limit (${state.maxActionsPerOrder})`
      );
      finalAction = "no_action";
      finalDiscountPercent = 0;
    }
    return { finalAction, finalDiscountPercent, gateOverrides };
  }

  // 4. HARD RULE: Authorized but uncaptured payments get NO discount & force retry payment link
  if (context.paymentAttemptStatus === "authorized_not_captured") {
    if (finalDiscountPercent > 0 || finalAction === "offer_discount") {
      gateOverrides.push(
        "Blocked discount on authorized_not_captured payment status: Forced retry_payment_link with 0% discount"
      );
      finalAction = "retry_payment_link";
      finalDiscountPercent = 0;
    }
  }

  // 5. HARD RULE: Clamp discount percent to max_discount_percent ceiling
  if (finalDiscountPercent > state.maxDiscountPercent) {
    gateOverrides.push(
      `Clamped discount from ${finalDiscountPercent}% to configured max ceiling of ${state.maxDiscountPercent}%`
    );
    finalDiscountPercent = state.maxDiscountPercent;
  }

  // 6. HARD RULE: Daily discount budget ceiling
  if (finalDiscountPercent > 0 && context.cartTotal && context.cartTotal > 0) {
    const todayIso = new Date().toISOString().split("T")[0];
    if (localPolicyDate !== todayIso) {
      localDiscountSpentToday = 0;
      localPolicyDate = todayIso;
    }

    const proposedSpend = context.cartTotal * (finalDiscountPercent / 100);
    const currentSpent = state.discountSpentToday || localDiscountSpentToday;

    if (currentSpent + proposedSpend > state.dailyDiscountBudget) {
      gateOverrides.push(
        `Exceeded daily discount budget ceiling (Spent: ₹${currentSpent}, Proposed: ₹${proposedSpend.toFixed(
          2
        )}, Ceiling: ₹${state.dailyDiscountBudget}): Forced no_action`
      );
      finalAction = "no_action";
      finalDiscountPercent = 0;
    }
  }

  return {
    finalAction,
    finalDiscountPercent,
    gateOverrides,
  };
}

/**
 * Fetches current agent policy state from Supabase with date reset check
 */
export async function getAgentPolicyState(): Promise<PolicyState> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data } = await supabase
        .from("agent_policy_state")
        .select("*")
        .eq("id", 1)
        .maybeSingle();

      if (data) {
        const todayIso = new Date().toISOString().split("T")[0];
        let discountSpent = Number(data.discount_spent_today) || 0;

        // Reset if date changed
        if (data.policy_date !== todayIso) {
          discountSpent = 0;
          await supabase
            .from("agent_policy_state")
            .update({
              discount_spent_today: 0,
              policy_date: todayIso,
              updated_at: new Date().toISOString(),
            })
            .eq("id", 1);
        }

        return {
          dailyDiscountBudget: Number(data.daily_discount_budget) || 5000,
          discountSpentToday: discountSpent,
          policyDate: todayIso,
          maxDiscountPercent: Number(data.max_discount_percent) || 10,
          maxActionsPerOrder: Number(data.max_actions_per_order) || 1,
        };
      }
    } catch (e) {
      console.warn("Notice fetching agent_policy_state from Supabase:", e);
    }
  }

  return DEFAULT_POLICY_STATE;
}

/**
 * Records discount spend in agent policy state
 */
export async function recordDiscountSpend(amount: number): Promise<void> {
  if (amount <= 0) return;
  localDiscountSpentToday += amount;

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const state = await getAgentPolicyState();
      const newSpent = state.discountSpentToday + amount;
      await supabase
        .from("agent_policy_state")
        .update({
          discount_spent_today: newSpent,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1);
    } catch (e) {}
  }
}
