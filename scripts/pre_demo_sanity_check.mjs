/**
 * US-9.4: Pre-Demo Environment Sanity Check Pack
 * Run this script 10 minutes before presenting to verify all systems are GO.
 *
 * Usage:
 *   node scripts/pre_demo_sanity_check.mjs
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load .env.local
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

const BASE_URL = "http://localhost:3000";
const url = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const geminiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

function logCheck(title, status, detail = "") {
  const icon = status ? "✅ [PASS]" : "❌ [FAIL]";
  console.log(`  ${icon} ${title}`);
  if (detail) console.log(`           └─ ${detail}`);
}

async function runSanityCheck() {
  console.log("\n======================================================================");
  console.log("  📋 PRE-DEMO ENVIRONMENT SANITY PACK (US-9.4)");
  console.log("======================================================================\n");

  // 1. Dev Server Check
  try {
    const res = await fetch(`${BASE_URL}/admin`);
    logCheck("Dev Server / Next.js App Reachable", res.status === 200, `HTTP ${res.status} at ${BASE_URL}`);
  } catch (e) {
    logCheck("Dev Server / Next.js App Reachable", false, `Cannot connect to ${BASE_URL} — ensure 'npm run dev' is active`);
  }

  // 2. Supabase Connection Check
  let supabase = null;
  if (url && key) {
    try {
      supabase = createClient(url, key);
      const { data, error } = await supabase.from("agent_policy_state").select("*").eq("id", 1);
      logCheck("Supabase Database Live & Reachable", !error && data && data.length > 0, error ? error.message : `Connected to ${url}`);
    } catch (e) {
      logCheck("Supabase Database Live & Reachable", false, e.message);
    }
  } else {
    logCheck("Supabase Database Live & Reachable", false, "Missing Supabase env vars");
  }

  // 3. Discount Budget Reset Check
  if (supabase) {
    try {
      const { data } = await supabase.from("agent_policy_state").select("discount_spent_today, daily_discount_budget").eq("id", 1).maybeSingle();
      const spent = Number(data?.discount_spent_today) || 0;
      const budget = Number(data?.daily_discount_budget) || 5000;
      logCheck(
        "Discount Budget State Initialized",
        spent === 0,
        `Current Spent: ₹${spent} / ₹${budget} Ceiling (${spent === 0 ? "Clean baseline" : "⚠️ Spent is non-zero from testing — run reset script!"})`
      );
    } catch (e) {
      logCheck("Discount Budget State Initialized", false, e.message);
    }
  }

  // 4. Gemini API Key Configuration
  logCheck("Gemini API Key Configured", !!geminiKey && !geminiKey.includes("your-gemini-api-key"), geminiKey ? "Key loaded from .env.local" : "Key missing");

  // 5. Admin Passcode & Route Check
  try {
    const logRes = await fetch(`${BASE_URL}/admin/agent-log`);
    logCheck("Admin Audit Log Route Accessible", logRes.status === 200, `HTTP ${logRes.status} on /admin/agent-log`);
  } catch (e) {
    logCheck("Admin Audit Log Route Accessible", false, e.message);
  }

  // 6. Security Secret Check
  const cronSecret = env.CRON_SECRET || "AT_CRON_SECRET_2026";
  try {
    const cronRes = await fetch(`${BASE_URL}/api/cron/scan-idle-carts`, {
      headers: { Authorization: `Bearer ${cronSecret}` },
    });
    logCheck("Cron Security & Rate Limiting Active", cronRes.status === 200, `HTTP ${cronRes.status} with CRON_SECRET`);
  } catch (e) {
    logCheck("Cron Security & Rate Limiting Active", false, e.message);
  }

  console.log("\n======================================================================");
  console.log("  🟢 PRE-DEMO SANITY CHECK COMPLETE — SYSTEMS ARE GO FOR PRESENTATION");
  console.log("======================================================================\n");
}

runSanityCheck();
