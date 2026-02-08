export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

// Reuse the same components from /leaderboard
import LegendToggle from "../LegendToggle";
import LeaderboardViewControls from "../LeaderboardViewControls";

type SearchParams = {
  view?: "all" | "daily" | "monthly";
  date?: string;  // YYYY-MM-DD
  month?: string; // YYYY-MM
};

type BonusPointsRow = {
  player_id: string;
  player_name: string;

  comeback_mission_count: number;
  tiebreak_wins_count: number;
  no_double_fault_games_count: number;
  no_return_miss_games_count: number;
  win_8_0_count: number;
  win_7_1_count: number;
  win_6_2_count: number;

  total_mission_points: number;
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

export default async function LeaderboardPointsPage({
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

  const baseTitle = "G Club Bonus Points";
  const headerTitle =
    view === "daily"
      ? `${baseTitle} — ${formatFriendlyDate(date)}`
      : view === "monthly"
      ? `${baseTitle} — ${formatFriendlyMonth(month)}`
      : baseTitle;

  const { data, error } = await supabase.rpc("leaderboard_points_range", {
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

  const rows = (data ?? []) as BonusPointsRow[];

  // Always alphabetical (also ordered in SQL — this is just extra safety)
  rows.sort((a, b) => (a.player_name ?? "").localeCompare(b.player_name ?? ""));

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
            Bonus counts and mission points earned from completed matches in this period.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span style={pillStyle}>Alphabetical order</span>
          <span style={pillStyle}>Completed matches only</span>
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
                <th style={{ ...thStyle, minWidth: 200 }}>Name</th>
                <th style={thStyle}>Comeback Mission</th>
                <th style={thStyle}>Tiebreak Wins</th>
                <th style={thStyle}>No Double Fault Games</th>
                <th style={thStyle}>No Return Miss Games</th>
                <th style={thStyle}>Win 8:0</th>
                <th style={thStyle}>Win 7:1</th>
                <th style={thStyle}>Win 6:2</th>
                <th style={{ ...thStyle, fontWeight: 900 }}>Total Mission Points</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.player_id} style={{ background: rowBg(idx) }}>
                  <td style={{ ...tdStyle, fontWeight: 800 }}>{row.player_name}</td>
                  <td style={tdStyle}>{row.comeback_mission_count ?? 0}</td>
                  <td style={tdStyle}>{row.tiebreak_wins_count ?? 0}</td>
                  <td style={tdStyle}>{row.no_double_fault_games_count ?? 0}</td>
                  <td style={tdStyle}>{row.no_return_miss_games_count ?? 0}</td>
                  <td style={tdStyle}>{row.win_8_0_count ?? 0}</td>
                  <td style={tdStyle}>{row.win_7_1_count ?? 0}</td>
                  <td style={tdStyle}>{row.win_6_2_count ?? 0}</td>
                  <td style={{ ...tdStyle, fontWeight: 900 }}>
                    {row.total_mission_points ?? 0}
                  </td>
                </tr>
              ))}
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