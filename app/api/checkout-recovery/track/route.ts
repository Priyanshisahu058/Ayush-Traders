import { NextResponse } from "next/server";
import { recordCheckoutEvent } from "@/lib/recovery/checkoutEvents";
import { CheckoutEventType } from "@/lib/recovery/types";
import { checkRateLimit } from "@/lib/security/rateLimiter";

export async function POST(request: Request) {
  try {
    // 1. IP Rate Limiting (Limit: 15 requests / min / IP)
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "127.0.0.1";
    const rateResult = checkRateLimit(clientIp, 15, 60 * 1000);
    if (!rateResult.allowed) {
      console.warn(`[Track Security] Rate limit exceeded for IP: ${clientIp}`);
      return NextResponse.json(
        { success: false, error: "Too Many Requests. Tracking rate limit exceeded." },
        { status: 429, headers: { "Retry-After": String(rateResult.resetSeconds) } }
      );
    }
    const body = await request.json();
    const { sessionId, orderId, eventType, cartValue, metadata } = body;

    if (!sessionId || !eventType) {
      return NextResponse.json({ success: false, error: "sessionId and eventType required" }, { status: 400 });
    }

    const res = await recordCheckoutEvent({
      sessionId,
      orderId,
      eventType: eventType as CheckoutEventType,
      cartValue: typeof cartValue === "number" ? cartValue : parseFloat(cartValue || "0"),
      metadata: metadata || {},
    });

    return NextResponse.json({
      success: true,
      duplicate: res.duplicate,
      id: res.id,
    });
  } catch (err: any) {
    console.error("Checkout recovery track error:", err);
    return NextResponse.json({ success: false, error: err?.message || "Failed to track event" }, { status: 500 });
  }
}
