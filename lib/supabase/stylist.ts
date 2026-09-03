import { getSupabaseClient } from "./client";

export interface StylistMetricData {
  totalSessions: number;
  recommendationsGenerated: number;
  clarificationsAsked: number;
  refinementRequests: number;
  clickedProductsCount: number;
}

// Memory fallback store for runtime session tracking
const runtimeStylistEvents: Array<{
  sessionId: string;
  eventType: "session_start" | "recommendation_generated" | "clarification_asked" | "refinement_requested" | "product_clicked";
  timestamp: string;
}> = [];

export async function recordStylistEvent(
  sessionId: string,
  eventType: "session_start" | "recommendation_generated" | "clarification_asked" | "refinement_requested" | "product_clicked"
) {
  runtimeStylistEvents.push({
    sessionId,
    eventType,
    timestamp: new Date().toISOString(),
  });

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await supabase.from("stylist_events").insert({
        session_id: sessionId,
        event_type: eventType,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      // Supabase table might not exist yet, runtime fallback recorded above
    }
  }
}

export async function fetchStylistMetrics(): Promise<StylistMetricData> {
  const supabase = getSupabaseClient();
  let events = [...runtimeStylistEvents];

  if (supabase) {
    try {
      const { data } = await supabase.from("stylist_events").select("*");
      if (data && data.length > 0) {
        events = data.map((row: any) => ({
          sessionId: row.session_id,
          eventType: row.event_type,
          timestamp: row.created_at,
        }));
      }
    } catch (e) {}
  }

  const sessions = new Set(events.map((e) => e.sessionId));
  const recommendations = events.filter((e) => e.eventType === "recommendation_generated").length;
  const clarifications = events.filter((e) => e.eventType === "clarification_asked").length;
  const refinements = events.filter((e) => e.eventType === "refinement_requested").length;
  const clicks = events.filter((e) => e.eventType === "product_clicked").length;

  return {
    totalSessions: sessions.size,
    recommendationsGenerated: recommendations,
    clarificationsAsked: clarifications,
    refinementRequests: refinements,
    clickedProductsCount: clicks,
  };
}
