import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase/client";
import { detectCartAbandonment } from "@/lib/recovery/cartAbandonment";
import { processFunnelEvents } from "@/lib/recovery/funnelProcessor";
import { checkRateLimit } from "@/lib/security/rateLimiter";

export const dynamic = "force-dynamic";

/**
 * Cron API Route: Automatically scans idle sessions for cart abandonments
 * Scheduled via Vercel Cron (configured in vercel.json)
 */
export async function GET(request: Request) {
  try {
    // 1. FIRST LINE OF DEFENSE: Cron Secret Authorization Check
    const authHeader = request.headers.get("authorization") || "";
    const cronHeader = request.headers.get("x-cron-secret") || "";
    const expectedSecret = process.env.CRON_SECRET || "AT_CRON_SECRET_2026";
    const providedSecret = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : cronHeader;

    if (providedSecret !== expectedSecret) {
      console.warn("[Cron Security] Unauthorized access attempt to /api/cron/scan-idle-carts");
      return NextResponse.json(
        { error: "Unauthorized. Valid CRON_SECRET authorization header required." },
        { status: 401 }
      );
    }

    // 2. SECOND LINE OF DEFENSE: IP Rate Limiting (Limit: 5 requests / min / IP)
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "127.0.0.1";
    const rateResult = checkRateLimit(clientIp, 5, 60 * 1000);
    if (!rateResult.allowed) {
      console.warn(`[Cron Security] Rate limit exceeded for IP: ${clientIp}`);
      return NextResponse.json(
        { error: "Too Many Requests. Cron rate limit exceeded." },
        { status: 429, headers: { "Retry-After": String(rateResult.resetSeconds) } }
      );
    }
    const supabase = getSupabaseClient();
    const detectedAbandonments: any[] = [];
    const scannedSessions: string[] = [];

    // Query idle checkout sessions from DB (sessions updated > 15 mins ago with no payment_success)
    if (supabase) {
      try {
        const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
        const { data: idleEvents } = await supabase
          .from("checkout_events")
          .select("session_id, cart_value, created_at")
          .lt("created_at", fifteenMinsAgo)
          .order("created_at", { ascending: false })
          .limit(20);

        if (idleEvents && idleEvents.length > 0) {
          for (const ev of idleEvents) {
            scannedSessions.push(ev.session_id);
            const res = await detectCartAbandonment({
              sessionId: ev.session_id,
              cartValue: Number(ev.cart_value) || 2500,
              itemsCount: 1,
              lastActivityTime: ev.created_at,
              inactivityThresholdMs: 15 * 60 * 1000,
            });

            if (res.isAbandoned && res.opportunity) {
              detectedAbandonments.push(res.opportunity);
            }
          }
        }
      } catch (e) {
        console.warn("[Cron Scan Idle Carts] Supabase query notice:", e);
      }
    }

    // Process all events from standalone funnel_events table via Two-Stage Pipeline
    const processorResult = await processFunnelEvents();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      scannedSessionsCount: scannedSessions.length,
      detectedAbandonmentsCount: detectedAbandonments.length,
      funnelEventsProcessedCount: processorResult.processedCount,
      results: processorResult.results,
    });
  } catch (error: any) {
    console.error("[Cron Scan Idle Carts] Error during automated execution:", error);
    return NextResponse.json(
      { error: "Failed to process idle carts scan", message: error?.message || error },
      { status: 500 }
    );
  }
}
