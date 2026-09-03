import crypto from "crypto";
import { verifyPaymentSignature, verifyWebhookSignature } from "../lib/razorpay/server.js";
import { recordPaymentEvent } from "../lib/supabase/paymentEvents.js";

async function runDay1AcceptanceTests() {
  console.log("=================================================");
  console.log("🧪 DAY 1 — RAZORPAY PAYMENT FOUNDATION TEST SUITE");
  console.log("=================================================\n");

  let passed = 0;
  let total = 5;

  const TEST_SECRET = "AYUSH2026TESTSECRET";
  process.env.RAZORPAY_KEY_SECRET = TEST_SECRET;
  process.env.RAZORPAY_WEBHOOK_SECRET = "AYUSH2026WEBHOOKSECRET";

  // ---------------------------------------------------------
  // TEST 1 — Successful Payment Signature Verification
  // ---------------------------------------------------------
  console.log("Test 1: Valid Payment Signature Verification");
  const orderId = "order_RzpTest_1001";
  const paymentId = "pay_RzpTest_5001";
  const validSignature = crypto
    .createHmac("sha256", TEST_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const isTest1Valid = verifyPaymentSignature({
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: validSignature,
  });

  if (isTest1Valid) {
    console.log("✅ PASS: Valid signature correctly verified!");
    passed++;
  } else {
    console.error("❌ FAIL: Valid signature failed verification.");
  }
  console.log("-------------------------------------------------");

  // ---------------------------------------------------------
  // TEST 2 — Invalid Signature Security Block
  // ---------------------------------------------------------
  console.log("Test 2: Invalid Signature Security Block");
  const tamperedSignature = "tampered_fake_signature_123456789";

  const isTest2Valid = verifyPaymentSignature({
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: tamperedSignature,
  });

  if (!isTest2Valid) {
    console.log("✅ PASS: Tampered signature correctly REJECTED by security block!");
    passed++;
  } else {
    console.error("❌ FAIL: Tampered signature was incorrectly accepted!");
  }
  console.log("-------------------------------------------------");

  // ---------------------------------------------------------
  // TEST 3 — Webhook Signature Verification
  // ---------------------------------------------------------
  console.log("Test 3: Webhook Signature Verification");
  const sampleWebhookBody = JSON.stringify({
    event: "payment.captured",
    payload: { payment: { entity: { id: paymentId, amount: 189000, status: "captured" } } },
  });
  const validWebhookSig = crypto
    .createHmac("sha256", "AYUSH2026WEBHOOKSECRET")
    .update(sampleWebhookBody)
    .digest("hex");

  const isWebhookValid = verifyWebhookSignature(sampleWebhookBody, validWebhookSig, "AYUSH2026WEBHOOKSECRET");

  if (isWebhookValid) {
    console.log("✅ PASS: Webhook HMAC signature verified successfully!");
    passed++;
  } else {
    console.error("❌ FAIL: Webhook signature verification failed.");
  }
  console.log("-------------------------------------------------");

  // ---------------------------------------------------------
  // TEST 4 — Webhook Idempotency (Same event twice)
  // ---------------------------------------------------------
  console.log("Test 4: Webhook Idempotency Guarantee (Duplicate Event)");
  const eventPayload = {
    orderId: "ATO-9988",
    razorpayOrderId: orderId,
    razorpayPaymentId: paymentId,
    amount: 1890,
    currency: "INR",
    status: "captured",
    eventType: "payment.captured",
  };

  const firstAttempt = await recordPaymentEvent(eventPayload);
  const secondAttempt = await recordPaymentEvent(eventPayload);

  if (firstAttempt.duplicate === false && secondAttempt.duplicate === true) {
    console.log("✅ PASS: Idempotency confirmed! First attempt logged, 2nd attempt flagged as 'already_processed'.");
    passed++;
  } else {
    console.error(`❌ FAIL: Idempotency test failed. 1st dup=${firstAttempt.duplicate}, 2nd dup=${secondAttempt.duplicate}`);
  }
  console.log("-------------------------------------------------");

  // ---------------------------------------------------------
  // TEST 5 — Failed Payment Event Logging
  // ---------------------------------------------------------
  console.log("Test 5: Failed Payment Event Logging");
  const failedEventPayload = {
    orderId: "ATO-9989",
    razorpayOrderId: "order_RzpTest_1002",
    razorpayPaymentId: "pay_RzpTest_5002",
    amount: 2500,
    currency: "INR",
    status: "failed",
    failureReason: "Payment failed by user choice in Razorpay Test Modal",
    eventType: "payment.failed",
  };

  const failedResult = await recordPaymentEvent(failedEventPayload);

  if (failedResult.success) {
    console.log("✅ PASS: Failed payment event successfully logged to payment_events!");
    passed++;
  } else {
    console.error("❌ FAIL: Failed payment event logging failed.");
  }
  console.log("=================================================");

  console.log(`\nRESULTS: ${passed}/${total} Acceptance Tests PASSED.`);
  if (passed === total) {
    console.log("🎉 ALL DAY 1 RAZORPAY FOUNDATION ACCEPTANCE TESTS PASSED SUCCESSFULLY!\n");
  } else {
    process.exit(1);
  }
}

runDay1AcceptanceTests();
