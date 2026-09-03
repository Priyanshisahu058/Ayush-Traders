import Razorpay from "razorpay";
import crypto from "crypto";

export function getRazorpayServerClient(): Razorpay | null {
  const key_id = process.env.RAZORPAY_KEY_ID || "rzp_test_AYUSH2026TEST";
  const key_secret = process.env.RAZORPAY_KEY_SECRET || "AYUSH2026TESTSECRET";

  if (!key_id || !key_secret) {
    console.warn("Razorpay credentials missing in environment");
    return null;
  }

  try {
    return new Razorpay({
      key_id,
      key_secret,
    });
  } catch (err) {
    console.error("Failed to initialize Razorpay server client:", err);
    return null;
  }
}

/**
 * Verifies Razorpay payment signature after successful checkout modal submission.
 * Standard formula: HMAC-SHA256(order_id + "|" + payment_id, secret) === signature
 */
export function verifyPaymentSignature(params: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): boolean {
  const key_secret = process.env.RAZORPAY_KEY_SECRET || "AYUSH2026TESTSECRET";
  if (!key_secret) return false;

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = params;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return false;

  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac("sha256", key_secret)
    .update(body)
    .digest("hex");

  return expectedSignature === razorpay_signature;
}

/**
 * Verifies Razorpay Webhook signature
 * Standard formula: HMAC-SHA256(bodyText, secret) === signature
 */
export function verifyWebhookSignature(
  bodyText: string,
  signature: string,
  secret?: string
): boolean {
  const webhookSecret = secret || process.env.RAZORPAY_WEBHOOK_SECRET || "AYUSH2026WEBHOOKSECRET";
  if (!webhookSecret || !signature) return false;

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(bodyText)
    .digest("hex");

  return expectedSignature === signature;
}
