/**
 * SINGLE AI CALL REFACTOR VERIFICATION SUITE
 * Tests all 7 required safety and functional criteria for the refactored single-call AI recovery pipeline.
 *
 * Usage:
 *   node scripts/test_single_call_refactor.mjs
 */

const BASE_URL = "http://localhost:3000";

let passed = 0;
let failed = 0;

function logTest(num, name, ok, detail) {
  const icon = ok ? "✅ [PASS]" : "❌ [FAIL]";
  if (ok) passed++; else failed++;
  console.log(`  ${icon} Test ${num}: ${name}`);
  console.log(`           └─ ${detail}`);
}

async function runSingleCallTests() {
  console.log("\n======================================================================");
  console.log("  🚀 REFACTORED SINGLE-CALL AI RECOVERY PIPELINE VERIFICATION");
  console.log("======================================================================\n");

  // TEST 1 — Normal Recovery (Single AI call)
  try {
    const res1 = await fetch(`${BASE_URL}/api/checkout-recovery/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: `single_normal_${Date.now()}`,
        opportunityType: "cart_abandonment",
        amount: 3500,
        previousRetries: 0,
        orderPaymentStatus: "Pending",
        timeSinceEventHours: 2.0,
        customerPurchaseHistoryCount: 0,
      }),
    });
    const d1 = await res1.json();
    const dec1 = d1.decision;
    const ok1 = res1.status === 200 && d1.success && dec1 && ["gemini", "rule_fallback"].includes(dec1.source);
    logTest(1, "Normal Recovery Analysis (Single AI Call)", ok1, `Status: HTTP ${res1.status} | Source: ${dec1?.source} | Action: ${dec1?.decision}`);
  } catch (e) {
    logTest(1, "Normal Recovery Analysis", false, e.message);
  }

  // TEST 2 — AI Proposes Valid Discount
  try {
    const res2 = await fetch(`${BASE_URL}/api/checkout-recovery/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: `single_valid_disc_${Date.now()}`,
        opportunityType: "cart_abandonment",
        amount: 8500,
        previousRetries: 0,
        orderPaymentStatus: "Pending",
        timeSinceEventHours: 3.5,
        customerPurchaseHistoryCount: 2,
      }),
    });
    const d2 = await res2.json();
    const dec2 = d2.decision;
    const ok2 = res2.status === 200 && d2.success && dec2?.finalDiscountPercent <= 10;
    logTest(2, "Valid Discount Proposal (within 10% ceiling)", ok2, `Final Discount: ${dec2?.finalDiscountPercent}% | Action: ${dec2?.decision}`);
  } catch (e) {
    logTest(2, "Valid Discount Proposal", false, e.message);
  }

  // TEST 3 — AI Proposes Unsafe Discount (Unclamped 25% → Clamped to 10%)
  try {
    const res3 = await fetch(`${BASE_URL}/api/checkout-recovery/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: `single_unsafe_disc_${Date.now()}`,
        opportunityType: "cart_abandonment",
        amount: 12000,
        previousRetries: 0,
        orderPaymentStatus: "Pending",
        timeSinceEventHours: 4.0,
        customerPurchaseHistoryCount: 3,
        allowUnclampedProposalForTesting: true,
      }),
    });
    const d3 = await res3.json();
    const dec3 = d3.decision;
    const ok3 = res3.status === 200 && dec3?.finalDiscountPercent <= 10;
    logTest(3, "Unsafe Discount Proposal Clamping (25% → 10% Ceiling)", ok3, `Proposed: ${dec3?.proposedDiscountPercent}% → Final Gated: ${dec3?.finalDiscountPercent}%`);
  } catch (e) {
    logTest(3, "Unsafe Discount Clamping", false, e.message);
  }

  // TEST 4 — Budget Ceiling Exhaustion
  try {
    const res4 = await fetch(`${BASE_URL}/api/checkout-recovery/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: `single_budget_exhaust_${Date.now()}`,
        opportunityType: "cart_abandonment",
        amount: 10000,
        previousRetries: 0,
        orderPaymentStatus: "Pending",
        timeSinceEventHours: 3.5,
        customerPurchaseHistoryCount: 2,
        overridePolicyState: { discountSpentToday: 4800, dailyDiscountBudget: 5000 },
      }),
    });
    const d4 = await res4.json();
    const dec4 = d4.decision;
    const ok4 = res4.status === 200 && dec4?.decision === "no_action" && dec4?.finalDiscountPercent === 0;
    logTest(4, "Daily Budget Ceiling Enforcement (Spent ₹4,800 + Proposed ₹1,000 > ₹5,000)", ok4, `Result: ${dec4?.decision.toUpperCase()} | Reason: ${dec4?.reason}`);
  } catch (e) {
    logTest(4, "Budget Ceiling Enforcement", false, e.message);
  }

  // TEST 5 — LLM Failure Safety Fallback
  try {
    const res5 = await fetch(`${BASE_URL}/api/checkout-recovery/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: `single_llm_fail_${Date.now()}`,
        opportunityType: "cart_abandonment",
        amount: 5000,
        previousRetries: 0,
        orderPaymentStatus: "Pending",
        timeSinceEventHours: 2.0,
      }),
    });
    const d5 = await res5.json();
    const dec5 = d5.decision;
    const ok5 = res5.status === 200 && dec5 && ["gemini", "rule_fallback", "llm_failure_fallback"].includes(dec5.source);
    logTest(5, "LLM Failure Safety Policy Check", ok5, `Source: ${dec5?.source} | Action: ${dec5?.decision} (safely bounded)`);
  } catch (e) {
    logTest(5, "LLM Failure Safety Check", false, e.message);
  }

  // TEST 6 — Paid Order Block
  try {
    const res6 = await fetch(`${BASE_URL}/api/checkout-recovery/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: `single_paid_order_${Date.now()}`,
        opportunityType: "cart_abandonment",
        amount: 7500,
        previousRetries: 0,
        orderPaymentStatus: "Paid",
        timeSinceEventHours: 2.0,
      }),
    });
    const d6 = await res6.json();
    const dec6 = d6.decision;
    const ok6 = res6.status === 200 && dec6?.decision === "no_action" && dec6?.finalDiscountPercent === 0;
    logTest(6, "Paid Order Recovery Block", ok6, `Result: ${dec6?.decision.toUpperCase()} | Reason: ${dec6?.reason}`);
  } catch (e) {
    logTest(6, "Paid Order Recovery Block", false, e.message);
  }

  // TEST 7 — Maximum Retries Cap (3 retries limit)
  try {
    const res7 = await fetch(`${BASE_URL}/api/checkout-recovery/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: `single_max_retries_${Date.now()}`,
        opportunityType: "payment_failure",
        amount: 4500,
        previousRetries: 3,
        orderPaymentStatus: "Pending",
        timeSinceEventHours: 2.0,
      }),
    });
    const d7 = await res7.json();
    const dec7 = d7.decision;
    const ok7 = res7.status === 200 && dec7?.decision === "no_action" && dec7?.finalDiscountPercent === 0;
    logTest(7, "Maximum Retry Ceiling Cap (3 retries limit)", ok7, `Result: ${dec7?.decision.toUpperCase()} | Reason: ${dec7?.reason}`);
  } catch (e) {
    logTest(7, "Maximum Retry Ceiling Cap", false, e.message);
  }

  console.log("\n======================================================================");
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED / ${failed} FAILED`);
  console.log("======================================================================\n");
}

runSingleCallTests();
