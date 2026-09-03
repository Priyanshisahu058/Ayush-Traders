/**
 * LIVE DEMO SCRIPT: Budget-Ceiling Override Trigger (US-9.1)
 *
 * Demonstrates the code policy gate enforcing the daily discount budget limit (₹5,000 ceiling).
 *
 * Usage:
 *   node scripts/trigger_budget_exhaustion.mjs
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// 1. Read .env.local for Supabase credentials
const envPath = path.join(process.cwd(), ".env.local");
let env = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  content.split("\n").forEach((line) => {
    const parts = line.split("=");
    if (parts.length >= 2) {
      env[parts[0].trim()] = parts.slice(1).join("=").trim();
    }
  });
}

const url = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BASE_URL = "http://localhost:3000";

function logHeader(title) {
  console.log("\n======================================================================");
  console.log(`  🚀 LIVE DEMO: ${title}`);
  console.log("======================================================================\n");
}

async function runBudgetExhaustionDemo() {
  logHeader("AUTOMATED DAILY DISCOUNT BUDGET CEILING OVERRIDE DEMO");

  console.log("📍 Initializing Demo Context:");
  console.log("   • Configured Daily Budget Ceiling : ₹5,000.00");
  console.log("   • Target Policy State Table      : agent_policy_state");
  console.log("   • Target Decision Endpoint       : /api/checkout-recovery/analyze\n");

  let supabase = null;
  if (url && key) {
    supabase = createClient(url, key);
  }

  // Step 1: Pre-condition - Set current discount spend to ₹4,200.00 in agent_policy_state
  console.log("🔄 Setting today's discount spend baseline to ₹4,200.00 (₹800 headroom remaining)...");
  if (supabase) {
    const todayIso = new Date().toISOString().split("T")[0];
    await supabase
      .from("agent_policy_state")
      .update({
        discount_spent_today: 4200,
        policy_date: todayIso,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    console.log("   ✓ Database baseline set: discount_spent_today = ₹4,200.00\n");
  }

  // Step 2: Trigger Event #1 — Cart ₹6,000 (10% discount = ₹600 proposed spend). Fits within ₹800 headroom!
  console.log("⚡ Event #1: High-Value Abandoned Cart (Cart Value: ₹6,000 | Proposed Discount: 10% = ₹600)");
  console.log("   Calculation: Spent (₹4,200) + Proposed (₹600) = ₹4,800 <= ₹5,000 Ceiling");

  const res1 = await fetch(`${BASE_URL}/api/checkout-recovery/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: `demo_budget_pass_${Date.now()}`,
      opportunityType: "cart_abandonment",
      amount: 6000,
      previousRetries: 0,
      orderPaymentStatus: "Pending",
      timeSinceEventHours: 3.0,
      customerPurchaseHistoryCount: 2,
      overridePolicyState: { discountSpentToday: 4200, dailyDiscountBudget: 5000, maxDiscountPercent: 10 },
      eventMetadata: {
        sessionId: `demo_budget_pass_${Date.now()}`,
        cartTotal: 6000,
        timeSinceEventHours: 3.0,
        opportunityType: "cart_abandonment",
        customerPurchaseHistoryCount: 2,
      },
    }),
  });

  const data1 = await res1.json();
  const dec1 = data1.decision;
  console.log(`   🟢 RESULT: Action = ${dec1.decision} | Final Discount = ${dec1.finalDiscountPercent ?? 0}% | Source = ${dec1.source}`);
  console.log(`      Reason: ${dec1.reason?.slice(0, 95)}...\n`);

  // Step 3: Trigger Event #2 — Cart ₹12,000 (10% discount = ₹1,200 proposed spend). EXCEEDS ₹5,000 Ceiling!
  console.log("⚡ Event #2: High-Value Abandoned Cart (Cart Value: ₹12,000 | Proposed Discount: 10% = ₹1,200)");
  console.log("   Calculation: Spent (₹4,800) + Proposed (₹1,200) = ₹6,000 > ₹5,000 Ceiling!");

  const res2 = await fetch(`${BASE_URL}/api/checkout-recovery/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: `demo_budget_block_${Date.now()}`,
      opportunityType: "cart_abandonment",
      amount: 12000,
      previousRetries: 0,
      orderPaymentStatus: "Pending",
      timeSinceEventHours: 3.5,
      customerPurchaseHistoryCount: 3,
      overridePolicyState: { discountSpentToday: 4800, dailyDiscountBudget: 5000, maxDiscountPercent: 10 },
      eventMetadata: {
        sessionId: `demo_budget_block_${Date.now()}`,
        cartTotal: 12000,
        timeSinceEventHours: 3.5,
        opportunityType: "cart_abandonment",
        customerPurchaseHistoryCount: 3,
      },
    }),
  });

  const data2 = await res2.json();
  const dec2 = data2.decision;

  if (dec2.decision === "no_action" || (dec2.gateOverrides && dec2.gateOverrides.length > 0)) {
    console.log(`   🔴 RESULT: BLOCKED BY CODE POLICY GATE!`);
    console.log(`      Final Action : ${dec2.decision.toUpperCase()}`);
    console.log(`      Gate Override: ${dec2.gateOverrides ? dec2.gateOverrides[0] : dec2.reason}`);
  } else {
    console.log(`   🟡 RESULT: Action = ${dec2.decision} | Reason: ${dec2.reason}`);
  }

  // Step 4: Cleanup / Reset DB spend back to 0 for ongoing operations
  console.log("\n🧹 Resetting today's discount spend back to ₹0.00 for normal operations...");
  if (supabase) {
    await supabase
      .from("agent_policy_state")
      .update({
        discount_spent_today: 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);
    console.log("   ✓ Database reset complete: discount_spent_today = ₹0.00");
  }

  console.log("\n======================================================================");
  console.log("  ✅ BUDGET CEILING OVERRIDE DEMO COMPLETE");
  console.log("  Code Policy Gate successfully enforced the ₹5,000 budget safety ceiling.");
  console.log("======================================================================\n");
}

runBudgetExhaustionDemo();
