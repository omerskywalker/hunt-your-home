import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { findItem, getBranchName, buildAgentPrompt, REPO } from "@/lib/roadmap-data";
import { setRoadmapOverride } from "@/lib/storage";

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
  if (item.status === "done") {
    return Response.json({ error: "Item is already done" }, { status: 400 });
  }

  const branch = getBranchName(item);
  const prompt = buildAgentPrompt(item);

  // 1. Get main SHA
  const refRes = await ghFetch("/git/ref/heads/main");
  if (!refRes.ok) throw new Error("Failed to fetch main ref");
  const refData = await refRes.json() as { object: { sha: string } };
  const mainSha = refData.object.sha;

  // 2. Create branch
  const branchRes = await ghFetch("/git/refs", {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: mainSha }),
  });
  if (!branchRes.ok && branchRes.status !== 422) {
    // 422 = branch already exists, that's fine
    throw new Error("Failed to create branch");
  }

  // 3. Create draft PR
  const prBody = `## Roadmap item\nCloses #${item.issue ?? ""}\n\n## What changed\n_Implemented by Claude Code agent — see workflow run for details._\n\n## Test plan\n- [ ] Tests written and passing (\`pnpm test\`)\n- [ ] Type-check clean (\`pnpm tsc --noEmit\`)\n- [ ] CI pipeline green\n- [ ] \`lib/roadmap-data.ts\` updated with PR number and status\n- [ ] Manually verified on production after merge`;

  const prRes = await ghFetch("/pulls", {
    method: "POST",
    body: JSON.stringify({
      title: `feat: ${item.title}`,
      head: branch,
      base: "main",
      body: prBody,
      draft: true,
    }),
  });
  if (!prRes.ok) {
    const err = await prRes.json() as { message?: string };
    throw new Error(`Failed to create PR: ${err.message ?? prRes.status}`);
  }
  const pr = await prRes.json() as { number: number; html_url: string };

  // 4. Trigger workflow_dispatch on agent.yml
  const dispatchRes = await ghFetch("/actions/workflows/agent.yml/dispatches", {
    method: "POST",
    body: JSON.stringify({
      ref: branch,
      inputs: {
        item_id: item.id,
        branch,
        pr_number: String(pr.number),
        prompt,
      },
    }),
  });
  // 204 = success, 422 = workflow not found on that ref yet (first push)
  if (!dispatchRes.ok && dispatchRes.status !== 422) {
    console.error("Workflow dispatch failed:", dispatchRes.status);
    // Non-fatal — branch and PR were created, user can trigger manually
  }

  // 5. Store override in KV
  await setRoadmapOverride(itemId, {
    status: "in-progress",
    pr: pr.number,
    startedAt: new Date().toISOString(),
  });

  return Response.json({ success: true, pr: pr.number, prUrl: pr.html_url, branch });
}
