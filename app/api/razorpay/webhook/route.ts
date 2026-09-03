import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay/server";
import { getSupabaseClient } from "@/lib/supabase/client";
import { recordPaymentEvent } from "@/lib/supabase/paymentEvents";
import { recordFunnelEvent } from "@/lib/recovery/funnelEvents";
import { checkRateLimit } from "@/lib/security/rateLimiter";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") || "";

    // 1. FIRST LINE OF DEFENSE: Verify Webhook Signature
    if (signature) {
      const isValid = verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        console.warn("[Webhook Security] Invalid Razorpay webhook signature");
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
      }
    }

    // 2. SECOND LINE OF DEFENSE: IP Rate Limiting (Limit: 10 requests / min / IP)
    const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "127.0.0.1";
    const rateResult = checkRateLimit(clientIp, 10, 60 * 1000);
    if (!rateResult.allowed) {
      console.warn(`[Webhook Security] Rate limit exceeded for IP: ${clientIp}`);
      return NextResponse.json(
        { error: "Too Many Requests. Webhook rate limit exceeded." },
        { status: 429, headers: { "Retry-After": String(rateResult.resetSeconds) } }
      );
    }

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const eventType = body.event || "unknown";
    const payload = body.payload || {};
    const paymentEntity = payload.payment?.entity || {};
    const orderEntity = payload.order?.entity || {};

    const razorpayPaymentId = paymentEntity.id || "";
    const razorpayOrderId = paymentEntity.order_id || orderEntity.id || "";
    const orderId = paymentEntity.notes?.orderId || orderEntity.notes?.orderId || "unknown";
    const amount = (paymentEntity.amount || orderEntity.amount || 0) / 100;
    const currency = paymentEntity.currency || "INR";
    const failureReason = paymentEntity.error_description || paymentEntity.error_reason || null;

    // 2. IDEMPOTENCY CHECK: Log event to payment_events DB table
    const result = await recordPaymentEvent({
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      amount,
      currency,
      status:
        eventType === "payment.captured" || eventType === "order.paid"
          ? "captured"
          : eventType === "payment.authorized"
          ? "authorized"
          : eventType === "payment.failed"
          ? "failed"
          : "attempted",
      paymentMethod: paymentEntity.method || "online",
      failureReason,
      eventType,
      metadata: { event: eventType, rawPayload: payload },
    });

    // 3. Write event directly into standalone funnel_events table
    const funnelStatus =
      eventType === "payment.authorized"
        ? "authorized_not_captured"
        : eventType === "payment.failed"
        ? "payment_failed"
        : "payment_attempted";

    await recordFunnelEvent({
      orderId: orderId !== "unknown" ? orderId : undefined,
      eventType: eventType === "payment.failed" ? "payment_failed" : eventType === "payment.authorized" ? "authorized_not_captured" : eventType,
      cartTotal: amount,
      timeSinceEventHours: 0,
      paymentAttemptStatus: funnelStatus,
      rawContext: { razorpayOrderId, razorpayPaymentId, failureReason, rawPayload: payload },
    });

    if (result.duplicate) {
      console.log(`[Webhook Idempotency] Event '${eventType}' for payment '${razorpayPaymentId}' already processed.`);
      return NextResponse.json({ status: "already_processed", event: eventType });
    }

    // 3. Update Order Status in Supabase based on Webhook Event
    const supabase = getSupabaseClient();
    if (supabase && orderId && orderId !== "unknown") {
      if (eventType === "payment.captured" || eventType === "order.paid") {
        await supabase
          .from("orders")
          .update({
            payment_status: "Paid",
            order_status: "Order Confirmed",
            updated_at: new Date().toISOString(),
          })
          .or(`id.eq.${orderId},order_number.eq.#${orderId},order_number.eq.${orderId}`);
      } else if (eventType === "payment.failed") {
        await supabase
          .from("orders")
          .update({
            payment_status: "Payment Failed",
            updated_at: new Date().toISOString(),
          })
          .or(`id.eq.${orderId},order_number.eq.#${orderId},order_number.eq.${orderId}`);
      }
    }

    return NextResponse.json({ status: "processed", event: eventType });
  } catch (err: any) {
    console.error("Razorpay webhook route error:", err);
    return NextResponse.json(
      { error: err?.message || "Webhook processing error" },
      { status: 500 }
    );
  }
}
