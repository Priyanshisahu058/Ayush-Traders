import { getSupabaseClient } from "../supabase/client";
import { CheckoutEvent } from "./types";

// In-memory fallback set for runtime event idempotency
const recordedEventKeys = new Set<string>();
const localEventsMemory: CheckoutEvent[] = [];

/**
 * Records a checkout funnel event into Supabase `checkout_events` with idempotency
 */
export async function recordCheckoutEvent(
  event: CheckoutEvent
): Promise<{ success: boolean; duplicate: boolean; id?: string }> {
  const eventKey = `${event.sessionId}_${event.orderId || "no_order"}_${event.eventType}_${event.cartValue}`;

  if (recordedEventKeys.has(eventKey)) {
    return { success: true, duplicate: true };
  }

  recordedEventKeys.add(eventKey);
  const now = new Date().toISOString();
  const eventRecord: CheckoutEvent = {
    ...event,
    id: `ev_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    createdAt: event.createdAt || now,
  };

  localEventsMemory.push(eventRecord);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const payload = {
        session_id: event.sessionId,
        customer_id: event.customerId || null,
        order_id: event.orderId || null,
        event_type: event.eventType,
        cart_value: event.cartValue,
        metadata: event.metadata || {},
        created_at: eventRecord.createdAt,
      };

      const { data, error } = await supabase
        .from("checkout_events")
        .insert(payload)
        .select("id")
        .single();

      if (!error && data?.id) {
        return { success: true, duplicate: false, id: data.id };
      }
    } catch (err) {
      console.warn("[Checkout Event] Supabase insert notice:", err);
    }
  }

  return { success: true, duplicate: false, id: eventRecord.id };
}

/**
 * Get all recorded checkout events for a session or order
 */
export async function getEventsForSession(sessionId: string): Promise<CheckoutEvent[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data } = await supabase
        .from("checkout_events")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (data && data.length > 0) {
        return data.map((row: any) => ({
          id: row.id,
          sessionId: row.session_id,
          customerId: row.customer_id,
          orderId: row.order_id,
          eventType: row.event_type,
          cartValue: parseFloat(row.cart_value || "0"),
          metadata: row.metadata,
          createdAt: row.created_at,
        }));
      }
    } catch (e) {}
  }

  return localEventsMemory.filter((e) => e.sessionId === sessionId);
}
