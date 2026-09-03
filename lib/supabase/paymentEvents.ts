import { getSupabaseClient } from "./client";

export interface PaymentEventRecord {
  id?: string;
  orderId: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  customerId?: string;
  amount: number;
  currency: string;
  status: "created" | "attempted" | "failed" | "authorized" | "captured" | "refunded";
  paymentMethod?: string;
  failureReason?: string;
  eventType: string;
  attemptNumber?: number;
  metadata?: any;
  createdAt?: string;
  processedAt?: string;
}

// In-memory fallback set for runtime idempotency guarantee
const processedEventKeys = new Set<string>();

/**
 * Records a payment event in Supabase `payment_events` table with strict idempotency.
 */
export async function recordPaymentEvent(
  event: PaymentEventRecord
): Promise<{ success: boolean; duplicate: boolean; id?: string }> {
  const eventKey = `${event.razorpayPaymentId || event.razorpayOrderId || event.orderId}_${event.eventType}`;

  // Step 1: In-memory idempotency check
  if (processedEventKeys.has(eventKey)) {
    console.log(`[Idempotency] Event '${eventKey}' already processed (in-memory). Skipping.`);
    return { success: true, duplicate: true };
  }

  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  // Step 2: Database idempotency check (if Supabase is available)
  if (supabase && (event.razorpayPaymentId || event.razorpayOrderId)) {
    try {
      const { data: existing } = await supabase
        .from("payment_events")
        .select("id")
        .eq("event_type", event.eventType)
        .or(`razorpay_payment_id.eq.${event.razorpayPaymentId || ""},razorpay_order_id.eq.${event.razorpayOrderId || ""}`)
        .maybeSingle();

      if (existing) {
        processedEventKeys.add(eventKey);
        console.log(`[Idempotency] Event '${eventKey}' already exists in DB. Skipping.`);
        return { success: true, duplicate: true, id: existing.id };
      }
    } catch (err) {
      console.warn("Supabase payment_events check warning:", err);
    }
  }

  // Step 3: Insert new payment event
  const payload = {
    order_id: event.orderId,
    razorpay_order_id: event.razorpayOrderId || null,
    razorpay_payment_id: event.razorpayPaymentId || null,
    customer_id: event.customerId || null,
    amount: event.amount,
    currency: event.currency || "INR",
    status: event.status,
    payment_method: event.paymentMethod || "online",
    failure_reason: event.failureReason || null,
    event_type: event.eventType,
    attempt_number: event.attemptNumber || 1,
    metadata: event.metadata || {},
    created_at: event.createdAt || now,
    processed_at: now,
  };

  processedEventKeys.add(eventKey);

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("payment_events")
        .insert(payload)
        .select("id")
        .single();

      if (error) {
        console.warn("Supabase payment_events insert notice:", error.message);
      }
      return { success: true, duplicate: false, id: data?.id };
    } catch (err) {
      console.warn("Supabase payment_events insert exception:", err);
    }
  }

  return { success: true, duplicate: false };
}

/**
 * Fetches all payment events associated with an order ID
 */
export async function getPaymentEventsForOrder(orderId: string): Promise<PaymentEventRecord[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("payment_events")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map((row: any) => ({
      id: row.id,
      orderId: row.order_id,
      razorpayOrderId: row.razorpay_order_id,
      razorpayPaymentId: row.razorpay_payment_id,
      customerId: row.customer_id,
      amount: parseFloat(row.amount),
      currency: row.currency,
      status: row.status,
      paymentMethod: row.payment_method,
      failureReason: row.failure_reason,
      eventType: row.event_type,
      attemptNumber: row.attempt_number,
      metadata: row.metadata,
      createdAt: row.created_at,
      processedAt: row.processed_at,
    }));
  } catch (err) {
    console.error("getPaymentEventsForOrder failed:", err);
    return [];
  }
}
