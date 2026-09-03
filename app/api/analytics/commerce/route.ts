import { NextResponse } from "next/server";
import { getCommerceMetricsFromDatabase } from "@/lib/analytics/commerceMetrics";

export async function GET() {
  try {
    const metrics = await getCommerceMetricsFromDatabase();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      metrics,
    });
  } catch (err: any) {
    console.error("Commerce analytics API error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to compute commerce analytics",
      },
      { status: 500 }
    );
  }
}
