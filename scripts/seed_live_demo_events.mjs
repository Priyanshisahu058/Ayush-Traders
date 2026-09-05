import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");

let supabaseUrl = "";
let supabaseKey = "";

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_URL=")) {
      supabaseUrl = trimmed.split("=")[1].trim();
    }
    if (trimmed.startsWith("NEXT_PUBLIC_SUPABASE_ANON_KEY=")) {
      supabaseKey = trimmed.split("=")[1].trim();
    }
  }
}

const LIVE_SITE = "https://ayush-traders-jet.vercel.app";

async function main() {
  console.log("=================================================");
  console.log(`🚀 SEEDING LIVE DEMO EVENTS TO DEPLOYED APP (${LIVE_SITE})`);
  console.log("=================================================\n");

  const testEvents = [
    {
      opportunityType: "cart_abandonment",
      orderId: "ATO-DEMO-8801",
      sessionId: "sess_live_101",
      amount: 5500,
      previousRetries: 0,
      orderPaymentStatus: "Unpaid",
      timeSinceEventHours: 3.5,
      customerPurchaseHistoryCount: 1,
      paymentAttemptStatus: "unpaid",
    },
    {
      opportunityType: "payment_failure",
      orderId: "ATO-DEMO-8802",
      sessionId: "sess_live_102",
      amount: 3200,
      previousRetries: 1,
      orderPaymentStatus: "Payment Failed",
      timeSinceEventHours: 0.5,
      customerPurchaseHistoryCount: 0,
      paymentAttemptStatus: "failed",
    },
    {
      opportunityType: "authorized_uncaptured",
      orderId: "ATO-DEMO-8803",
      sessionId: "sess_live_103",
      amount: 7400,
      previousRetries: 0,
      orderPaymentStatus: "Authorized",
      timeSinceEventHours: 1.0,
      customerPurchaseHistoryCount: 2,
      paymentAttemptStatus: "authorized_not_captured",
    },
  ];

  for (const ev of testEvents) {
    console.log(`📡 Sending live recovery request for ${ev.orderId} (${ev.opportunityType})...`);
    try {
      const res = await fetch(`${LIVE_SITE}/api/checkout-recovery/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ev),
      });
      const data = await res.json();
      console.log(`   ✓ Status ${res.status}: Decision = ${data.decision?.decision} | Discount = ${data.decision?.finalDiscountPercent}%`);
    } catch (err) {
      console.error(`   ❌ Failed sending event for ${ev.orderId}:`, err.message);
    }
  }

  // Also seed payment intelligence
  const paymentFailures = [
    {
      orderId: "ATO-DEMO-8802",
      paymentId: "pay_live_test_001",
      errorCode: "BAD_REQUEST_ERROR",
      errorDescription: "Payment failed due to bank OTP timeout",
      reason: "payment_cancelled",
    },
    {
      orderId: "ATO-DEMO-8804",
      paymentId: "pay_live_test_002",
      errorCode: "GATEWAY_ERROR",
      errorDescription: "Server connection timed out during bank authentication",
      reason: "gateway_error",
    },
  ];

  for (const pf of paymentFailures) {
    console.log(`\n📡 Sending payment failure intelligence for ${pf.orderId}...`);
    try {
      const res = await fetch(`${LIVE_SITE}/api/payment-intelligence/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pf),
      });
      const data = await res.json();
      console.log(`   ✓ Status ${res.status}: Explanation = "${data.analysis?.customer_explanation}"`);
    } catch (err) {
      console.error(`   ❌ Failed sending payment intelligence:`, err.message);
    }
  }

  console.log("\n=================================================");
  console.log("🎉 LIVE DEMO SEEDING COMPLETE!");
  console.log("=================================================");
}

main();
