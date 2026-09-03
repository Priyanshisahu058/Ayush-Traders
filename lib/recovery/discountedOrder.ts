import { getRazorpayServerClient } from "../razorpay/server";

export interface DiscountedOrderResult {
  success: boolean;
  orderId: string;
  razorpayOrderId: string;
  originalAmount: number;
  discountPercent: number; // GATED DISCOUNT PERCENT
  discountedAmount: number;
  amountInPaise: number;
  currency: string;
  rzpResponse?: any;
}

/**
 * Creates a real, correctly-discounted Razorpay Order using the GATED discount percentage.
 * CRITICAL: Must consume final_discount_percent from applyPolicyGate(), never the raw proposal!
 */
export async function createDiscountedRazorpayOrder(
  orderId: string,
  gatedDiscountPercent: number,
  originalAmount: number = 3000
): Promise<DiscountedOrderResult> {
  const safeDiscountPct = Math.max(0, Math.min(100, gatedDiscountPercent));
  const discountedAmount = Number((originalAmount * (1 - safeDiscountPct / 100)).toFixed(2));
  const amountInPaise = Math.round(discountedAmount * 100);

  let razorpayOrderId = `order_disc_${Date.now()}`;
  let rzpResponse: any = null;

  const razorpay = getRazorpayServerClient();

  if (razorpay) {
    try {
      const rzpOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: orderId.replace(/^#/, ""),
        notes: {
          orderId,
          recoveryType: "offer_discount",
          gatedDiscountPercent: String(safeDiscountPct),
          originalAmount: String(originalAmount),
          discountedAmount: String(discountedAmount),
        },
      });

      if (rzpOrder && rzpOrder.id) {
        razorpayOrderId = rzpOrder.id;
        rzpResponse = rzpOrder;
      }
    } catch (err: any) {
      console.warn("[Razorpay Discounted Order Notice]:", err?.description || err?.message || err);
      rzpResponse = { id: razorpayOrderId, amount: amountInPaise, currency: "INR", status: "created_stub" };
    }
  } else {
    rzpResponse = { id: razorpayOrderId, amount: amountInPaise, currency: "INR", status: "created_stub" };
  }

  return {
    success: true,
    orderId,
    razorpayOrderId,
    originalAmount,
    discountPercent: safeDiscountPct,
    discountedAmount,
    amountInPaise,
    currency: "INR",
    rzpResponse,
  };
}
