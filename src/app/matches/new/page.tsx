"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

type Player = { id: string; name: string; is_active: boolean };

// Allowed time slots
const TIME_OPTIONS = ["08:30", "09:00", "09:30", "10:00"] as const;
type MatchTimeOption = (typeof TIME_OPTIONS)[number];

// Local date helper (avoids UTC off-by-one when using toISOString)
function getLocalISODate() {
  const d = new Date();
  const tzOffsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 10);
}

export default function NewMatchPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);

  const [t1p1, setT1p1] = useState("");
  const [t1p2, setT1p2] = useState("");
  const [t2p1, setT2p1] = useState("");
  const [t2p2, setT2p2] = useState("");

  const [matchDate, setMatchDate] = useState(() => getLocalISODate());
  const [matchTime, setMatchTime] = useState<MatchTimeOption>("08:30");

  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // ✅ NEW: players already booked at this date+time
  const [busyPlayerIds, setBusyPlayerIds] = useState<string[]>([]);
  const busySet = useMemo(() => new Set(busyPlayerIds), [busyPlayerIds]);

  // Load active players
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoadingPlayers(true);
      setStatus(null);

      const { data, error } = await supabase
        .from("players")
        .select("id,name,is_active")
        .eq("is_active", true)
        .order("name");

      if (cancelled) return;

      if (error) setStatus(error.message);
      else setPlayers(data ?? []);

      setLoadingPlayers(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  // ✅ NEW: fetch busy players whenever date/time changes
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setStatus(null);

      const timeValue = `${matchTime}:00`;

      const { data, error } = await supabase
        .from("matches")
        .select(
          `
            status,
            team1_player1_id,
            team1_player2_id,
            team2_player1_id,
            team2_player2_id
          `
        )
        .eq("match_date", matchDate)
        .eq("match_time", timeValue)
        .neq("status", "cancelled"); // cancelled should not block selection

      if (cancelled) return;

      if (error) {
        setBusyPlayerIds([]);
        setStatus(error.message);
        return;
      }

      const ids = Array.from(
        new Set(
          (data ?? [])
            .flatMap((m: any) => [
              m.team1_player1_id,
              m.team1_player2_id,
              m.team2_player1_id,
              m.team2_player2_id,
            ])
            .filter(Boolean)
        )
      );

      setBusyPlayerIds(ids);

      // Optional: if user already selected a now-busy player, they can still see it selected,
      // but submit will block with a clear message below.
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, matchDate, matchTime]);

  const selected = [t1p1, t1p2, t2p1, t2p2].filter(Boolean);
  const allChosen = selected.length === 4;

  // ✅ FIX: show duplicate warning ONLY when duplicates exist
  const hasDuplicates = selected.length !== new Set(selected).size;

  // ✅ used on submit validation (unique AND all chosen)
  const uniqueOk = !hasDuplicates && allChosen;

  // ✅ NEW: selected players that are already busy at this slot
  const selectedBusy = selected.filter((id) => busySet.has(id));

  // Disable any player that is selected in other dropdowns OR busy for the slot
  function disabledIdsFor(currentValue: string) {
    const disabled = new Set(
      [t1p1, t1p2, t2p1, t2p2].filter((id) => id && id !== currentValue)
    );

    // Add busy players (already booked at date+time)
    busyPlayerIds.forEach((id) => {
      if (id && id !== currentValue) disabled.add(id);
    });

    return disabled;
  }

  function playerOptions(currentValue: string) {
    const disabled = disabledIdsFor(currentValue);

    return (
      <>
        <option value="">Select player</option>
        {players.map((p) => (
          <option key={p.id} value={p.id} disabled={disabled.has(p.id)}>
            {p.name}
          </option>
        ))}
      </>
    );
  }

  async function submit() {
    setStatus(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setStatus("You must be logged in.");
      return;
    }

    if (!matchTime) {
      setStatus("Please select a match time.");
      return;
    }

    if (!allChosen) {
      setStatus("Please choose all 4 players.");
      return;
    }

    if (hasDuplicates) {
      setStatus("Players must be unique (no duplicates).");
      return;
    }

    // ✅ NEW: Prevent scheduling players already booked at the same date+time
    if (selectedBusy.length > 0) {
      const names = selectedBusy.map(
        (id) => players.find((p) => p.id === id)?.name ?? "Unknown"
      );
      setStatus(
        `These players are already booked at ${matchTime} on ${matchDate}: ${names.join(
          ", "
        )}`
      );
      return;
    }

    setSubmitting(true);
    setStatus("Creating match...");

    // Extra safety: re-check busy players right before insert (helps with race conditions)
    const timeValue = `${matchTime}:00`;
    const { data: existing, error: existingError } = await supabase
      .from("matches")
      .select(
        `
          status,
          team1_player1_id,
          team1_player2_id,
          team2_player1_id,
          team2_player2_id
        `
      )
      .eq("match_date", matchDate)
      .eq("match_time", timeValue)
      .neq("status", "cancelled");

    if (existingError) {
      setSubmitting(false);
      setStatus(existingError.message);
      return;
    }

    const existingIds = new Set(
      (existing ?? [])
        .flatMap((m: any) => [
          m.team1_player1_id,
          m.team1_player2_id,
          m.team2_player1_id,
          m.team2_player2_id,
        ])
        .filter(Boolean)
    );

    const conflict = [t1p1, t1p2, t2p1, t2p2].some((id) => existingIds.has(id));
    if (conflict) {
      setSubmitting(false);
      setStatus(
        `One or more selected players are already booked at ${matchTime}. Please choose different players.`
      );
      return;
    }

    const { error } = await supabase.from("matches").insert({
      match_date: matchDate,
      match_time: timeValue,

      team1_player1_id: t1p1,
      team1_player2_id: t1p2,
      team2_player1_id: t2p1,
      team2_player2_id: t2p2,

      status: "scheduled",
      winner_team: null,
      score: null,

      // Match-level flags (pre-match: all off)
      mission_comeback_flag: 0,
      tiebreak_win_flag: 0,
      win_8_0_flag: 0,
      win_7_1_flag: 0,
      win_6_2_flag: 0,

      created_by: user.id,
    });

    if (error) {
      setSubmitting(false);
      setStatus(error.message);
      return;
    }

    setStatus("Match created (scheduled) ✅");
    setSubmitting(false);

    // Reset form
    setT1p1("");
    setT1p2("");
    setT2p1("");
    setT2p2("");

    // Busy list will refresh automatically via effect (date/time unchanged),
    // but we can eagerly add them to avoid momentary flicker:
    setBusyPlayerIds((prev) =>
      Array.from(new Set([...prev, t1p1, t1p2, t2p1, t2p2]))
    );
  }

  return (
    <main style={{ maxWidth: 600, margin: "30px auto", padding: 16 }}>
      <h1>Create Doubles Match (Pre‑Match)</h1>

      <div style={{ display: "grid", gap: 10 }}>
        <label style={{ display: "grid", gap: 6 }}>
          Date
          <input
            type="date"
            value={matchDate}
            onChange={(e) => setMatchDate(e.target.value)}
            disabled={submitting}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          Match Time <span style={{ color: "crimson" }}>*</span>
          <select
            value={matchTime}
            onChange={(e) => setMatchTime(e.target.value as MatchTimeOption)}
            disabled={submitting}
            required
          >
            {TIME_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        {/* Optional: small booking context */}
        <div style={{ fontSize: 12, color: "#666" }}>
          Players already booked at <strong>{matchTime}</strong>:{" "}
          {busyPlayerIds.length === 0 ? "None" : busyPlayerIds.length}
        </div>

        <h3>Team 1</h3>
        <select
          value={t1p1}
          onChange={(e) => setT1p1(e.target.value)}
          disabled={loadingPlayers || submitting}
        >
          {playerOptions(t1p1)}
        </select>

        <select
          value={t1p2}
          onChange={(e) => setT1p2(e.target.value)}
          disabled={loadingPlayers || submitting}
        >
          {playerOptions(t1p2)}
        </select>

        <h3>Team 2</h3>
        <select
          value={t2p1}
          onChange={(e) => setT2p1(e.target.value)}
          disabled={loadingPlayers || submitting}
        >
          {playerOptions(t2p1)}
        </select>

        <select
          value={t2p2}
          onChange={(e) => setT2p2(e.target.value)}
          disabled={loadingPlayers || submitting}
        >
          {playerOptions(t2p2)}
        </select>

        {/* ✅ Fixed: only show when duplicates actually exist */}
        {hasDuplicates && (
          <p style={{ color: "crimson" }}>
            Duplicate player selected — choose 4 unique players.
          </p>
        )}

        {/* ✅ Show when any selected player is already booked at this time */}
        {selectedBusy.length > 0 && (
          <p style={{ color: "crimson" }}>
            One or more selected players are already booked at {matchTime}. Please
            choose different players.
          </p>
        )}

        <button onClick={submit} disabled={submitting || loadingPlayers}>
          {submitting ? "Creating..." : "Create match"}
        </button>

        {status && <p>{status}</p>}
      </div>
    </main>
  );
}