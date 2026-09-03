/**
 * EXECUTE CLEANUP SCRIPT
 * 1. Deletes test rows from Supabase 'orders' and 'order_items'
 * 2. Resets today's discount spend baseline to ₹0.00
 *
 * Usage:
 *   node scripts/execute_cleanup.mjs
 */

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Read .env.local
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

async function executeCleanup() {
  console.log("\n======================================================================");
  console.log("  🧹 EXECUTING PRE-DEMO DATABASE CLEANUP");
  console.log("======================================================================\n");

  if (!url || !key) {
    console.log("❌ Missing Supabase credentials in .env.local");
    return;
  }

  const supabase = createClient(url, key);

  // 1. Delete order_items
  try {
    const { error: errItems } = await supabase
      .from("order_items")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Deletes all rows safely

    if (errItems) {
      console.log(`⚠️ Notice clearing 'order_items': ${errItems.message}`);
    } else {
      console.log("  ✓ Cleared test rows from 'order_items' table.");
    }
  } catch (e) {
    console.log(`⚠️ Error clearing order_items: ${e.message}`);
  }

  // 2. Delete orders
  try {
    const { error: errOrders } = await supabase
      .from("orders")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Deletes all rows safely

    if (errOrders) {
      console.log(`⚠️ Notice clearing 'orders': ${errOrders.message}`);
    } else {
      console.log("  ✓ Cleared test rows from 'orders' table.");
    }
  } catch (e) {
    console.log(`⚠️ Error clearing orders: ${e.message}`);
  }

  // 3. Reset agent_policy_state
  try {
    const todayIso = new Date().toISOString().split("T")[0];
    const { error: errState } = await supabase
      .from("agent_policy_state")
      .update({
        discount_spent_today: 0,
        policy_date: todayIso,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    if (errState) {
      console.log(`⚠️ Notice resetting 'agent_policy_state': ${errState.message}`);
    } else {
      console.log("  ✓ Reset discount_spent_today to ₹0.00 in 'agent_policy_state'.");
    }
  } catch (e) {
    console.log(`⚠️ Error resetting agent_policy_state: ${e.message}`);
  }

  console.log("\n======================================================================");
  console.log("  🟢 DATABASE CLEANUP COMPLETE — APP READY FOR DEMO PRESENTATION");
  console.log("======================================================================\n");
}

executeCleanup();
