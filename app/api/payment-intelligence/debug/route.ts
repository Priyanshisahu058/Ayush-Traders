import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase/client";

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ success: false, message: "Supabase client unconfigured" });
    }

    const { data: events } = await supabase.from("payment_events").select("*");
    const { data: recoveryEvents } = await supabase.from("payment_recovery_events").select("*");
    const { data: orders } = await supabase.from("orders").select("id, order_number, payment_status, order_status, created_at");

    const totalEvents = events?.length || 0;
    const successfulEvents = events?.filter((e) => e.status === "captured" || e.status === "Paid" || e.event_type === "payment.captured").length || 0;
    const failedEvents = events?.filter((e) => e.status === "failed" || e.event_type === "payment.failed").length || 0;

    // Unverified / suspicious orders check
    const unverifiedConfirmedOrders = (orders || []).filter((o) => {
      const payStatus = (o.payment_status || "").toLowerCase();
      const orderStatus = (o.order_status || "").toLowerCase();
      const isFailedOrUnpaid = payStatus.includes("failed") || payStatus.includes("attempted") || payStatus.includes("pending");
      const isConfirmed = orderStatus.includes("confirmed") || orderStatus.includes("dispatched");
      return isFailedOrUnpaid && isConfirmed;
    });

    return NextResponse.json({
      success: true,
      diagnostics: {
        totalPaymentEvents: totalEvents,
        successfulEvents,
        failedEvents,
        recoveryEventsCount: recoveryEvents?.length || 0,
        totalOrders: orders?.length || 0,
        unverifiedConfirmedOrdersCount: unverifiedConfirmedOrders.length,
        unverifiedConfirmedOrders,
        recentEvents: (events || []).slice(0, 10),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || err }, { status: 500 });
  }
}
