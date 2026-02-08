export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import LegendToggle from "./LegendToggle";
import LeaderboardViewControls from "./LeaderboardViewControls";

type SearchParams = {
  view?: "all" | "daily" | "monthly";
  date?: string;  // YYYY-MM-DD
  month?: string; // YYYY-MM
};

type LeaderboardRow = {
  player_id: string;
  player_name: string;

  // Attendance days in the selected range
  total_attendances: number;

  // Mutually exclusive buckets (no double counting)
  wins: number;                // non-DP wins
  losses: number;              // non-DP losses
  double_point_wins: number;   // DP wins
  double_point_losses: number; // DP losses

  mission_points_total: number;

  // includes attendance points already (2 per attendance day)
  total_points: number;

  rank: number;
};

/* ---------------- date helpers ---------------- */

function todaySydneyYYYYMMDD() {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date()); // YYYY-MM-DD
}

function currentSydneyYYYYMM() {
  return todaySydneyYYYYMMDD().slice(0, 7); // YYYY-MM
}

function monthRange(monthYYYYMM: string) {
  const [y, m] = monthYYYYMM.split("-").map(Number);
  const start = `${monthYYYYMM}-01`;

  // last day of the month in UTC
  const last = new Date(Date.UTC(y, m, 0));
  const yyyy = last.getUTCFullYear();
  const mm = String(last.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(last.getUTCDate()).padStart(2, "0");
  const end = `${yyyy}-${mm}-${dd}`;

  return { start, end };
}

function formatFriendlyDate(yyyyMmDd: string) {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));

  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(dt);
}

function formatFriendlyMonth(yyyyMm: string) {
  const [y, m] = yyyyMm.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, 1));

  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    month: "long",
    year: "numeric",
  }).format(dt);
}

/* ---------------- page ---------------- */

export default async function LeaderboardPage({
  searchParams,
}: {
  // ✅ Next.js 15: searchParams is a Promise
  searchParams: Promise<SearchParams>;
}) {
  const supabase = await supabaseServer();

  // Auth-protect this page
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // ✅ Unwrap searchParams Promise (Next.js 15 requirement)
  const sp = (await searchParams) ?? {};

  const defaultDate = todaySydneyYYYYMMDD();
  const defaultMonth = currentSydneyYYYYMM();

  const view = sp.view ?? "all";
  const date = sp.date ?? defaultDate;
  const month = sp.month ?? defaultMonth;

  let startDate: string | null = null;
  let endDate: string | null = null;

  if (view === "daily") {
    startDate = date;
    endDate = date;
  } else if (view === "monthly") {
    const r = monthRange(month);
    startDate = r.start;
    endDate = r.end;
  } else {
    startDate = null;
    endDate = null;
  }

  // Header title rules
  const baseTitle = "G Club Leaderboard";
  const headerTitle =
    view === "daily"
      ? `${baseTitle} — ${formatFriendlyDate(date)}`
      : view === "monthly"
      ? `${baseTitle} — ${formatFriendlyMonth(month)}`
      : baseTitle;

  // Call range-based leaderboard function
  const { data, error } = await supabase.rpc("leaderboard_range", {
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) {
    return (
      <main style={{ maxWidth: 1200, margin: "30px auto", padding: 16 }}>
        <h1 style={{ margin: 0 }}>{baseTitle}</h1>
        <pre style={{ color: "crimson", marginTop: 12 }}>{error.message}</pre>
      </main>
    );
  }

  const rows = (data ?? []) as LeaderboardRow[];

  return (
    <main style={{ maxWidth: 1200, margin: "30px auto", padding: 16 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>{headerTitle}</h1>
          <p style={{ marginTop: 6, opacity: 0.7 }}>
            Total Points include attendance points (2 points per day attended in this period).
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={pillStyle}>Rank = 1 is highest</span>
          <span style={pillStyle}>Attendances = days attended</span>
          <span style={pillStyle}>DP = double_point_flag</span>
        </div>
      </div>

      {/* View controls */}
      <LeaderboardViewControls
        defaultView="all"
        defaultDate={defaultDate}
        defaultMonth={defaultMonth}
      />

      {/* Legend */}
      <LegendToggle />

      {/* Table */}
      {rows.length === 0 ? (
        <p style={{ marginTop: 18 }}>
          No data for this period yet. Complete a match and try again.
        </p>
      ) : (
        <div style={{ marginTop: 16, overflowX: "auto" }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: 70 }}>Rank</th>
                <th style={{ ...thStyle, minWidth: 200 }}>Name</th>
                <th style={thStyle}>Total Points</th>
                <th style={thStyle}>Mission Points</th>
                <th style={thStyle}>Attendances</th>
                <th style={thStyle}>Total Matches Played</th>
                <th style={thStyle}>Wins</th>
                <th style={thStyle}>Losses</th>
                <th style={thStyle}>DP Wins</th>
                <th style={thStyle}>DP Losses</th>
                <th style={thStyle}>Win %</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, idx) => {
                const wins = row.wins ?? 0;
                const losses = row.losses ?? 0;
                const dpWins = row.double_point_wins ?? 0;
                const dpLosses = row.double_point_losses ?? 0;

                const matchesPlayed = wins + losses + dpWins + dpLosses;
                const totalWins = wins + dpWins;

                const winPct =
                  matchesPlayed > 0 ? Math.round((totalWins / matchesPlayed) * 100) : 0;

                const isTop3 = row.rank <= 3;

                return (
                  <tr
                    key={row.player_id}
                    style={{
                      background: isTop3 ? topRowBg(row.rank) : rowBg(idx),
                    }}
                  >
                    <td style={tdStyle}>
                      <span style={rankBadgeStyle(row.rank)}>{row.rank}</span>
                    </td>

                    <td style={{ ...tdStyle, fontWeight: 800 }}>
                      {row.player_name}
                    </td>

                    <td style={{ ...tdStyle, fontWeight: 900 }}>
                      {row.total_points}
                    </td>

                    <td style={tdStyle}>{row.mission_points_total}</td>
                    <td style={tdStyle}>{row.total_attendances}</td>
                    <td style={tdStyle}>{matchesPlayed}</td>
                    <td style={tdStyle}>{wins}</td>
                    <td style={tdStyle}>{losses}</td>
                    <td style={tdStyle}>{dpWins}</td>
                    <td style={tdStyle}>{dpLosses}</td>
                    <td style={tdStyle}>{winPct}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

/* ---------------- styles ---------------- */

const pillStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  background: "#fff",
  borderRadius: 999,
  padding: "6px 10px",
  fontSize: 12,
  opacity: 0.9,
  whiteSpace: "nowrap",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  border: "2px solid #d1d5db",
  borderRadius: 12,
  overflow: "hidden",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: 12,
  fontSize: 12,
  letterSpacing: 0.2,
  opacity: 0.9,
  background: "#f8fafc",
  position: "sticky",
  top: 0,
  zIndex: 1,
  border: "1px solid #d1d5db",
};

const tdStyle: React.CSSProperties = {
  padding: 12,
  fontSize: 14,
  border: "1px solid #e5e7eb",
};

function rowBg(index: number): string {
  return index % 2 === 0 ? "white" : "#fcfcfd";
}

function topRowBg(rank: number): string {
  if (rank === 1) return "#fff7ed";
  if (rank === 2) return "#f8fafc";
  if (rank === 3) return "#fdf2f8";
  return "white";
}

function rankBadgeStyle(rank: number): React.CSSProperties {
  const map: Record<number, { bg: string; fg: string; bd: string }> = {
    1: { bg: "#ffedd5", fg: "#9a3412", bd: "#fed7aa" },
    2: { bg: "#f1f5f9", fg: "#0f172a", bd: "#e2e8f0" },
    3: { bg: "#fce7f3", fg: "#9d174d", bd: "#fbcfe8" },
  };

  const c = map[rank] ?? { bg: "#f3f4f6", fg: "#111827", bd: "#e5e7eb" };

  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 34,
    height: 26,
    padding: "0 10px",
    borderRadius: 999,
    background: c.bg,
    color: c.fg,
    border: `1px solid ${c.bd}`,
    fontWeight: 900,
    fontSize: 12,
  };
}
