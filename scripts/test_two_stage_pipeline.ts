import { diagnoseRecoveryEvent, FunnelEventInput } from "../lib/recovery/stage1Diagnosis";
import { evaluateRecoveryAgentDecision, AgentContext } from "../lib/recovery/recoveryAgent";
import { applyPolicyGate } from "../lib/recovery/policyGate";

interface TestCase {
  id: number;
  scenarioType: "Price-Sensitive Read" | "Payment-Friction Read" | "First-Time Visitor Caution";
  event: FunnelEventInput;
  agentContext: AgentContext;
}

const TEST_EVENTS_10: TestCase[] = [
  // SCENARIO 1: PRICE-SENSITIVE READ (High cart total, no payment attempted)
  {
    id: 1,
    scenarioType: "Price-Sensitive Read",
    event: {
      eventType: "cart_abandoned",
      cartTotal: 5500,
      timeSinceEventHours: 3.5,
      paymentAttemptStatus: "unpaid",
      customerPurchaseHistoryCount: 1,
      productCategory: "ring",
      rawContext: { itemName: "Solitaire Silver Ring 925" },
    },
    agentContext: {
      opportunityType: "cart_abandonment",
      amount: 5500,
      previousRetries: 0,
      orderPaymentStatus: "Unpaid",
      timeSinceEventHours: 3.5,
      customerPurchaseHistoryCount: 1,
      paymentAttemptStatus: "unpaid",
    },
  },
  {
    id: 2,
    scenarioType: "Price-Sensitive Read",
    event: {
      eventType: "cart_abandoned",
      cartTotal: 8200,
      timeSinceEventHours: 6.0,
      paymentAttemptStatus: "unpaid",
      customerPurchaseHistoryCount: 0,
      productCategory: "anklet",
      rawContext: { itemName: "Heavy Ghungroo Silver Payal Pair" },
    },
    agentContext: {
      opportunityType: "cart_abandonment",
      amount: 8200,
      previousRetries: 0,
      orderPaymentStatus: "Unpaid",
      timeSinceEventHours: 6.0,
      customerPurchaseHistoryCount: 0,
      paymentAttemptStatus: "unpaid",
    },
  },
  {
    id: 3,
    scenarioType: "Price-Sensitive Read",
    event: {
      eventType: "cart_abandoned",
      cartTotal: 4500,
      timeSinceEventHours: 2.0,
      paymentAttemptStatus: "unpaid",
      customerPurchaseHistoryCount: 2,
      productCategory: "chain",
      rawContext: { itemName: "Sterling Link Chain 925" },
    },
    agentContext: {
      opportunityType: "cart_abandonment",
      amount: 4500,
      previousRetries: 0,
      orderPaymentStatus: "Unpaid",
      timeSinceEventHours: 2.0,
      customerPurchaseHistoryCount: 2,
      paymentAttemptStatus: "unpaid",
    },
  },

  // SCENARIO 2: PAYMENT-FRICTION READ (Payment attempt failed or authorized_not_captured)
  {
    id: 4,
    scenarioType: "Payment-Friction Read",
    event: {
      eventType: "payment_failed",
      cartTotal: 2200,
      timeSinceEventHours: 0.5,
      paymentAttemptStatus: "failed",
      customerPurchaseHistoryCount: 1,
      productCategory: "bracelet",
      rawContext: { failureReason: "Gateway Technical Error" },
    },
    agentContext: {
      opportunityType: "payment_failure",
      amount: 2200,
      failureCategory: "network_failure",
      previousRetries: 0,
      orderPaymentStatus: "Unpaid",
      timeSinceEventHours: 0.5,
      customerPurchaseHistoryCount: 1,
      paymentAttemptStatus: "failed",
    },
  },
  {
    id: 5,
    scenarioType: "Payment-Friction Read",
    event: {
      eventType: "payment_failed",
      cartTotal: 3400,
      timeSinceEventHours: 1.5,
      paymentAttemptStatus: "failed",
      customerPurchaseHistoryCount: 0,
      productCategory: "ring",
      rawContext: { failureReason: "Bank Declined Transaction" },
    },
    agentContext: {
      opportunityType: "payment_failure",
      amount: 3400,
      failureCategory: "bank_declined",
      previousRetries: 0,
      orderPaymentStatus: "Unpaid",
      timeSinceEventHours: 1.5,
      customerPurchaseHistoryCount: 0,
      paymentAttemptStatus: "failed",
    },
  },
  {
    id: 6,
    scenarioType: "Payment-Friction Read",
    event: {
      eventType: "authorized_not_captured",
      cartTotal: 2800,
      timeSinceEventHours: 1.0,
      paymentAttemptStatus: "authorized_not_captured",
      customerPurchaseHistoryCount: 2,
      productCategory: "chain",
      rawContext: { rzpStatus: "authorized" },
    },
    agentContext: {
      opportunityType: "authorized_uncaptured",
      amount: 2800,
      failureCategory: "authorized_uncaptured",
      previousRetries: 0,
      orderPaymentStatus: "Unpaid",
      timeSinceEventHours: 1.0,
      customerPurchaseHistoryCount: 2,
      paymentAttemptStatus: "authorized_not_captured",
    },
  },

  // SCENARIO 3: FIRST-TIME VISITOR CAUTION (0 prior purchases, low cart total)
  {
    id: 7,
    scenarioType: "First-Time Visitor Caution",
    event: {
      eventType: "cart_abandoned",
      cartTotal: 1200,
      timeSinceEventHours: 2.5,
      paymentAttemptStatus: "unpaid",
      customerPurchaseHistoryCount: 0,
      productCategory: "ring",
      rawContext: { itemName: "Minimal Silver Band" },
    },
    agentContext: {
      opportunityType: "cart_abandonment",
      amount: 1200,
      previousRetries: 0,
      orderPaymentStatus: "Unpaid",
      timeSinceEventHours: 2.5,
      customerPurchaseHistoryCount: 0,
      paymentAttemptStatus: "unpaid",
    },
  },
  {
    id: 8,
    scenarioType: "First-Time Visitor Caution",
    event: {
      eventType: "cart_abandoned",
      cartTotal: 1800,
      timeSinceEventHours: 4.0,
      paymentAttemptStatus: "unpaid",
      customerPurchaseHistoryCount: 0,
      productCategory: "anklet",
      rawContext: { itemName: "Silver Charm Payal" },
    },
    agentContext: {
      opportunityType: "cart_abandonment",
      amount: 1800,
      previousRetries: 0,
      orderPaymentStatus: "Unpaid",
      timeSinceEventHours: 4.0,
      customerPurchaseHistoryCount: 0,
      paymentAttemptStatus: "unpaid",
    },
  },
  {
    id: 9,
    scenarioType: "First-Time Visitor Caution",
    event: {
      eventType: "cart_abandoned",
      cartTotal: 950,
      timeSinceEventHours: 1.2,
      paymentAttemptStatus: "unpaid",
      customerPurchaseHistoryCount: 0,
      productCategory: "bracelet",
      rawContext: { itemName: "Bead Cuff Bracelet" },
    },
    agentContext: {
      opportunityType: "cart_abandonment",
      amount: 950,
      previousRetries: 0,
      orderPaymentStatus: "Unpaid",
      timeSinceEventHours: 1.2,
      customerPurchaseHistoryCount: 0,
      paymentAttemptStatus: "unpaid",
    },
  },
  {
    id: 10,
    scenarioType: "First-Time Visitor Caution",
    event: {
      eventType: "cart_abandoned",
      cartTotal: 1600,
      timeSinceEventHours: 0.3, // < 1 hour recent event!
      paymentAttemptStatus: "unpaid",
      customerPurchaseHistoryCount: 0,
      productCategory: "chain",
      rawContext: { itemName: "Minimal Silver Chain" },
    },
    agentContext: {
      opportunityType: "cart_abandonment",
      amount: 1600,
      previousRetries: 0,
      orderPaymentStatus: "Unpaid",
      timeSinceEventHours: 0.3,
      customerPurchaseHistoryCount: 0,
      paymentAttemptStatus: "unpaid",
    },
  },
];

async function runTwoStagePipelineVerification() {
  console.log("=================================================");
  console.log("🧪 EPIC-2 — TWO-STAGE LLM PIPELINE VERIFICATION");
  console.log("=================================================\n");

  const resultsTable: any[] = [];

  for (const tc of TEST_EVENTS_10) {
    console.log(`\n--- EVENT #${tc.id} [${tc.scenarioType}] ---`);
    console.log(`Input JSON: ${JSON.stringify(tc.event)}`);

    // Step 1: Stage 1 Behavioral Diagnosis
    const diagnosisText = await diagnoseRecoveryEvent(tc.event);
    console.log(`\n[Stage 1 Diagnosis Text (Verbatim)]:\n"${diagnosisText}"`);

    // Step 2: Stage 2 Decision Engine with Stage 1 Diagnosis text input
    const decisionResult = await evaluateRecoveryAgentDecision(tc.agentContext, diagnosisText);

    // Step 3: Code-Level Policy Gate Check
    const gateResult = applyPolicyGate(
      { action: decisionResult.decision, discountPercent: 0 },
      {
        orderPaymentStatus: tc.agentContext.orderPaymentStatus,
        paymentAttemptStatus: tc.event.paymentAttemptStatus,
        previousRetries: tc.agentContext.previousRetries,
        orderId: tc.agentContext.orderId,
        cartTotal: tc.event.cartTotal,
      }
    );

    console.log(`\n[Stage 2 Proposed Output]: action='${decisionResult.decision}', discount=0%`);
    console.log(`[Final Gated Output]: action='${gateResult.finalAction}', discount=${gateResult.finalDiscountPercent}%, overrides=[${gateResult.gateOverrides.join("; ")}]`);

    resultsTable.push({
      id: tc.id,
      scenario: tc.scenarioType,
      cartTotal: tc.event.cartTotal,
      eventType: tc.event.eventType,
      diagnosisTextSnippet: diagnosisText.slice(0, 70) + "...",
      proposedAction: decisionResult.decision,
      finalAction: gateResult.finalAction,
      finalDiscount: gateResult.finalDiscountPercent,
    });
  }

  console.log("\n=================================================");
  console.log("📋 10-EVENT PIPELINE SUMMARY TABLE");
  console.log("=================================================");
  console.table(resultsTable);
  console.log("\n🎉 ALL 10 EVENTS SUCCESSFULLY RUN THROUGH DIAGNOSE -> DECIDE -> GATE PIPELINE!");
}

runTwoStagePipelineVerification();
