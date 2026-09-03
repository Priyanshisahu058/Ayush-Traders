import { NextResponse } from "next/server";
import { analyzePaymentFailureWithAI } from "@/lib/razorpay/aiPaymentAnalyzer";
import { recordPaymentEvent } from "@/lib/supabase/paymentEvents";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, paymentId, errorCode, errorDescription, reason, source, method } = body;

    const payload = {
      orderId: typeof orderId === "string" ? orderId : undefined,
      paymentId: typeof paymentId === "string" ? paymentId : undefined,
      errorCode: typeof errorCode === "string" ? errorCode : undefined,
      errorDescription: typeof errorDescription === "string" ? errorDescription : undefined,
      reason: typeof reason === "string" ? reason : undefined,
      source: typeof source === "string" ? source : undefined,
      method: typeof method === "string" ? method : undefined,
    };

    // Record persistent payment failure event
    if (payload.orderId || payload.paymentId) {
      await recordPaymentEvent({
        orderId: payload.orderId || "unknown",
        razorpayPaymentId: payload.paymentId,
        amount: 0,
        currency: "INR",
        status: "failed",
        failureReason: payload.reason || payload.errorCode || "payment_failed",
        eventType: "payment.failed",
        metadata: payload,
      });
    }

    // Run server-side analysis with caching & rule fallback
    const analysis = await analyzePaymentFailureWithAI(payload);

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (err: any) {
    console.error("Payment intelligence analyze route error:", err);
    return NextResponse.json(
      {
        success: false,
        analysis: {
          failure_category: "unknown",
          confidence: 0.5,
          customer_explanation: "We couldn't complete your payment request. No funds were debited.",
          recommended_action: "retry_payment",
          retry_allowed: true,
          source: "rule_fallback",
        },
      },
      { status: 200 }
    );
  }
}
