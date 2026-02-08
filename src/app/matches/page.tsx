"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser"; // keep your project spelling

type Player = {
  id: string;
  name: string;
};

type MatchRow = {
  id: string;
  match_date: string; // YYYY-MM-DD
  match_time: string; // HH:MM:SS
  status: string;
  score: string | null;
  winner_team: number | null;

  team1_player1?: { name: string } | null;
  team1_player2?: { name: string } | null;
  team2_player1?: { name: string } | null;
  team2_player2?: { name: string } | null;

  team1_player1_id: string | null;
  team1_player2_id: string | null;
  team2_player1_id: string | null;
  team2_player2_id: string | null;
};

export default function MatchHistoryPage() {
  // ✅ Works whether supabaseBrowser is a factory OR already a client instance
  const supabase = useMemo(() => {
    return typeof supabaseBrowser === "function"
      ? (supabaseBrowser as any)()
      : (supabaseBrowser as any);
  }, []);

  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);

  // Filters
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(""); // YYYY-MM-DD

  const [playerDropdownOpen, setPlayerDropdownOpen] = useState(false);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);

  // Load players for dropdown
  useEffect(() => {
    const loadPlayers = async () => {
      const { data, error } = await supabase
        .from("players")
        .select("id, name")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) {
        console.error("Players load error:", error);
        setPlayers([]);
        return;
      }

      setPlayers((data ?? []) as Player[]);
    };

    loadPlayers();
  }, [supabase]);

  // Load matches (default = all, ordered by date then time)
  useEffect(() => {
    const loadMatches = async () => {
      setLoading(true);

      let q = supabase
        .from("matches")
        .select(
          `
          id,
          match_date,
          match_time,
          status,
          score,
          winner_team,
          team1_player1_id,
          team1_player2_id,
          team2_player1_id,
          team2_player2_id,

          team1_player1:players!matches_team1_player1_id_fkey(name),
          team1_player2:players!matches_team1_player2_id_fkey(name),
          team2_player1:players!matches_team2_player1_id_fkey(name),
          team2_player2:players!matches_team2_player2_id_fkey(name)
        `
        )
        .neq("status", "cancelled")
        // ✅ calendar date then time
        .order("match_date", { ascending: false })
        .order("match_time", { ascending: true });

      // ✅ Date filter (optional)
      if (selectedDate) {
        q = q.eq("match_date", selectedDate);
      }

      // ✅ Multi-player filter (optional): match includes ANY selected player
      if (selectedPlayerIds.length > 0) {
        // PostgREST: in.(uuid1,uuid2,uuid3)
        const inList = `(${selectedPlayerIds.join(",")})`;

        q = q.or(
          [
            `team1_player1_id.in.${inList}`,
            `team1_player2_id.in.${inList}`,
            `team2_player1_id.in.${inList}`,
            `team2_player2_id.in.${inList}`,
          ].join(",")
        );
      }

      const { data, error } = await q;

      if (error) {
        console.error("Match history load error:", error);
        setMatches([]);
      } else {
        setMatches((data ?? []) as MatchRow[]);
      }

      setLoading(false);
    };

    loadMatches();
  }, [supabase, selectedDate, selectedPlayerIds]);

  const togglePlayer = (id: string) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div style={{ padding: 16, maxWidth: 1100, margin: "0 auto" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
        Match History
      </h1>

      {/* Controls */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        {/* Date filter */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setDatePickerOpen((v) => !v)}
            style={btnStyle}
          >
            📅 Pick date
          </button>

          {datePickerOpen && (
            <div style={dropdownStyle}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={inputStyle}
                />
                <button onClick={() => setSelectedDate("")} style={smallBtnStyle}>
                  Clear
                </button>
              </div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }}>
                {selectedDate ? `Showing matches on ${selectedDate}` : "Showing all dates"}
              </div>
            </div>
          )}
        </div>

        {/* Player multi-select */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setPlayerDropdownOpen((v) => !v)}
            style={btnStyle}
          >
            👤 Players {selectedPlayerIds.length ? `(${selectedPlayerIds.length})` : ""}
          </button>

          {playerDropdownOpen && (
            <div style={{ ...dropdownStyle, width: 320, maxHeight: 360, overflow: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <strong>Select players</strong>
                <button onClick={() => setSelectedPlayerIds([])} style={smallBtnStyle}>
                  Clear
                </button>
              </div>

              {players.length === 0 ? (
                <div style={{ fontSize: 13, opacity: 0.8 }}>No players found.</div>
              ) : (
                players.map((p) => (
                  <label
                    key={p.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 4px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPlayerIds.includes(p.id)}
                      onChange={() => togglePlayer(p.id)}
                    />
                    <span>{p.name}</span>
                  </label>
                ))
              )}

              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 8 }}>
                Shows matches containing any selected player (union).
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div>Loading…</div>
      ) : matches.length === 0 ? (
        <div style={{ opacity: 0.8 }}>No matches found for the selected filters.</div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Time</th>
                <th style={thStyle}>Team 1</th>
                <th style={thStyle}>Score</th>
                <th style={thStyle}>Team 2</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m) => (
                <tr key={m.id} style={{ borderTop: "1px solid #eee" }}>
                  <td style={tdStyle}>{m.match_date}</td>
                  <td style={tdStyle}>{formatTime(m.match_time)}</td>
                  <td style={tdStyle}>
                    {m.team1_player1?.name ?? "—"} / {m.team1_player2?.name ?? "—"}
                  </td>
                  <td style={tdStyle}>{m.score ?? "—"}</td>
                  <td style={tdStyle}>
                    {m.team2_player1?.name ?? "—"} / {m.team2_player2?.name ?? "—"}
                  </td>
                  <td style={tdStyle}>
                    <span style={badgeStyle(m.status)}>{m.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatTime(t: string) {
  if (!t) return "";
  return t.slice(0, 5); // "09:00:00" -> "09:00"
}

// Inline styles (matches your existing simple styling approach)
const btnStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 8,
  border: "1px solid #ddd",
  background: "white",
  cursor: "pointer",
};

const smallBtnStyle: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 8,
  border: "1px solid #ddd",
  background: "white",
  cursor: "pointer",
  fontSize: 12,
};

const dropdownStyle: React.CSSProperties = {
  position: "absolute",
  top: 42,
  left: 0,
  zIndex: 50,
  padding: 12,
  border: "1px solid #ddd",
  borderRadius: 10,
  background: "white",
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
};

const inputStyle: React.CSSProperties = {
  padding: 8,
  borderRadius: 8,
  border: "1px solid #ddd",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: 10,
  fontSize: 13,
  opacity: 0.7,
  borderBottom: "1px solid #eee",
};

const tdStyle: React.CSSProperties = {
  padding: 10,
  fontSize: 14,
};

function badgeStyle(status: string): React.CSSProperties {
  const map: Record<string, { bg: string; fg: string; bd: string }> = {
    scheduled: { bg: "#eef2ff", fg: "#3730a3", bd: "#c7d2fe" },
    completed: { bg: "#ecfdf5", fg: "#065f46", bd: "#a7f3d0" },
    cancelled: { bg: "#fef2f2", fg: "#991b1b", bd: "#fecaca" },
  };
  const c = map[status] ?? { bg: "#f3f4f6", fg: "#111827", bd: "#e5e7eb" };
  return {
    display: "inline-block",
    padding: "3px 10px",
    borderRadius: 999,
    background: c.bg,
    color: c.fg,
    border: `1px solid ${c.bd}`,
    fontSize: 12,
    textTransform: "capitalize",
  };
}