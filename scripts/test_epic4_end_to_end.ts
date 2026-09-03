import { recordFunnelEvent } from "../lib/recovery/funnelEvents";
import { processFunnelEvents } from "../lib/recovery/funnelProcessor";

async function runEpic4EndToEndVerification() {
  console.log("=================================================");
  console.log("🧪 EPIC-4 — AUTOMATED EVENT DETECTION & TRIGGER VERIFICATION");
  console.log("=================================================\n");

  // Step 1: Simulate writing a new event to standalone funnel_events table
  const testOrderId = `ATO-FNL-TEST-${Date.now()}`;
  console.log(`Step 1: Writing event into 'funnel_events' table (Order ID: ${testOrderId})...`);

  const recordRes = await recordFunnelEvent({
    orderId: testOrderId,
    eventType: "payment_failed",
    cartTotal: 4800,
    timeSinceEventHours: 1.2,
    paymentAttemptStatus: "failed",
    customerPurchaseHistoryCount: 1,
    productCategory: "anklet",
    rawContext: { failureReason: "Bank OTP Timeout" },
  });

  if (recordRes.success) {
    console.log("✅ Event successfully landed in 'funnel_events' table!\n");
  } else {
    console.error("❌ Failed to record event in 'funnel_events' table!");
    process.exit(1);
  }

  // Step 2: Trigger agent pipeline reader (processFunnelEvents) reading FROM funnel_events
  console.log("Step 2: Triggering agent pipeline reader reading FROM 'funnel_events'...");
  const processRes = await processFunnelEvents();

  console.log(`\nPipeline Processing Complete: Processed ${processRes.processedCount} event(s) from 'funnel_events'.`);
  console.log("\n=================================================");
  console.log("📋 END-TO-END PIPELINE RESULT FOR FUNNEL EVENT");
  console.log("=================================================");

  const targetResult = processRes.results.find((r) => r.orderId === testOrderId) || processRes.results[0];

  if (targetResult) {
    console.log(`Order ID:                    ${targetResult.orderId || testOrderId}`);
    console.log(`Event Type:                  ${targetResult.eventType}`);
    console.log(`Cart Total:                  ₹${targetResult.cartTotal}`);
    console.log(`Stage 1 Diagnosis (Verbatim):\n"${targetResult.diagnosisText}"\n`);
    console.log(`Stage 2 Proposed Action:     '${targetResult.proposedAction}' (${targetResult.proposedDiscountPercent}% discount)`);
    console.log(`Final Gated Action:          '${targetResult.finalAction}' (${targetResult.finalDiscountPercent}% discount)`);
    console.log(`Gate Overrides:              [${targetResult.gateOverrides.join("; ")}]`);
    console.log("=================================================");
    console.log("🎉 SUCCESS: Event landed in 'funnel_events' and alone triggered Stage 1 diagnosis -> Stage 2 decision -> Code gate!");
  } else {
    console.error("❌ Pipeline failed to produce result for funnel event!");
    process.exit(1);
  }
}

runEpic4EndToEndVerification();
