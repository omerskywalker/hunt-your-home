import { NextRequest } from "next/server";
import { getBookmarks, addBookmark, removeBookmark, updateBookmarkNotes } from "@/lib/storage";
import { AIScoredListing } from "@/lib/types";

export async function GET() {
  try {
    const bookmarks = await getBookmarks();
    return Response.json({ success: true, data: bookmarks });
  } catch (err) {
    return Response.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { listing: AIScoredListing };
    await addBookmark(body.listing);
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = (await request.json()) as { zpid: string };
    await removeBookmark(body.zpid);
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = (await request.json()) as { zpid: string; notes: string };
    if (body.notes && body.notes.length > 500) {
      return Response.json({ success: false, error: "Notes cannot exceed 500 characters" }, { status: 400 });
    }
    await updateBookmarkNotes(body.zpid, body.notes);
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ success: false, error: String(err) }, { status: 500 });
  }
}
