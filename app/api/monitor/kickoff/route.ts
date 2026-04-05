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

async function fetchContextFiles(files: string[]): Promise<string> {
  const results = await Promise.allSettled(
    files.map(async (filePath) => {
      const res = await ghFetch(`/contents/${filePath}`);
      if (!res.ok) return null;
      const data = await res.json() as { content: string };
      const decoded = Buffer.from(data.content, "base64").toString("utf-8");
      const lang = filePath.endsWith(".tsx") ? "tsx" : filePath.endsWith(".ts") ? "ts" : filePath.endsWith(".json") ? "json" : "";
      return `### ${filePath}\n\`\`\`${lang}\n${decoded}\n\`\`\``;
    })
  );
  const fetched = results
    .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled" && r.value !== null)
    .map((r) => r.value)
    .join("\n\n");

  // Always append the project gotchas — prevents repeating history
  const gotchasRes = await ghFetch("/contents/WIKI/gotchas.md");
  if (gotchasRes.ok) {
    const gotchasData = await gotchasRes.json() as { content: string };
    const gotchas = Buffer.from(gotchasData.content, "base64").toString("utf-8");
    return fetched + `\n\n### WIKI/gotchas.md (read this — do not repeat these mistakes)\n\`\`\`markdown\n${gotchas}\n\`\`\``;
  }
  return fetched;
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

  // Fetch context files from GitHub and embed in the prompt so the agent
  // doesn't waste turns discovering the codebase
  const injectedContext = item.contextFiles?.length
    ? await fetchContextFiles(item.contextFiles)
    : undefined;
  const prompt = buildAgentPrompt(item, injectedContext);

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
    throw new Error("Failed to create branch");
  }

  // 3. Push an initial commit so the branch is ahead of main
  const taskContent = Buffer.from(
    `# Agent Task: ${item.title}\n\n${item.description}\n\n## Test requirements\n${item.testRequirements}\n`
  ).toString("base64");

  // If .agent-task already exists on the branch, get its SHA first
  const existingRes = await ghFetch(`/contents/.agent-task?ref=${branch}`);
  const existingData = existingRes.ok ? await existingRes.json() as { sha: string } : null;

  await ghFetch(`/contents/.agent-task`, {
    method: "PUT",
    body: JSON.stringify({
      message: `chore: init task branch for ${item.id} -- ${item.title}`,
      content: taskContent,
      branch,
      ...(existingData ? { sha: existingData.sha } : {}),
    }),
  });

  // 4. Create draft PR
  const prBody = `## Roadmap item\nCloses #${item.issue ?? ""}\n\n## What changed\n_Implemented by Claude Code agent — see workflow run for details._\n\n## Test plan\n- [ ] Tests written and passing (\`pnpm test\`)\n- [ ] Type-check clean (\`pnpm tsc --noEmit\`)\n- [ ] CI pipeline green\n- [ ] Manually verified on production after merge`;

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

  let pr: { number: number; html_url: string };
  if (!prRes.ok) {
    if (prRes.status === 422) {
      // PR already exists — find it
      const listRes = await ghFetch(`/pulls?head=omerskywalker:${branch}&state=open`);
      const list = listRes.ok ? await listRes.json() as Array<{ number: number; html_url: string }> : [];
      if (!list.length) throw new Error("Failed to create or find PR");
      pr = list[0];
    } else {
      const err = await prRes.json() as { message?: string };
      throw new Error(`Failed to create PR: ${err.message ?? prRes.status}`);
    }
  } else {
    pr = await prRes.json() as { number: number; html_url: string };
  }

  // 5. Trigger workflow_dispatch on agent.yml (always from main ref)
  const dispatchRes = await ghFetch("/actions/workflows/agent.yml/dispatches", {
    method: "POST",
    body: JSON.stringify({
      ref: "main",
      inputs: {
        item_id: item.id,
        branch,
        pr_number: String(pr.number),
        prompt,
      },
    }),
  });
  if (!dispatchRes.ok && dispatchRes.status !== 422) {
    console.error("Workflow dispatch failed:", dispatchRes.status);
  }

  // 6. Store override in KV
  await setRoadmapOverride(itemId, {
    status: "in-progress",
    pr: pr.number,
    startedAt: new Date().toISOString(),
  });

  return Response.json({ success: true, pr: pr.number, prUrl: pr.html_url, branch });
}
