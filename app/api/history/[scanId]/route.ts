import { getScanRecordById } from "@/lib/storage";

export async function GET(
  request: Request,
  { params }: { params: { scanId: string } }
) {
  try {
    const { scanId } = params;
    
    if (!scanId) {
      return Response.json(
        { success: false, error: "Scan ID is required" },
        { status: 400 }
      );
    }

    const scanRecord = await getScanRecordById(scanId);
    
    if (!scanRecord) {
      return Response.json(
        { success: false, error: "Scan record not found" },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: scanRecord,
    });
  } catch (err) {
    console.error("GET /api/history/[scanId] error:", err);
    return Response.json(
      { success: false, error: "Failed to load scan record" },
      { status: 500 }
    );
  }
}