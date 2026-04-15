import { getAlertHistory, getPriceHistory } from "@/lib/storage";

export async function GET(
  request: Request,
  { params }: { params: { zpid: string } }
) {
  try {
    const { zpid } = params;
    
    if (!zpid) {
      return Response.json(
        { success: false, error: "ZPID is required" },
        { status: 400 }
      );
    }

    const [alerts, priceHistory] = await Promise.all([
      getAlertHistory(),
      getPriceHistory(zpid),
    ]);

    const alertRecord = alerts.find(alert => alert.listing.id === zpid);
    
    if (!alertRecord) {
      return Response.json(
        { success: false, error: "Listing not found" },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: {
        alert: alertRecord,
        priceHistory,
      },
    });
  } catch (err) {
    console.error("GET /api/listings/[zpid] error:", err);
    return Response.json(
      { success: false, error: "Failed to load listing" },
      { status: 500 }
    );
  }
}