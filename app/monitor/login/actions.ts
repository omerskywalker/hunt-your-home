"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const MONITOR_COOKIE = "_hyh_ok";
const MAX_AGE = 60 * 60 * 24; // 24 hours

export async function verifyPin(formData: FormData): Promise<void> {
  const pin = formData.get("pin") as string;
  const from = (formData.get("from") as string) || "/monitor/roadmap";

  const expected = process.env.ROADMAP_PIN;

  if (!expected || pin !== expected) {
    redirect(`/monitor/login?error=1&from=${encodeURIComponent(from)}`);
  }

  const cookieStore = await cookies();
  cookieStore.set(MONITOR_COOKIE, "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });

  redirect(from);
}
