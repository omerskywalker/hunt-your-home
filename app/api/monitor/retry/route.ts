import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { findItem, getBranchName, buildAgentPrompt, REPO } from "@/lib/roadmap-data";
import { getRoadmapOverrides } from "@/lib/storage";

const MONITOR_COOKIE = "_hyh_ok";

async function isAuthorized(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(MONITOR_COOKIE)?.value === "1";
}

async function ghFetch(path: string, options: RequestInit = {}) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN not set");
  return fetch(`https://api.github.com/repos/${REPO}${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
}

export async function POST(request: NextRequest) {
  if (!(await isAuthorized())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { itemId } = await request.json() as { itemId: string };
  const item = findItem(itemId);
  if (!item) {
    return Response.json({ error: `Unknown item: ${itemId}` }, { status: 400 });
  }

  const overrides = await getRoadmapOverrides();
  const override = overrides[itemId];
  const prNumber = override?.pr ?? item.pr;
  if (!prNumber) {
    return Response.json({ error: "No PR found for this item" }, { status: 400 });
  }

  const branch = getBranchName(item);
  const prompt = buildAgentPrompt(item);

  const dispatchRes = await ghFetch("/actions/workflows/agent.yml/dispatches", {
    method: "POST",
    body: JSON.stringify({
      ref: "main",
      inputs: {
        item_id: item.id,
        branch,
        pr_number: String(prNumber),
        prompt,
      },
    }),
  });

  if (!dispatchRes.ok) {
    const err = await dispatchRes.text();
    console.error("Retry dispatch failed:", dispatchRes.status, err);
    return Response.json({ error: "Failed to re-trigger agent" }, { status: 502 });
  }

  return Response.json({ success: true });
}
