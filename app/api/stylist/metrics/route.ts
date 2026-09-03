import { NextResponse } from "next/server";
import { fetchStylistMetrics, recordStylistEvent } from "@/lib/supabase/stylist";

export async function GET() {
  try {
    const metrics = await fetchStylistMetrics();
    return NextResponse.json({
      success: true,
      metrics,
    });
  } catch (err: any) {
    console.error("GET /api/stylist/metrics error:", err);
    return NextResponse.json(
      {
        success: false,
        metrics: {
          totalSessions: 0,
          recommendationsGenerated: 0,
          clarificationsAsked: 0,
          refinementRequests: 0,
          clickedProductsCount: 0,
        },
      },
      { status: 200 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { sessionId, eventType } = body;
    if (sessionId && eventType) {
      await recordStylistEvent(sessionId, eventType);
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || err }, { status: 400 });
  }
}
