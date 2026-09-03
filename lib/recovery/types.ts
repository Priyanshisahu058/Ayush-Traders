export type CheckoutEventType =
  | "cart_created"
  | "item_added"
  | "item_removed"
  | "checkout_started"
  | "payment_initiated"
  | "payment_failed"
  | "payment_success"
  | "payment_cancelled"
  | "recovery_started"
  | "recovery_completed"
  | "recovery_failed";

export type RecoveryOpportunityType =
  | "cart_abandonment"
  | "payment_failure"
  | "authorized_uncaptured";

export type BoundedAction =
  | "retry_payment"
  | "retry_payment_link"
  | "choose_another_payment_method"
  | "remind_customer_to_checkout"
  | "send_reminder"
  | "offer_discount"
  | "wait_and_monitor"
  | "no_action";

export type OpportunityStatus =
  | "detected"
  | "analyzing"
  | "action_ready"
  | "action_taken"
  | "recovered"
  | "failed"
  | "dismissed"
  | "expired";

export interface CheckoutEvent {
  id?: string;
  sessionId: string;
  customerId?: string;
  orderId?: string;
  eventType: CheckoutEventType;
  cartValue: number;
  metadata?: Record<string, any>;
  createdAt?: string;
}

export interface RecoveryOpportunity {
  id: string;
  type: RecoveryOpportunityType;
  orderId?: string;
  sessionId?: string;
  customerId?: string;
  amount: number;
  currency: string;
  reason: string;
  status: OpportunityStatus;
  priority: "high" | "medium" | "low";
  recommendedAction: BoundedAction;
  aiExplanation?: string;
  attemptCount: number;
  revenueAtRisk: number;
  revenueRecovered: number;
  createdAt: string;
  resolvedAt?: string;
  decisionTrace?: {
    eventType: string;
    failureCategory?: string;
    previousRetries: number;
    orderPaymentStatus: string;
    retryAllowed: boolean;
    agentDecision: BoundedAction;
    confidence: number;
    source: "gemini" | "rule_fallback" | "cached" | "llm_failure_fallback";
  };
}

export interface AgentDecision {
  decision: BoundedAction;
  reason: string;
  confidence: number;
  source: "gemini" | "rule_fallback" | "cached";
}

export interface RecoveryMetrics {
  totalOpportunities: number;
  cartAbandonments: number;
  paymentFailures: number;
  revenueAtRisk: number;
  recoveryAttempts: number;
  successfulRecoveries: number;
  revenueRecovered: number;
  recoveryRate: number;
  topReason: string;
  topAction: string;
}
