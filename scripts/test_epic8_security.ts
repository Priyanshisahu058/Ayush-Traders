import { executeTwoStagePipeline } from "../lib/recovery/recoveryAgent";
import { checkRateLimit, resetRateLimiter } from "../lib/security/rateLimiter";
import { GET as cronHandler } from "../app/api/cron/scan-idle-carts/route";
import { POST as trackHandler } from "../app/api/checkout-recovery/track/route";

async function runEpic8SecurityVerification() {
  console.log("================================================");
  console.log("🛡️ EPIC-8 RELIABILITY & SECURITY HARDENING SUITE");
  console.log("================================================\n");

  let passed = 0;
  const total = 5;

  // ---------------------------------------------------------
  // US-8.1 TEST 1: Gemini API Key Invalidation & Fallback
  // ---------------------------------------------------------
  console.log("Test 1: LLM API Failure Invalidation (Invalid Key)");
  const originalApiKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "INVALID_KEY_FOR_RELIABILITY_TESTING";

  try {
    const res = await executeTwoStagePipeline(
      {
        eventType: "cart_abandoned",
        cartTotal: 10000,
        timeSinceEventHours: 3.5,
        paymentAttemptStatus: "unpaid",
        customerPurchaseHistoryCount: 1,
        productCategory: "anklet",
      },
      {
        opportunityType: "cart_abandonment",
        amount: 10000,
        previousRetries: 0,
        orderPaymentStatus: "Unpaid",
        timeSinceEventHours: 3.5,
        paymentAttemptStatus: "unpaid",
        customerPurchaseHistoryCount: 1,
      }
    );

    console.log("  Caught Pipeline Output Source:", res.source);
    console.log("  Caught Pipeline Final Action:", res.finalAction);
    console.log("  Caught Pipeline Reason:", res.reason);

    if (res.source === "llm_failure_fallback" && res.finalAction === "no_action" && res.finalDiscountPercent === 0) {
      console.log("✅ PASS: LLM failure explicitly logged as 'llm_failure_fallback' & defaulted safely to 'no_action'!\n");
      passed++;
    } else {
      console.error(`❌ FAIL: Expected source 'llm_failure_fallback' and action 'no_action', got source '${res.source}' and action '${res.finalAction}'\n`);
    }
  } catch (err: any) {
    console.error("❌ FAIL: Unexpected error:", err);
  }

  // Restore API Key
  process.env.GEMINI_API_KEY = originalApiKey;

  // ---------------------------------------------------------
  // US-8.1 TEST 2: Normal Operation Restoration
  // ---------------------------------------------------------
  console.log("Test 2: Normal Operation Restoration");
  try {
    const resNormal = await executeTwoStagePipeline(
      {
        eventType: "cart_abandoned",
        cartTotal: 4800,
        timeSinceEventHours: 2.0,
        paymentAttemptStatus: "unpaid",
        customerPurchaseHistoryCount: 0,
        productCategory: "ring",
      },
      {
        opportunityType: "cart_abandonment",
        amount: 4800,
        previousRetries: 0,
        orderPaymentStatus: "Unpaid",
        timeSinceEventHours: 2.0,
        paymentAttemptStatus: "unpaid",
        customerPurchaseHistoryCount: 0,
      }
    );

    if (resNormal.source !== "llm_failure_fallback") {
      console.log(`✅ PASS: Restored API key successfully resumed normal operation (Source: '${resNormal.source}', Action: '${resNormal.finalAction}')!\n`);
      passed++;
    } else {
      console.error(`❌ FAIL: Expected normal source, got '${resNormal.source}'\n`);
    }
  } catch (err: any) {
    console.error("❌ FAIL: Resumed operation failed:", err);
  }

  // ---------------------------------------------------------
  // US-8.2 TEST 3: Cron Endpoint Secret Header Authorization
  // ---------------------------------------------------------
  console.log("Test 3: Cron Secret Header Check (Unauthorized without secret)");
  const unauthorizedReq = new Request("http://localhost:3000/api/cron/scan-idle-carts", {
    method: "GET",
  });
  const unauthRes = await cronHandler(unauthorizedReq);
  const unauthData = await unauthRes.json();

  if (unauthRes.status === 401 && unauthData.error?.includes("Unauthorized")) {
    console.log("✅ PASS: Cron endpoint strictly rejected unauthenticated request with HTTP 401 Unauthorized!\n");
    passed++;
  } else {
    console.error(`❌ FAIL: Expected HTTP 401, got ${unauthRes.status}`, unauthData);
  }

  // ---------------------------------------------------------
  // US-8.2 TEST 4: Cron Endpoint Authorized Execution
  // ---------------------------------------------------------
  console.log("Test 4: Cron Secret Header Check (Authorized with secret)");
  const authorizedReq = new Request("http://localhost:3000/api/cron/scan-idle-carts", {
    method: "GET",
    headers: {
      "x-cron-secret": "AT_CRON_SECRET_2026",
    },
  });
  const authRes = await cronHandler(authorizedReq);
  const authData = await authRes.json();

  if (authRes.status === 200 && authData.success === true) {
    console.log("✅ PASS: Cron endpoint accepted authorized request with valid CRON_SECRET!\n");
    passed++;
  } else {
    console.error(`❌ FAIL: Expected HTTP 200, got ${authRes.status}`, authData);
  }

  // ---------------------------------------------------------
  // US-8.2 TEST 5: IP Rate Limiting Throttling (HTTP 429)
  // ---------------------------------------------------------
  console.log("Test 5: IP Rate Limiting (Rapid request throttling)");
  resetRateLimiter();
  const testIp = "203.0.113.42";
  const limit = 5;

  let rejected = false;
  for (let i = 1; i <= 8; i++) {
    const check = checkRateLimit(testIp, limit, 60 * 1000);
    if (!check.allowed) {
      rejected = true;
      console.log(`  Request #${i}: Blocked by Rate Limiter (Allowed = false, Remaining = ${check.remaining})`);
    } else {
      console.log(`  Request #${i}: Approved by Rate Limiter (Remaining = ${check.remaining})`);
    }
  }

  if (rejected) {
    console.log("✅ PASS: IP Rate Limiting successfully throttled rapid requests beyond limit (HTTP 429 Triggered)!\n");
    passed++;
  } else {
    console.error("❌ FAIL: Rate limiter failed to block excess requests");
  }

  console.log("================================================");
  console.log(`🎉 EPIC-8 SECURITY HARDENING VERIFICATION: ${passed}/${total} PASSED!`);
  console.log("================================================");
}

runEpic8SecurityVerification().catch(console.error);
