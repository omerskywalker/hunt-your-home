"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const MONITOR_COOKIE = "_hyh_ok";
// 24-hour session
const MAX_AGE = 60 * 60 * 24;

export async function verifyPin(formData: FormData) {
  const pin = formData.get("pin") as string;
  const from = (formData.get("from") as string) || "/monitor/roadmap";

  const expected = process.env.ROADMAP_PIN;
  if (!expected) {
    // No PIN set — deny all access
    return { error: "Monitor access is not configured." };
  }

  if (pin !== expected) {
    return { error: "Incorrect PIN." };
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
