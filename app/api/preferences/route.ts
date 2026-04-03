import { NextRequest } from "next/server";
import { getPreferences, savePreferences } from "@/lib/storage";
import { UserPreferences } from "@/lib/types";

export async function GET() {
  try {
    const prefs = await getPreferences();
    return Response.json({ success: true, data: prefs });
  } catch (err) {
    console.error("GET /api/preferences error:", err);
    return Response.json(
      { success: false, error: "Failed to load preferences" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<UserPreferences>;
    await savePreferences(body);
    const updated = await getPreferences();
    return Response.json({ success: true, data: updated });
  } catch (err) {
    console.error("POST /api/preferences error:", err);
    return Response.json(
      { success: false, error: "Failed to save preferences" },
      { status: 500 }
    );
  }
}
