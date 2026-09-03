export type FailureCategory =
  | "bank_declined"
  | "insufficient_funds"
  | "card_declined"
  | "authentication_failed"
  | "network_failure"
  | "timeout"
  | "payment_cancelled"
  | "invalid_details"
  | "unknown";

export interface NormalizedFailurePayload {
  paymentId?: string;
  orderId?: string;
  errorCode?: string;
  errorDescription?: string;
  reason?: string;
  source?: string;
  method?: string;
}

export interface ClassificationResult {
  category: FailureCategory;
  explanation: string;
  recommendedAction: string;
  retryAllowed: boolean;
}

/**
 * Deterministically classifies payment failures from Razorpay metadata without guessing
 */
export function classifyPaymentFailure(meta: NormalizedFailurePayload): ClassificationResult {
  const code = (meta.errorCode || "").toLowerCase();
  const desc = (meta.errorDescription || meta.reason || "").toLowerCase();

  // 1. Payment Cancelled by User
  if (
    code.includes("bad_request_error") && desc.includes("cancelled") ||
    desc.includes("user cancelled") ||
    desc.includes("cancelled by user") ||
    desc.includes("checkout_cancelled") ||
    meta.reason === "payment_cancelled"
  ) {
    return {
      category: "payment_cancelled",
      explanation: "The payment window was closed before completing the authorization.",
      recommendedAction: "retry_payment",
      retryAllowed: true,
    };
  }

  // 2. Insufficient Funds
  if (
    desc.includes("insufficient") ||
    desc.includes("balance") ||
    desc.includes("funds") ||
    code.includes("insufficient_funds") ||
    meta.reason === "insufficient_funds"
  ) {
    return {
      category: "insufficient_funds",
      explanation: "The account or card balance was insufficient to authorize this transaction.",
      recommendedAction: "try_another_card_or_upi",
      retryAllowed: true,
    };
  }

  // 3. Authentication Failed (3DS OTP / PIN error)
  if (
    desc.includes("auth") ||
    desc.includes("otp") ||
    desc.includes("pin") ||
    desc.includes("password") ||
    desc.includes("verification failed") ||
    code.includes("authentication_failed") ||
    meta.reason === "authentication_failed"
  ) {
    return {
      category: "authentication_failed",
      explanation: "Security authentication or 3D Secure OTP verification was not completed.",
      recommendedAction: "retry_with_valid_otp",
      retryAllowed: true,
    };
  }

  // 4. Card Declined
  if (
    desc.includes("card declined") ||
    desc.includes("expired card") ||
    desc.includes("invalid card") ||
    code.includes("card_declined") ||
    meta.reason === "card_declined"
  ) {
    return {
      category: "card_declined",
      explanation: "Your card issuer declined this transaction. Please verify card details or expiry.",
      recommendedAction: "use_alternate_card_or_gpay",
      retryAllowed: true,
    };
  }

  // 5. Bank Declined
  if (
    desc.includes("bank") ||
    desc.includes("issuer") ||
    desc.includes("gateway declined") ||
    desc.includes("bank_declined") ||
    code.includes("gateway_error") ||
    meta.reason === "bank_declined"
  ) {
    return {
      category: "bank_declined",
      explanation: "Your bank declined this payment. No funds were debited from your account.",
      recommendedAction: "retry_with_another_payment_method",
      retryAllowed: true,
    };
  }

  // 6. Network Failure
  if (
    desc.includes("network") ||
    desc.includes("connectivity") ||
    desc.includes("connection") ||
    code.includes("network_error") ||
    meta.reason === "network_failure"
  ) {
    return {
      category: "network_failure",
      explanation: "A temporary network disruption occurred between the bank and gateway.",
      recommendedAction: "retry_in_a_moment",
      retryAllowed: true,
    };
  }

  // 7. Timeout
  if (
    desc.includes("timeout") ||
    desc.includes("timed out") ||
    code.includes("timeout") ||
    meta.reason === "timeout"
  ) {
    return {
      category: "timeout",
      explanation: "The payment authorization request timed out due to bank delay.",
      recommendedAction: "retry_payment",
      retryAllowed: true,
    };
  }

  // 8. Invalid Details (CVV / VPA mismatch)
  if (
    desc.includes("invalid vpa") ||
    desc.includes("cvv") ||
    desc.includes("expiry") ||
    code.includes("invalid_details") ||
    meta.reason === "invalid_details"
  ) {
    return {
      category: "invalid_details",
      explanation: "Entered payment details (CVV, UPI ID or Expiry) were invalid.",
      recommendedAction: "recheck_details_and_retry",
      retryAllowed: true,
    };
  }

  // 9. Unknown / Unspecified
  return {
    category: "unknown",
    explanation: "We couldn't determine the exact reason for the failed payment. No funds were debited.",
    recommendedAction: "retry_or_choose_another_method",
    retryAllowed: true,
  };
}
