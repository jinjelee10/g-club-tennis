"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

type MatchRow = {
  id: string;
  match_date: string; // "YYYY-MM-DD"
  match_time: string | null; // "HH:MM:SS"
  status: "scheduled" | "completed" | "cancelled" | string;

  team1_player1_id: string;
  team1_player2_id: string;
  team2_player1_id: string;
  team2_player2_id: string;

  score: string | null;
  winner_team: 1 | 2 | null;
  mission_comeback_flag: 0 | 1 | null;
};

type Player = { id: string; name: string };

// Fixed slots (and their “Game” labels + header colors)
const TIME_SLOTS = ["08:30", "09:00", "09:30", "10:00"] as const;

const SLOT_META: Record<
  (typeof TIME_SLOTS)[number],
  { gameLabel: string; headerBg: string; headerText: string }
> = {
  "08:30": { gameLabel: "Game 1", headerBg: "#cfeecf", headerText: "#114b11" },
  "09:00": { gameLabel: "Game 2", headerBg: "#fff3b0", headerText: "#5c4b00" },
  "09:30": { gameLabel: "Game 3", headerBg: "#ffd6b3", headerText: "#6b2e00" },
  "10:00": { gameLabel: "Game 4", headerBg: "#cfe0ff", headerText: "#0c2a66" },
};

// Local date helper (avoids UTC off-by-one issues)
function getLocalISODate() {
  const d = new Date();
  const tzOffsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 10);
}

// "08:30:00" -> "08:30"
function formatTime(t: string | null | undefined) {
  if (!t) return "";
  return t.slice(0, 5);
}

// Determine winner from score string assuming format is Team1-Team2 per set.
// Supports: "8-6", "7-6 6-4", "7-6,6-4", "7-6 / 6-4"
function winnerFromScore(scoreRaw: string): 1 | 2 | null {
  if (!scoreRaw) return null;

  // Normalize separators and dashes
  const normalized = scoreRaw
    .trim()
    .replace(/[–—]/g, "-")     // en/em dashes -> hyphen
    .replace(/[,/]/g, " ")     // commas or slashes -> spaces
    .replace(/\s+/g, " ");     // collapse whitespace

  const parts = normalized.split(" ").filter(Boolean);

  let team1SetWins = 0;
  let team2SetWins = 0;

  // Extract only tokens that look like "number-number"
  const setTokens = parts.filter((t) => /^\d+\s*-\s*\d+$/.test(t));

  if (setTokens.length === 0) return null;

  for (const token of setTokens) {
    const [aStr, bStr] = token.split("-").map((s) => s.trim());
    const a = Number(aStr);
    const b = Number(bStr);

    if (!Number.isFinite(a) || !Number.isFinite(b)) return null;

    // If a set is tied (e.g. 6-6), we can't infer winner from that set alone.
    if (a === b) return null;

    if (a > b) team1SetWins += 1;
    else team2SetWins += 1;
  }

  // Decide winner by set wins. (Works for 1 set or best-of-3 formats.)
  if (team1SetWins > team2SetWins) return 1;
  if (team2SetWins > team1SetWins) return 2;

  // Equal set wins (e.g. "6-4 4-6") -> ambiguous
  return null;
}

export default function MatchesTodayPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [date, setDate] = useState(() => getLocalISODate());

  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [playerMap, setPlayerMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // --- Update score UI state ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editScore, setEditScore] = useState("");
  const [editWinnerTeam, setEditWinnerTeam] = useState<1 | 2>(1);
  const [editComeback, setEditComeback] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setStatusMsg(null);

      const { data: matchData, error: matchError } = await supabase
        .from("matches")
        .select(
          `
            id,
            match_date,
            match_time,
            status,
            team1_player1_id,
            team1_player2_id,
            team2_player1_id,
            team2_player2_id,
            score,
            winner_team,
            mission_comeback_flag
          `
        )
        .eq("match_date", date)
        .order("match_time", { ascending: true })
        .order("id", { ascending: true });

      if (cancelled) return;

      if (matchError) {
        setMatches([]);
        setPlayerMap({});
        setStatusMsg(matchError.message);
        setLoading(false);
        return;
      }

      const rows = (matchData ?? []) as MatchRow[];
      setMatches(rows);

      const ids = Array.from(
        new Set(
          rows
            .flatMap((m) => [
              m.team1_player1_id,
              m.team1_player2_id,
              m.team2_player1_id,
              m.team2_player2_id,
            ])
            .filter(Boolean)
        )
      );

      if (ids.length === 0) {
        setPlayerMap({});
        setLoading(false);
        return;
      }

      const { data: playerData, error: playerError } = await supabase
        .from("players")
        .select("id,name")
        .in("id", ids);

      if (cancelled) return;

      if (playerError) {
        setPlayerMap({});
        setStatusMsg(playerError.message);
        setLoading(false);
        return;
      }

      const map: Record<string, string> = {};
      (playerData ?? []).forEach((p: Player) => {
        map[p.id] = p.name;
      });

      setPlayerMap(map);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [supabase, date]);

  const nameOf = (id: string) => playerMap[id] ?? "Unknown";

  function openUpdate(m: MatchRow) {
    setEditingId(m.id);
    setEditScore(m.score ?? "");
    setEditWinnerTeam((m.winner_team ?? 1) as 1 | 2);
    setEditComeback((m.mission_comeback_flag ?? 0) === 1);
    setEditError(null);
  }

  function cancelUpdate() {
    setEditingId(null);
    setEditScore("");
    setEditWinnerTeam(1);
    setEditComeback(false);
    setEditError(null);
  }

  function validateUpdate() {
    const score = editScore.trim();
    if (!score) return "Score is required.";
    if (editWinnerTeam !== 1 && editWinnerTeam !== 2)
      return "Please select a winning team.";

    const inferredWinner = winnerFromScore(score);
    if (!inferredWinner) {
      return "Score format is invalid or does not determine a clear winner. Use Team1-Team2 format (e.g. 8-6 or 7-6 6-4).";
    }

    if (inferredWinner !== editWinnerTeam) {
      return `Score indicates Team ${inferredWinner} won. Please change the winning team or correct the score (Team 1 – Team 2).`;
    }

    return null;
  }

  async function saveUpdate(matchId: string) {
    setEditError(null);

    const v = validateUpdate();
    if (v) {
      setEditError(v);
      return;
    }

    setSavingId(matchId);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSavingId(null);
      setEditError("You must be logged in to update a match.");
      return;
    }

    const payload = {
      score: editScore.trim(),
      winner_team: editWinnerTeam,
      status: "completed",
      mission_comeback_flag: editComeback ? 1 : 0,
    };

    const { data, error } = await supabase
      .from("matches")
      .update(payload)
      .eq("id", matchId)
      .select("id,status,score,winner_team,mission_comeback_flag")
      .single();

    if (error) {
      setSavingId(null);
      setEditError(error.message);
      return;
    }

    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? {
              ...m,
              status: data.status,
              score: data.score,
              winner_team: data.winner_team,
              mission_comeback_flag: data.mission_comeback_flag,
            }
          : m
      )
    );

    setSavingId(null);
    setEditingId(null);
    setEditScore("");
    setEditWinnerTeam(1);
    setEditComeback(false);
    setEditError(null);
    setStatusMsg("Match updated ✅");
  }

  // ✅ Group matches by time slot ("08:30", "09:00", etc.)
  const matchesBySlot: Record<string, MatchRow[]> = useMemo(() => {
    const map: Record<string, MatchRow[]> = {};
    for (const t of TIME_SLOTS) map[t] = [];

    for (const m of matches) {
      const t = formatTime(m.match_time);
      if (t && map[t]) map[t].push(m);
      // if somehow not in slots, ignore (or you could collect into "Other")
    }

    // keep stable ordering inside each slot
    for (const t of TIME_SLOTS) {
      map[t].sort((a, b) => (a.id || "").localeCompare(b.id || ""));
    }

    return map;
  }, [matches]);

  return (
    <main style={{ maxWidth: 1050, margin: "30px auto", padding: 16 }}>
      <h1>Matches for the Day</h1>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "end",
          flexWrap: "wrap",
          margin: "14px 0 20px",
        }}
      >
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ padding: 8 }}
          />
        </label>

        <div style={{ fontSize: 13, color: "#666", paddingBottom: 2 }}>
          Grouped by <strong>time</strong> (Game 1–4)
        </div>
      </div>

      {statusMsg && (
        <p
          style={{
            color: statusMsg.includes("✅") ? "green" : "crimson",
            marginBottom: 12,
          }}
        >
          {statusMsg}
        </p>
      )}

      {loading && <p>Loading…</p>}

      {!loading && matches.length === 0 && <p>No matches for {date}.</p>}

      {/* ✅ Render one section per time slot */}
      {!loading && (
        <div style={{ display: "grid", gap: 16 }}>
          {TIME_SLOTS.map((slot) => {
            const list = matchesBySlot[slot] ?? [];
            const meta = SLOT_META[slot];

            return (
              <section
                key={slot}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 12,
                  overflow: "hidden",
                  background: "#fff",
                }}
              >
                {/* Header bar like your picture */}
                <div
                  style={{
                    background: meta.headerBg,
                    padding: "10px 14px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div style={{ fontWeight: 900, color: meta.headerText }}>
                    {meta.gameLabel}
                  </div>
                  <div style={{ fontWeight: 900, color: meta.headerText }}>
                    {slot}
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: 12, display: "grid", gap: 10 }}>
                  {list.length === 0 ? (
                    <div style={{ color: "#666", padding: 10 }}>
                      No matches scheduled for this time.
                    </div>
                  ) : (
                    <div style={{ display: "grid", gap: 10 }}>
                      {list.map((m) => {
                        const isEditing = editingId === m.id;
                        const isSaving = savingId === m.id;

                        const team1 =
                          `${nameOf(m.team1_player1_id)} & ${nameOf(
                            m.team1_player2_id
                          )}`;
                        const team2 =
                          `${nameOf(m.team2_player1_id)} & ${nameOf(
                            m.team2_player2_id
                          )}`;

                        return (
                          <div
                            key={m.id}
                            style={{
                              border: "1px solid #eee",
                              borderRadius: 12,
                              padding: 12,
                              background: isEditing ? "#fafafa" : "#fff",
                            }}
                          >
                            {/* Match row in 3-column "table" style */}
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 140px 1fr auto",
                                gap: 10,
                                alignItems: "center",
                              }}
                            >
                              {/* Team 1 */}
                              <div style={{ fontWeight: 800 }}>
                                <div style={{ fontSize: 12, color: "#666" }}>
                                  Team 1
                                </div>
                                <div>{team1}</div>
                              </div>

                              {/* Score / status in the middle */}
                              <div
                                style={{
                                  textAlign: "center",
                                  borderLeft: "1px solid #f0f0f0",
                                  borderRight: "1px solid #f0f0f0",
                                  padding: "6px 8px",
                                }}
                              >
                                <div style={{ fontSize: 12, color: "#666" }}>
                                  Score
                                </div>

                                {m.status === "completed" && m.score ? (
                                  <div style={{ fontWeight: 900 }}>
                                    {m.score}
                                  </div>
                                ) : (
                                  <div style={{ fontWeight: 900, color: "#999" }}>
                                    —
                                  </div>
                                )}

                                {m.mission_comeback_flag === 1 && (
                                  <div
                                    style={{
                                      marginTop: 4,
                                      fontSize: 12,
                                      color: "#6a0dad",
                                      fontWeight: 900,
                                    }}
                                  >
                                    Comeback ✅
                                  </div>
                                )}
                              </div>

                              {/* Team 2 */}
                              <div style={{ fontWeight: 800, textAlign: "right" }}>
                                <div style={{ fontSize: 12, color: "#666" }}>
                                  Team 2
                                </div>
                                <div>{team2}</div>
                              </div>

                              {/* Actions */}
                              {!isEditing && (
                                <button
                                  onClick={() => openUpdate(m)}
                                  style={{
                                    padding: "8px 10px",
                                    borderRadius: 10,
                                    border: "1px solid #333",
                                    background: "#f5f5f5",
                                    cursor: "pointer",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {m.status === "completed" ? "Edit score" : "Update score"}
                                </button>
                              )}
                            </div>

                            <div style={{ marginTop: 8, fontSize: 13, color: "#666" }}>
                              Status:{" "}
                              {String(m.status).charAt(0).toUpperCase() +
                                String(m.status).slice(1)}
                            </div>

                            {/* Inline update form (unchanged, just nested here) */}
                            {isEditing && (
                              <div
                                style={{
                                  marginTop: 12,
                                  padding: 12,
                                  borderRadius: 12,
                                  border: "1px solid #eee",
                                  background: "#fff",
                                  display: "grid",
                                  gap: 10,
                                }}
                              >
                                <div style={{ fontWeight: 800 }}>Complete match</div>

                                <label style={{ display: "grid", gap: 6 }}>
                                  Winning Team
                                  <select
                                    value={editWinnerTeam}
                                    onChange={(e) =>
                                      setEditWinnerTeam(Number(e.target.value) as 1 | 2)
                                    }
                                    style={{ padding: 8 }}
                                    disabled={isSaving}
                                  >
                                    <option value={1}>Team 1</option>
                                    <option value={2}>Team 2</option>
                                  </select>
                                </label>

                                <label style={{ display: "grid", gap: 6 }}>
                                  Score <span style={{ color: "crimson" }}>*</span>
                                  <input
                                    value={editScore}
                                    onChange={(e) => setEditScore(e.target.value)}
                                    placeholder="e.g. 7-6 6-4"
                                    style={{ padding: 8 }}
                                    disabled={isSaving}
                                  />
                                </label>

                                {/* Comeback toggle */}
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <button
                                    type="button"
                                    onClick={() => setEditComeback((v) => !v)}
                                    disabled={isSaving}
                                    style={{
                                      padding: "8px 10px",
                                      borderRadius: 10,
                                      border: "1px solid #6a0dad",
                                      background: editComeback ? "#f1e6ff" : "#fff",
                                      cursor: isSaving ? "not-allowed" : "pointer",
                                      fontWeight: 800,
                                      color: "#6a0dad",
                                    }}
                                  >
                                    {editComeback ? "Comeback Mission: ON" : "Comeback Mission"}
                                  </button>
                                  <span style={{ fontSize: 12, color: "#666" }}>
                                    Sets <code>mission_comeback_flag</code> to{" "}
                                    {editComeback ? "1" : "0"}
                                  </span>
                                </div>

                                {editError && (
                                  <p style={{ color: "crimson", margin: 0 }}>{editError}</p>
                                )}

                                <div style={{ display: "flex", gap: 10 }}>
                                  <button
                                    onClick={() => saveUpdate(m.id)}
                                    disabled={isSaving}
                                    style={{
                                      padding: "8px 12px",
                                      borderRadius: 10,
                                      border: "1px solid #0a7",
                                      background: isSaving ? "#cfeee6" : "#e7fff7",
                                      cursor: isSaving ? "not-allowed" : "pointer",
                                      fontWeight: 800,
                                    }}
                                  >
                                    {isSaving ? "Saving..." : "Save"}
                                  </button>

                                  <button
                                    onClick={cancelUpdate}
                                    disabled={isSaving}
                                    style={{
                                      padding: "8px 12px",
                                      borderRadius: 10,
                                      border: "1px solid #999",
                                      background: "#fff",
                                      cursor: isSaving ? "not-allowed" : "pointer",
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
