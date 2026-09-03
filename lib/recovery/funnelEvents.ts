import { getSupabaseClient } from "../supabase/client";

export interface FunnelEventPayload {
  orderId?: string;
  customerId?: string;
  eventType: "cart_abandoned" | "payment_failed" | "authorized_not_captured" | "payment_captured" | string;
  cartTotal: number;
  timeSinceEventHours?: number;
  paymentAttemptStatus?: string;
  customerPurchaseHistoryCount?: number;
  productCategory?: string;
  rawContext?: Record<string, any>;
}

const localFunnelEventsMemory: FunnelEventPayload[] = [];

/**
 * Inserts a funnel event into Supabase `funnel_events` standalone table
 */
export async function recordFunnelEvent(
  payload: FunnelEventPayload
): Promise<{ success: boolean; data?: any }> {
  localFunnelEventsMemory.push(payload);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from("funnel_events").insert({
        order_id: payload.orderId || null,
        customer_id: payload.customerId || null,
        event_type: payload.eventType,
        cart_total: payload.cartTotal,
        time_since_event_hours: payload.timeSinceEventHours || 0,
        payment_attempt_status: payload.paymentAttemptStatus || null,
        customer_purchase_history_count: payload.customerPurchaseHistoryCount || 0,
        product_category: payload.productCategory || null,
        raw_context: payload.rawContext || {},
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.warn("Notice inserting funnel_event to Supabase:", error.message);
        return { success: false };
      }

      return { success: true, data };
    } catch (err: any) {
      console.warn("Notice inserting funnel_event to Supabase:", err?.message || err);
    }
  }

  return { success: true };
}

export function getLocalFunnelEvents(): FunnelEventPayload[] {
  return localFunnelEventsMemory;
}
