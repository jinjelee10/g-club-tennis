"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

type PlayerLite = { id: string; name: string };

type MatchInfo = {
  id: string;
  match_time: string | null; // "HH:MM:SS"
  status: string;
  score: string | null;
  winner_team: 1 | 2 | null;

  team1_player1_id: string;
  team1_player2_id: string;
  team2_player1_id: string;
  team2_player2_id: string;
};

// PMH row for a player on a match/day
type PMHRow = {
  match_id: string;
  player_id: string;
  match_date: string; // YYYY-MM-DD

  // These often exist on PMH, but we will prefer matches.match_time if present
  match_time: string | null; // "HH:MM:SS"
  status: string;

  // manual flags (smallint 0/1)
  double_point_flag: 0 | 1 | null;
  no_fault_miss_flag: 0 | 1 | null;
  no_return_miss_flag: 0 | 1 | null;

  team_no?: 1 | 2 | null;
  is_winner?: boolean | null;

  match_total_points?: number | null;

  // nested match
  matches?: MatchInfo | null;
};

// Local date helper (avoids UTC off-by-one)
function getLocalISODate() {
  const d = new Date();
  const tzOffsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 10);
}

function formatTime(t: string | null | undefined) {
  if (!t) return "";
  return t.slice(0, 5); // "08:30:00" -> "08:30"
}

function addDays(isoDate: string, days: number) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const tzOffsetMs = dt.getTimezoneOffset() * 60000;
  return new Date(dt.getTime() - tzOffsetMs).toISOString().slice(0, 10);
}

function yesNoButtonStyles(active: boolean, color: string) {
  return {
    padding: "8px 10px",
    borderRadius: 8,
    border: `1px solid ${color}`,
    background: active ? color : "#fff",
    color: active ? "#fff" : color,
    fontWeight: 800 as const,
    cursor: "pointer",
    minWidth: 64,
  };
}

export default function MatchPointsPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);

  const [date, setDate] = useState(() => getLocalISODate());

  // ✅ Enhancement #1: Players list comes from PMH for the day
  const [players, setPlayers] = useState<PlayerLite[]>([]);
  const [playerMap, setPlayerMap] = useState<Record<string, string>>({});
  const [loadingPlayers, setLoadingPlayers] = useState(true);

  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  // PMH rows for selected player on the selected date
  const [games, setGames] = useState<PMHRow[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);

  // ✅ Fortnight UI lock for double point
  const [doublePointLocked, setDoublePointLocked] = useState<boolean>(false);
  const [doublePointLockReason, setDoublePointLockReason] = useState<string | null>(null);

  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ✅ Enhancement #4: Total points for selected player on the day
  const dayTotalPoints = games.reduce((sum, g) => sum + (g.match_total_points ?? 0), 0);

  // --- Load players WHO PLAYED THIS DATE (from PMH) ---
  useEffect(() => {
    let cancelled = false;

    async function loadPlayersForDay() {
      setLoadingPlayers(true);
      setErrorMsg(null);
      setStatusMsg(null);

      // Pull all PMH rows for this date with nested player info
      // We will de-dupe client-side.
      const { data, error } = await supabase
        .from("player_match_history")
        .select(
          `
          player_id,
          players:players ( id, name )
        `
        )
        .eq("match_date", date);

      if (cancelled) return;

      if (error) {
        setPlayers([]);
        setPlayerMap({});
        setErrorMsg(error.message);
        setLoadingPlayers(false);
        return;
      }

      // De-dupe to unique players
      const uniq = new Map<string, PlayerLite>();

      (data ?? []).forEach((row: any) => {
        const pid = row.player_id as string;
        const p = row.players as { id: string; name: string } | null;

        // In case relationship returns null due to RLS or missing FK
        if (pid && p?.name) {
          uniq.set(pid, { id: pid, name: p.name });
        }
      });

      const list = Array.from(uniq.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      const map: Record<string, string> = {};
      list.forEach((p) => (map[p.id] = p.name));

      setPlayers(list);
      setPlayerMap(map);

      // If selected player is not in this day's list, clear selection
      if (selectedPlayerId && !map[selectedPlayerId]) {
        setSelectedPlayerId(null);
        setGames([]);
      }

      setLoadingPlayers(false);
    }

    loadPlayersForDay();
    return () => {
      cancelled = true;
    };
  }, [supabase, date, selectedPlayerId]);

  const nameOf = (id: string) => playerMap[id] ?? "Unknown";

  // --- Load games (PMH rows) when player or date changes ---
  useEffect(() => {
    let cancelled = false;

    async function loadGamesForPlayer() {
      setStatusMsg(null);
      setErrorMsg(null);

      if (!selectedPlayerId) {
        setGames([]);
        setDoublePointLocked(false);
        setDoublePointLockReason(null);
        return;
      }

      setLoadingGames(true);

      // ✅ Enhancement #2: join match details for opponent/team display
      const { data: pmhData, error: pmhError } = await supabase
        .from("player_match_history")
        .select(
          `
          match_id,
          player_id,
          match_date,
          match_time,
          status,
          double_point_flag,
          no_fault_miss_flag,
          no_return_miss_flag,
          team_no,
          is_winner,
          match_total_points,
          matches:matches (
            id,
            match_time,
            status,
            score,
            winner_team,
            team1_player1_id,
            team1_player2_id,
            team2_player1_id,
            team2_player2_id
          )
        `
        )
        .eq("player_id", selectedPlayerId)
        .eq("match_date", date)
        .order("match_time", { ascending: true })
        .order("match_id", { ascending: true })
        .limit(4);

      if (cancelled) return;

      if (pmhError) {
        setGames([]);
        setErrorMsg(pmhError.message);
        setLoadingGames(false);
        return;
      }

      const rows = (pmhData ?? []) as unknown as PMHRow[];
      setGames(rows);

      // Determine if double point is already used within ±13 days window
      const startDate = addDays(date, -13);
      const endDate = addDays(date, 13);

      const { data: dpData, error: dpError } = await supabase
        .from("player_match_history")
        .select("match_id, match_date, double_point_flag")
        .eq("player_id", selectedPlayerId)
        .eq("double_point_flag", 1)
        .gte("match_date", startDate)
        .lte("match_date", endDate)
        .limit(5);

      if (cancelled) return;

      if (dpError) {
        // Fall back to DB enforcement only
        setDoublePointLocked(false);
        setDoublePointLockReason(null);
      } else {
        const usedSomewhere = (dpData ?? []).length > 0;
        const alreadyOnToday = rows.some((r) => (r.double_point_flag ?? 0) === 1);

        if (usedSomewhere && !alreadyOnToday) {
          setDoublePointLocked(true);
          setDoublePointLockReason("Double Point already used within the last/next 14 days.");
        } else {
          setDoublePointLocked(false);
          setDoublePointLockReason(null);
        }
      }

      setLoadingGames(false);
    }

    loadGamesForPlayer();
    return () => {
      cancelled = true;
    };
  }, [supabase, selectedPlayerId, date]);

  async function refreshSelected() {
    if (!selectedPlayerId) return;

    setLoadingGames(true);

    const { data: pmhData, error: pmhError } = await supabase
      .from("player_match_history")
      .select(
        `
        match_id,
        player_id,
        match_date,
        match_time,
        status,
        double_point_flag,
        no_fault_miss_flag,
        no_return_miss_flag,
        team_no,
        is_winner,
        match_total_points,
        matches:matches (
          id,
          match_time,
          status,
          score,
          winner_team,
          team1_player1_id,
          team1_player2_id,
          team2_player1_id,
          team2_player2_id
        )
      `
      )
      .eq("player_id", selectedPlayerId)
      .eq("match_date", date)
      .order("match_time", { ascending: true })
      .order("match_id", { ascending: true })
      .limit(4);

    if (pmhError) {
      setGames([]);
      setErrorMsg(pmhError.message);
      setLoadingGames(false);
      return;
    }

    const rows = (pmhData ?? []) as unknown as PMHRow[];
    setGames(rows);

    // Re-check lock
    const startDate = addDays(date, -13);
    const endDate = addDays(date, 13);

    const { data: dpData } = await supabase
      .from("player_match_history")
      .select("match_id, match_date, double_point_flag")
      .eq("player_id", selectedPlayerId)
      .eq("double_point_flag", 1)
      .gte("match_date", startDate)
      .lte("match_date", endDate)
      .limit(5);

    const usedSomewhere = (dpData ?? []).length > 0;
    const alreadyOnToday = rows.some((r) => (r.double_point_flag ?? 0) === 1);

    if (usedSomewhere && !alreadyOnToday) {
      setDoublePointLocked(true);
      setDoublePointLockReason("Double Point already used within the last/next 14 days.");
    } else {
      setDoublePointLocked(false);
      setDoublePointLockReason(null);
    }

    setLoadingGames(false);
  }

  // For same-day: only allow ONE game to have double point ON
  const doublePointOnThisDayMatchId =
    games.find((g) => (g.double_point_flag ?? 0) === 1)?.match_id ?? null;

  function canToggleDoublePoint(game: PMHRow) {
    const isOn = (game.double_point_flag ?? 0) === 1;

    // Allow turning OFF always
    if (isOn) return true;

    // Block if fortnight locked
    if (doublePointLocked) return false;

    // Block if another game today already has it ON
    if (doublePointOnThisDayMatchId && doublePointOnThisDayMatchId !== game.match_id)
      return false;

    return true;
  }

  // --- Update a flag on a specific PMH row ---
  async function setFlag(
    matchId: string,
    field: "no_fault_miss_flag" | "no_return_miss_flag" | "double_point_flag",
    value01: 0 | 1
  ) {
    if (!selectedPlayerId) return;

    setStatusMsg(null);
    setErrorMsg(null);

    // Optimistic UI
    setGames((prev) =>
      prev.map((g) => (g.match_id === matchId ? { ...g, [field]: value01 } : g))
    );

    const { error } = await supabase
      .from("player_match_history")
      .update({ [field]: value01 })
      .eq("match_id", matchId)
      .eq("player_id", selectedPlayerId);

    if (error) {
      setErrorMsg(error.message);
      await refreshSelected();
      return;
    }

    await refreshSelected();
    setStatusMsg("Saved ✅");
  }

  // --- Build team display helpers (Enhancement #2) ---
  function renderTeams(game: PMHRow) {
    const m = game.matches;
    if (!m) return <div style={{ color: "#666" }}>Match details unavailable.</div>;

    const t1 = [m.team1_player1_id, m.team1_player2_id].map(nameOf).join(" & ");
    const t2 = [m.team2_player1_id, m.team2_player2_id].map(nameOf).join(" & ");

    const time = formatTime(m.match_time ?? game.match_time);
    const status = m.status ?? game.status;

    // Determine player's team line highlighting
    const playerTeamNo = game.team_no ?? null;

    const lineStyle = (teamNo: 1 | 2) => ({
      padding: "6px 8px",
      borderRadius: 8,
      background:
        playerTeamNo === teamNo ? "#f1e6ff" : "transparent",
      border: playerTeamNo === teamNo ? "1px solid #d9c6ff" : "1px solid transparent",
    });

    const resultText =
      status === "completed" && m.winner_team
        ? game.is_winner
          ? "Win ✅"
          : "Loss"
        : "";

    return (
      <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
          <div style={{ color: "#444", fontWeight: 800 }}>
            {time ? `Time: ${time}` : "Time: —"}{" "}
            <span style={{ marginLeft: 10, color: "#666", fontWeight: 700 }}>
              ({status})
            </span>
          </div>
          {resultText && (
            <div style={{ fontWeight: 900, color: game.is_winner ? "#0a7" : "#b91c1c" }}>
              {resultText}
            </div>
          )}
        </div>

        <div style={lineStyle(1)}>
          <strong>Team 1:</strong> {t1}
        </div>
        <div style={lineStyle(2)}>
          <strong>Team 2:</strong> {t2}
        </div>

        {status === "completed" && m.score && (
          <div style={{ marginTop: 2, color: "#333" }}>
            <strong>Score:</strong> {m.score}
          </div>
        )}
      </div>
    );
  }

  return (
    <main style={{ maxWidth: 1100, margin: "30px auto", padding: 16 }}>
      <h1>Match Points (Per Player)</h1>

      <div
        style={{
          display: "flex",
          gap: 14,
          alignItems: "end",
          flexWrap: "wrap",
          margin: "14px 0 18px",
        }}
      >
        <label style={{ display: "grid", gap: 6 }}>
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ padding: 8 }}
          />
        </label>

        {statusMsg && <span style={{ color: "green", fontWeight: 800 }}>{statusMsg}</span>}
        {errorMsg && <span style={{ color: "crimson", fontWeight: 800 }}>{errorMsg}</span>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16 }}>
        {/* Left: Players who played that day (Enhancement #1) */}
        <section style={{ border: "1px solid #ddd", borderRadius: 12, background: "#fff" }}>
          <div style={{ padding: 12, borderBottom: "1px solid #eee", fontWeight: 900 }}>
            Players who played on {date}
          </div>

          {loadingPlayers && <div style={{ padding: 12 }}>Loading players…</div>}

          {!loadingPlayers && players.length === 0 && (
            <div style={{ padding: 12, color: "#666" }}>
              No player match history found for this date.
            </div>
          )}

          {!loadingPlayers && players.length > 0 && (
            <div style={{ maxHeight: 560, overflow: "auto" }}>
              {players.map((p) => {
                const active = p.id === selectedPlayerId;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlayerId(p.id)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 12px",
                      border: "none",
                      borderBottom: "1px solid #f1f1f1",
                      background: active ? "#f1e6ff" : "#fff",
                      cursor: "pointer",
                      fontWeight: active ? 900 : 650,
                    }}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Right: Player details + games */}
        <section style={{ border: "1px solid #ddd", borderRadius: 12, background: "#fff" }}>
          <div style={{ padding: 12, borderBottom: "1px solid #eee" }}>
            <div style={{ fontWeight: 900 }}>Selected Player</div>
            <div style={{ color: "#555", marginTop: 4 }}>
              {selectedPlayerId ? nameOf(selectedPlayerId) : "Select a player"}
            </div>

            {/* ✅ Enhancement #4: Day total points */}
            {selectedPlayerId && (
              <div style={{ marginTop: 10, fontWeight: 900, color: "#0a7" }}>
                Total points for {date}: {dayTotalPoints}
              </div>
            )}

            {doublePointLocked && (
              <div style={{ marginTop: 8, color: "#b45309", fontWeight: 800 }}>
                ⚠ {doublePointLockReason}
              </div>
            )}

            {doublePointOnThisDayMatchId && (
              <div style={{ marginTop: 6, color: "#6a0dad", fontWeight: 800 }}>
                Double Point is ON for one game today (only one allowed).
              </div>
            )}
          </div>

          {!selectedPlayerId && (
            <div style={{ padding: 12 }}>
              Select a player to manage flags for {date}.
            </div>
          )}

          {selectedPlayerId && (
            <div style={{ padding: 12 }}>
              {loadingGames && <div>Loading games…</div>}

              {!loadingGames && (
                <div style={{ display: "grid", gap: 12 }}>
                  {/* Show up to 4 games (Game 1-4) */}
                  {[0, 1, 2, 3].map((i) => {
                    const game = games[i];

                    if (!game) {
                      return (
                        <div
                          key={i}
                          style={{
                            border: "1px dashed #ddd",
                            borderRadius: 12,
                            padding: 12,
                            background: "#fafafa",
                          }}
                        >
                          <div style={{ fontWeight: 900 }}>Game {i + 1}</div>
                          <div style={{ color: "#666", marginTop: 6 }}>
                            No match found for this player on {date}.
                          </div>
                        </div>
                      );
                    }

                    const noFaultOn = (game.no_fault_miss_flag ?? 0) === 1;
                    const noReturnOn = (game.no_return_miss_flag ?? 0) === 1;
                    const doubleOn = (game.double_point_flag ?? 0) === 1;
                    const canDP = canToggleDoublePoint(game);

                    return (
                      <div
                        key={game.match_id}
                        style={{
                          border: "1px solid #eee",
                          borderRadius: 12,
                          padding: 12,
                          background: "#fff",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 10,
                            alignItems: "center",
                          }}
                        >
                          <div style={{ fontWeight: 900 }}>Game {i + 1}</div>

                          {typeof game.match_total_points === "number" && (
                            <div style={{ fontWeight: 900, color: "#0a7" }}>
                              Points: {game.match_total_points}
                            </div>
                          )}
                        </div>

                        {/* ✅ Enhancement #2: show teams/opponents + score/result */}
                        {renderTeams(game)}

                        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                          {/* Button 1 */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 12,
                            }}
                          >
                            <div style={{ fontWeight: 700 }}>
                              No Double Fault Entire Game
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button
                                onClick={() => setFlag(game.match_id, "no_fault_miss_flag", 1)}
                                style={yesNoButtonStyles(noFaultOn, "#0a7")}
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setFlag(game.match_id, "no_fault_miss_flag", 0)}
                                style={yesNoButtonStyles(!noFaultOn, "#999")}
                              >
                                No
                              </button>
                            </div>
                          </div>

                          {/* Button 2 */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 12,
                            }}
                          >
                            <div style={{ fontWeight: 700 }}>
                              No Return Entire Game
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                              <button
                                onClick={() => setFlag(game.match_id, "no_return_miss_flag", 1)}
                                style={yesNoButtonStyles(noReturnOn, "#0a7")}
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setFlag(game.match_id, "no_return_miss_flag", 0)}
                                style={yesNoButtonStyles(!noReturnOn, "#999")}
                              >
                                No
                              </button>
                            </div>
                          </div>

                          {/* Button 3 */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 12,
                            }}
                          >
                            <div style={{ fontWeight: 700 }}>
                              Double Point Flag{" "}
                              <span style={{ color: "#666", fontWeight: 600 }}>
                                (once per fortnight)
                              </span>
                            </div>
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <button
                                onClick={() => setFlag(game.match_id, "double_point_flag", 1)}
                                disabled={!canDP}
                                style={{
                                  ...yesNoButtonStyles(doubleOn, "#6a0dad"),
                                  opacity: canDP ? 1 : 0.5,
                                  cursor: canDP ? "pointer" : "not-allowed",
                                }}
                                title={
                                  !canDP
                                    ? "Double Point unavailable (fortnight rule or already used today)."
                                    : ""
                                }
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setFlag(game.match_id, "double_point_flag", 0)}
                                style={yesNoButtonStyles(!doubleOn, "#999")}
                              >
                                No
                              </button>
                            </div>
                          </div>

                          <div style={{ fontSize: 12, color: "#666" }}>
                            Note: The database enforces the fortnight rule. If an update is rejected, you’ll see an error.
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}