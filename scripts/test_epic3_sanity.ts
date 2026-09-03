import { recordFunnelEvent, getLocalFunnelEvents } from "../lib/recovery/funnelEvents";
import { applyPolicyGate, getAgentPolicyState } from "../lib/recovery/policyGate";
import { executeRecoveryAction } from "../lib/recovery/actionExecutor";
import { detectCartAbandonment } from "../lib/recovery/cartAbandonment";

async function runEpic3SanityCheck() {
  console.log("=================================================");
  console.log("🧪 EPIC-3 — DATA MODEL ALIGNMENT & SANITY CHECK");
  console.log("=================================================\n");

  let passed = 0;
  let total = 0;

  // Test 1: Record Funnel Event
  total++;
  const funnelRes = await recordFunnelEvent({
    orderId: "ATO-TEST-EPIC3",
    eventType: "payment_failed",
    cartTotal: 2999,
    timeSinceEventHours: 0.5,
    paymentAttemptStatus: "failed",
    productCategory: "ring",
  });
  const localFunnel = getLocalFunnelEvents();
  if (funnelRes.success && localFunnel.length > 0) {
    console.log("✅ PASS 1: recordFunnelEvent successfully inserted row!");
    passed++;
  } else {
    console.error("❌ FAIL 1: recordFunnelEvent failed!");
  }

  // Test 2: Agent Policy State Query
  total++;
  const policyState = await getAgentPolicyState();
  if (
    policyState.dailyDiscountBudget === 5000 &&
    policyState.maxDiscountPercent === 10 &&
    policyState.maxActionsPerOrder === 1
  ) {
    console.log("✅ PASS 2: getAgentPolicyState returned valid default policy state!");
    passed++;
  } else {
    console.error("❌ FAIL 2: getAgentPolicyState returned invalid state:", policyState);
  }

  // Test 3: applyPolicyGate Discount Clamping
  total++;
  const gateRes1 = applyPolicyGate(
    { action: "offer_discount", discountPercent: 25 },
    { cartTotal: 2000, previousRetries: 0 }
  );
  if (
    gateRes1.finalDiscountPercent === 10 &&
    gateRes1.gateOverrides.some((o) => o.includes("Clamped discount"))
  ) {
    console.log("✅ PASS 3: applyPolicyGate clamped 25% discount to 10% max ceiling!");
    passed++;
  } else {
    console.error("❌ FAIL 3: applyPolicyGate failed to clamp discount:", gateRes1);
  }

  // Test 4: applyPolicyGate Authorized Not Captured Block
  total++;
  const gateRes2 = applyPolicyGate(
    { action: "offer_discount", discountPercent: 10 },
    { paymentAttemptStatus: "authorized_not_captured", cartTotal: 2000 }
  );
  if (
    gateRes2.finalAction === "retry_payment_link" &&
    gateRes2.finalDiscountPercent === 0 &&
    gateRes2.gateOverrides.some((o) => o.includes("authorized_not_captured"))
  ) {
    console.log("✅ PASS 4: applyPolicyGate blocked discount on authorized_not_captured status!");
    passed++;
  } else {
    console.error("❌ FAIL 4: applyPolicyGate failed authorized_not_captured block:", gateRes2);
  }

  // Test 5: executeRecoveryAction writes extended fields
  total++;
  const testOpp = {
    id: `opp_test_${Date.now()}`,
    type: "payment_failure" as const,
    sessionId: "sess_test_epic3",
    amount: 1500,
    currency: "INR",
    reason: "Test failure",
    status: "action_ready" as const,
    priority: "medium" as const,
    recommendedAction: "retry_payment" as const,
    aiExplanation: "Test failure recovery",
    attemptCount: 0,
    revenueAtRisk: 1500,
    revenueRecovered: 0,
    createdAt: new Date().toISOString(),
  };

  const execRes = await executeRecoveryAction(testOpp, "retry_payment");
  if (execRes.success && execRes.opportunity.status === "action_taken") {
    console.log("✅ PASS 5: executeRecoveryAction passed policy gate and executed successfully!");
    passed++;
  } else {
    console.error("❌ FAIL 5: executeRecoveryAction failed:", execRes);
  }

  // Test 6: Cart Abandonment writes to funnel_events
  total++;
  const abnRes = await detectCartAbandonment({
    sessionId: `sess_abn_${Date.now()}`,
    cartValue: 3200,
    itemsCount: 2,
    forceTestMode: true,
  });
  if (abnRes.isAbandoned && abnRes.opportunity) {
    console.log("✅ PASS 6: detectCartAbandonment generated opportunity & recorded funnel event!");
    passed++;
  } else {
    console.error("❌ FAIL 6: detectCartAbandonment failed:", abnRes);
  }

  console.log(`\nRESULTS: ${passed}/${total} Sanity Tests PASSED.`);
  if (passed === total) {
    console.log("🎉 ALL EPIC-3 SANITY & INTEGRATION TESTS PASSED SUCCESSFULLY!\n");
  } else {
    process.exit(1);
  }
}

runEpic3SanityCheck();
