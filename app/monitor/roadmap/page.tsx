import { ROADMAP, REPO, getBatchProgress, getOverallProgress, RoadmapItem, ItemStatus } from "@/lib/roadmap-data";
import { getRoadmapOverrides, RoadmapOverride } from "@/lib/storage";
import { KickoffButton } from "./KickoffButton";
import { InProgressBadge } from "./InProgressBadge";
import { RoadmapPoller } from "./RoadmapPoller";
import { RetryButton } from "./RetryButton";

// Re-fetch on every request so status is always live
export const dynamic = "force-dynamic";
export const revalidate = 0;

// ── GitHub PR status fetching ──────────────────────────────────────────────

interface GhPr {
  state: "open" | "closed";
  merged_at: string | null;
  title: string;
  html_url: string;
  head: { ref: string };
  // check_suites not available on basic PR endpoint; we fetch separately
}

interface CiStatus {
  conclusion: "success" | "failure" | "pending" | null;
}

async function fetchPrStatus(pr: number): Promise<{ pr: GhPr; ci: CiStatus } | null> {
  try {
    const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
    if (process.env.GITHUB_TOKEN) headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;

    const prRes = await fetch(`https://api.github.com/repos/${REPO}/pulls/${pr}`, {
      headers,
      next: { revalidate: 60 },
    });

    if (prRes.status === 404) {
      // PR might be closed, try issues endpoint
      const issueRes = await fetch(`https://api.github.com/repos/${REPO}/issues/${pr}`, {
        headers,
        next: { revalidate: 60 },
      });
      if (!issueRes.ok) return null;
      const issue = await issueRes.json() as GhPr;
      return { pr: issue, ci: { conclusion: null } };
    }
    if (!prRes.ok) return null;

    const prData = await prRes.json() as GhPr;

    // Fetch CI check runs for the head commit
    const checksRes = await fetch(
      `https://api.github.com/repos/${REPO}/commits/${prData.head?.ref}/check-runs`,
      { headers, next: { revalidate: 60 } }
    );
    let ci: CiStatus = { conclusion: null };
    if (checksRes.ok) {
      const checksData = await checksRes.json() as { check_runs: Array<{ conclusion: string | null }> };
      const runs = checksData.check_runs ?? [];
      const failed = runs.some((r) => r.conclusion === "failure");
      const pending = runs.some((r) => r.conclusion === null || r.conclusion === "in_progress");
      ci = {
        conclusion: failed ? "failure" : pending ? "pending" : runs.length > 0 ? "success" : null,
      };
    }

    return { pr: prData, ci };
  } catch {
    return null;
  }
}

async function fetchAllPrStatuses() {
  const allItems = ROADMAP.flatMap((b) => b.items);
  const itemsWithPr = allItems.filter((i) => i.pr != null);
  const results = await Promise.all(
    itemsWithPr.map(async (item) => ({
      id: item.id,
      data: await fetchPrStatus(item.pr!),
    }))
  );
  return Object.fromEntries(results.map((r) => [r.id, r.data]));
}

// ── Status helpers ─────────────────────────────────────────────────────────

function statusLabel(status: ItemStatus) {
  switch (status) {
    case "done":        return "✅ Done";
    case "in-progress": return "🔄 In Progress";
    case "paused":      return "⏸️ Paused";
    default:            return "🔲 Not Started";
  }
}

function statusColor(status: ItemStatus) {
  switch (status) {
    case "done":        return "#39D353";
    case "in-progress": return "#58A6FF";
    case "paused":      return "#8B949E";
    default:            return "#30363D";
  }
}

function ciDot(conclusion: CiStatus["conclusion"]) {
  if (conclusion === "success") return { color: "#39D353", label: "CI ✓" };
  if (conclusion === "failure") return { color: "#FF6B35", label: "CI ✗" };
  if (conclusion === "pending") return { color: "#F0C040", label: "CI …" };
  return null;
}

// ── Components ─────────────────────────────────────────────────────────────

function ProgressBar({ pct, color = "#39D353" }: { pct: number; color?: string }) {
  return (
    <div style={{ height: 4, background: "#21262D", borderRadius: 99, overflow: "hidden", width: "100%" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.4s" }} />
    </div>
  );
}

function ItemRow({
  item,
  prData,
  override,
}: {
  item: RoadmapItem;
  prData: Awaited<ReturnType<typeof fetchPrStatus>>;
  override?: RoadmapOverride;
}) {
  const dot = prData ? ciDot(prData.ci.conclusion) : null;
  const isMerged = prData?.pr?.merged_at != null;
  const effectiveStatus: ItemStatus = isMerged ? "done" : (override?.status ?? item.status);
  const effectivePr = item.pr ?? override?.pr;

  return (
    <div
      style={{
        padding: "12px 0",
        borderBottom: "1px solid #141C16",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {/* Top row: id + title + status badge */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span style={{ fontSize: 11, color: "#484F58", minWidth: 28, paddingTop: 2, fontFamily: "var(--font-inter, sans-serif)" }}>
          {item.id}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: effectiveStatus === "done" ? "#8B949E" : "#E6EDF3",
              textDecoration: effectiveStatus === "done" ? "line-through" : "none",
              fontFamily: "var(--font-inter, sans-serif)",
              lineHeight: 1.4,
            }}
          >
            {item.title}
          </span>
          <p style={{ fontSize: 11, color: "#484F58", marginTop: 3, lineHeight: 1.5, fontFamily: "var(--font-inter, sans-serif)" }}>
            {item.description}
          </p>
        </div>
      </div>

      {/* Bottom row: status pill + PR link + CI badge + tests */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", paddingLeft: 38 }}>
        {effectiveStatus === "in-progress" ? (
          <InProgressBadge />
        ) : (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: statusColor(effectiveStatus),
              background: `${statusColor(effectiveStatus)}18`,
              border: `1px solid ${statusColor(effectiveStatus)}40`,
              borderRadius: 6,
              padding: "2px 8px",
              fontFamily: "var(--font-inter, sans-serif)",
            }}
          >
            {statusLabel(effectiveStatus)}
          </span>
        )}

        <KickoffButton itemId={item.id} disabled={effectiveStatus !== "not-started"} />
        {effectiveStatus === "in-progress" && prData?.ci.conclusion === "failure" && (
          <RetryButton itemId={item.id} />
        )}

        {effectivePr && (
          <a
            href={`https://github.com/${REPO}/pull/${effectivePr}`}
            target="_blank"
            rel="noopener"
            style={{
              fontSize: 11,
              color: "#58A6FF",
              textDecoration: "none",
              background: "rgba(88,166,255,0.08)",
              border: "1px solid rgba(88,166,255,0.2)",
              borderRadius: 6,
              padding: "2px 8px",
              fontFamily: "var(--font-inter, sans-serif)",
            }}
          >
            PR #{effectivePr}
          </a>
        )}

        {dot && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: dot.color,
              fontFamily: "var(--font-inter, sans-serif)",
            }}
          >
            {dot.label}
          </span>
        )}

        {item.tests && (
          <span style={{ fontSize: 11, color: "#39D353", fontFamily: "var(--font-inter, sans-serif)" }}>
            🧪 Tests
          </span>
        )}

        {item.branch && (
          <span
            style={{
              fontSize: 10,
              color: "#484F58",
              background: "#141C16",
              border: "1px solid #21262D",
              borderRadius: 4,
              padding: "2px 6px",
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            {item.branch}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default async function RoadmapMonitorPage() {
  const [prStatuses, overrides] = await Promise.all([
    fetchAllPrStatuses(),
    getRoadmapOverrides(),
  ]);
  const overall = getOverallProgress();

  // Compute effective statuses for poller (mirrors ItemRow logic)
  const allItems = ROADMAP.flatMap((b) => b.items);
  const inProgressIds = allItems
    .filter((item) => {
      const isMerged = prStatuses[item.id]?.pr?.merged_at != null;
      const effective: ItemStatus = isMerged ? "done" : (overrides[item.id]?.status ?? item.status);
      return effective === "in-progress";
    })
    .map((item) => item.id);
  const doneIds = allItems
    .filter((item) => {
      const isMerged = prStatuses[item.id]?.pr?.merged_at != null;
      const effective: ItemStatus = isMerged ? "done" : (overrides[item.id]?.status ?? item.status);
      return effective === "done";
    })
    .map((item) => item.id);

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#080E0A",
        color: "#E6EDF3",
        fontFamily: "var(--font-inter, sans-serif)",
        paddingBottom: 48,
      }}
    >
      <RoadmapPoller inProgressIds={inProgressIds} doneIds={doneIds} />

      {/* Header */}
      <div
        style={{
          background: "#0D1510",
          borderBottom: "1px solid #21262D",
          padding: "16px 16px 14px",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 17, fontWeight: 700, color: "#E6EDF3", fontFamily: "var(--font-space-grotesk, sans-serif)", marginBottom: 2 }}>
                <span style={{ color: "#8B949E" }}>Hunt</span>
                <span style={{ color: "#E6EDF3" }}>Your</span>
                <span style={{ color: "#39D353" }}>Home</span>
                <span style={{ color: "#484F58", fontWeight: 400, fontSize: 13 }}> — Roadmap v2</span>
              </h1>
              <p style={{ fontSize: 12, color: "#484F58" }}>
                {overall.done} / {overall.total} items complete · {overall.pct}%
              </p>
            </div>
            <div style={{ minWidth: 80 }}>
              <ProgressBar pct={overall.pct} />
            </div>
          </div>
        </div>
      </div>

      {/* Batches */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 16px" }}>
        {ROADMAP.map((batch) => {
          const { total, done, inProgress } = getBatchProgress(batch);
          const batchPct = Math.round((done / total) * 100);

          return (
            <div
              key={batch.number}
              style={{
                marginTop: 24,
                background: "#141C16",
                border: "1px solid #21262D",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              {/* Batch header */}
              <div
                style={{
                  padding: "14px 16px 12px",
                  borderBottom: "1px solid #21262D",
                  background: "#0D1510",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#39D353",
                        background: "rgba(57,211,83,0.1)",
                        border: "1px solid rgba(57,211,83,0.2)",
                        borderRadius: 6,
                        padding: "2px 8px",
                      }}
                    >
                      Batch {batch.number}
                    </span>
                    <h2 style={{ fontSize: 15, fontWeight: 700, color: "#E6EDF3", fontFamily: "var(--font-space-grotesk, sans-serif)" }}>
                      {batch.title}
                    </h2>
                  </div>
                  <span style={{ fontSize: 12, color: "#484F58" }}>
                    {done}/{total}
                    {inProgress > 0 && <span style={{ color: "#58A6FF" }}> · {inProgress} active</span>}
                  </span>
                </div>
                <ProgressBar pct={batchPct} color={done === total ? "#39D353" : "#58A6FF"} />
                <p style={{ fontSize: 12, color: "#484F58", marginTop: 8, lineHeight: 1.5 }}>
                  {batch.summary}
                </p>
              </div>

              {/* Items */}
              <div style={{ padding: "0 16px" }}>
                {batch.items.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    prData={prStatuses[item.id] ?? null}
                    override={overrides[item.id]}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Footer */}
        <div style={{ marginTop: 32, padding: "16px 0", borderTop: "1px solid #21262D" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 12, color: "#484F58" }}>
            {[
              ["🔲", "Not Started"],
              ["🔄", "In Progress"],
              ["✅", "Done"],
              ["⏸️", "Paused"],
              ["🧪", "Tests Written"],
              ["CI ✓", "Pipeline Green"],
            ].map(([sym, label]) => (
              <span key={label}>
                <span style={{ marginRight: 4 }}>{sym}</span>{label}
              </span>
            ))}
          </div>
          <p style={{ marginTop: 10, fontSize: 11, color: "#30363D" }}>
            Status synced from GitHub · refreshes on each page load
          </p>
        </div>
      </div>
    </div>
  );
}
