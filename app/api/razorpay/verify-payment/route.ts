import { NextResponse } from "next/server";
import { verifyPaymentSignature } from "@/lib/razorpay/server";
import { getSupabaseClient } from "@/lib/supabase/client";
import { recordPaymentEvent } from "@/lib/supabase/paymentEvents";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required Razorpay payment verification parameters" },
        { status: 400 }
      );
    }

    // SECURITY: Server-side HMAC-SHA256 signature verification
    const isValid = verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      console.warn(`[Security Block] Invalid Razorpay payment signature for order '${order_id}'`);

      // Record failed verification attempt in payment_events
      await recordPaymentEvent({
        orderId: order_id || "unknown",
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        amount: 0,
        currency: "INR",
        status: "failed",
        failureReason: "Invalid HMAC signature",
        eventType: "payment.failed",
      });

      return NextResponse.json(
        { success: false, error: "Invalid payment signature. Verification failed." },
        { status: 400 }
      );
    }

    // Payment Verified! Update order payment status in Supabase
    const supabase = getSupabaseClient();
    if (supabase && order_id) {
      try {
        await supabase
          .from("orders")
          .update({
            payment_status: "Paid",
            order_status: "Order Confirmed",
            updated_at: new Date().toISOString(),
          })
          .or(`id.eq.${order_id},order_number.eq.#${order_id},order_number.eq.${order_id}`);
      } catch (err) {
        console.warn("Failed to update order status in Supabase:", err);
      }
    }

    // Log captured event in payment_events
    await recordPaymentEvent({
      orderId: order_id || "unknown",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      amount: 0,
      currency: "INR",
      status: "captured",
      paymentMethod: "Razorpay Online",
      eventType: "payment.captured",
    });

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully",
      orderId: order_id,
      paymentId: razorpay_payment_id,
    });
  } catch (err: any) {
    console.error("Razorpay verify-payment route error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server verification error" },
      { status: 500 }
    );
  }
}
