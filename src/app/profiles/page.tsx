"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

type Profile = {
  id: string;
  display_name: string | null;
  is_admin: boolean | null;
  member: boolean | null;
};

type PlayerRow = {
  id: string;
  profile_id: string;
  name: string | null;
  is_active: boolean;
  created_at: string;
  profiles?: Profile | null;
};

function safeTrim(v: string | null | undefined) {
  return (v ?? "").trim();
}

export default function ProfilesPage() {
  /**
   * Supports both patterns:
   * - export const supabaseBrowser = createClient(...)
   * - export const supabaseBrowser = () => createClient(...)
   */
  const supabase: any =
    typeof (supabaseBrowser as any) === "function"
      ? (supabaseBrowser as any)()
      : (supabaseBrowser as any);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  // Modal state
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [memberDraft, setMemberDraft] = useState<boolean>(false);

  // Toast
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  };

  const selectedPlayer = useMemo(
    () => players.find((p) => p.id === selectedPlayerId) ?? null,
    [players, selectedPlayerId]
  );

  // Primary: players.name, fallback: profiles.display_name
  const displayName = (p: PlayerRow) => {
    const primary = safeTrim(p.name);
    const fallback = safeTrim(p.profiles?.display_name ?? null);
    return primary || fallback || "Unknown";
  };

  // Permissions
  const canEditName = useMemo(() => {
    if (!selectedPlayer || !userId) return false;
    return isAdmin || selectedPlayer.profile_id === userId;
  }, [selectedPlayer, userId, isAdmin]);

  // Recommended: only admins can toggle membership
  const canEditMember = isAdmin;

  // Load data
  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) console.error("auth.getUser error:", userErr);

      const uid = userData?.user?.id ?? null;
      setUserId(uid);

      if (!uid) {
        setPlayers([]);
        setLoading(false);
        return;
      }

      // Admin flag
      const { data: myProfile, error: myProfileErr } = await supabase
        .from("profiles")
        .select("id, is_admin")
        .eq("id", uid)
        .maybeSingle();

      if (myProfileErr) console.error("profiles select (me) error:", myProfileErr);

      const admin = !!myProfile?.is_admin;
      setIsAdmin(admin);

      let query = supabase
        .from("players")
        .select(
          `
          id,
          profile_id,
          name,
          is_active,
          created_at,
          profiles:profile_id (
            id,
            display_name,
            is_admin,
            member
          )
        `
        )
        .order("is_active", { ascending: false })
        .order("name", { ascending: true });

      // Non-admin: only their own row
      if (!admin) query = query.eq("profile_id", uid);

      const { data: rows, error: playersErr } = await query;

      if (playersErr) {
        console.error("players select error:", playersErr);
        setPlayers([]);
      } else {
        setPlayers((rows as PlayerRow[]) ?? []);
      }

      setLoading(false);
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredPlayers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return players
      .filter((p) => (showInactive ? true : p.is_active))
      .filter((p) => {
        if (!q) return true;
        return displayName(p).toLowerCase().includes(q);
      });
  }, [players, search, showInactive]);

  const openEditor = (p: PlayerRow) => {
    setSelectedPlayerId(p.id);
    const seed = safeTrim(p.name) || safeTrim(p.profiles?.display_name ?? null);
    setNameDraft(seed);
    setMemberDraft(!!p.profiles?.member);
  };

  const closeEditor = () => {
    setSelectedPlayerId(null);
    setNameDraft("");
    setMemberDraft(false);
  };

  // Close on Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedPlayerId) closeEditor();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlayerId]);

  const hasNameChange = useMemo(() => {
    if (!selectedPlayer) return false;
    return safeTrim(nameDraft) !== safeTrim(selectedPlayer.name);
  }, [nameDraft, selectedPlayer]);

  const hasMemberChange = useMemo(() => {
    if (!selectedPlayer) return false;
    return memberDraft !== !!selectedPlayer.profiles?.member;
  }, [memberDraft, selectedPlayer]);

  const hasChanges = hasNameChange || hasMemberChange;

  const handleSave = async () => {
    if (!selectedPlayer) return;

    const newName = safeTrim(nameDraft);
    if (!newName) {
      showToast("Name can’t be empty.");
      return;
    }

    if (hasNameChange && !canEditName) {
      showToast("You can only edit your own name.");
      return;
    }

    if (hasMemberChange && !canEditMember) {
      showToast("Only admins can change membership.");
      return;
    }

    setSaving(true);

    // Update name
    if (hasNameChange) {
      const { error } = await supabase
        .from("players")
        .update({ name: newName })
        .eq("id", selectedPlayer.id);

      if (error) {
        console.error("players update error:", error);
        showToast(`Save failed: ${error.message}`);
        setSaving(false);
        return;
      }
    }

    // Update member
    if (hasMemberChange) {
      const { error } = await supabase
        .from("profiles")
        .update({ member: memberDraft })
        .eq("id", selectedPlayer.profile_id);

      if (error) {
        console.error("profiles member update error:", error);
        showToast(`Save failed: ${error.message}`);
        setSaving(false);
        return;
      }
    }

    // Local update
    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id !== selectedPlayer.id) return p;
        return {
          ...p,
          name: hasNameChange ? newName : p.name,
          profiles: p.profiles
            ? { ...p.profiles, member: hasMemberChange ? memberDraft : p.profiles.member }
            : p.profiles,
        };
      })
    );

    setSaving(false);
    closeEditor();
    showToast("Saved.");
  };

  // ---------- UI ----------
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-5 py-8">
          <h1 className="text-2xl font-semibold text-slate-900">Profiles</h1>
          <p className="mt-1 text-sm text-slate-600">Loading players…</p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="min-h-[108px] rounded-2xl border border-slate-200 bg-white shadow-sm animate-pulse"
              >
                <div className="p-5">
                  <div className="h-4 w-2/3 rounded bg-slate-200" />
                  <div className="mt-3 h-3 w-1/3 rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-5 py-8">
          <h1 className="text-2xl font-semibold text-slate-900">Profiles</h1>
          <p className="mt-3 text-sm text-slate-600">Please sign in to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-5 py-8 space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Profiles</h1>
            <p className="mt-1 text-sm text-slate-600">Click a player to edit.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative">
              <input
                className="w-full sm:w-80 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search players…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700 select-none">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
              Show inactive
            </label>
          </div>
        </header>

        {/* Grid */}
        {filteredPlayers.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            No players found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
            {filteredPlayers.map((p) => {
              const name = displayName(p);

              return (
                <button
                  key={p.id}
                  onClick={() => openEditor(p)}
                  className={[
                    "group min-h-[108px] rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm",
                    "hover:shadow-md hover:border-slate-300 transition",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500",
                    !p.is_active ? "opacity-60" : "",
                  ].join(" ")}
                >
                  <div className="flex h-full flex-col justify-between">
                    <div className="space-y-1">
                      <div className="text-base font-semibold text-slate-900 leading-snug line-clamp-2">
                        {name}
                      </div>
                      {!p.is_active && (
                        <div className="text-xs text-slate-500">Inactive</div>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        {isAdmin ? "Tap to edit" : "Tap to view/edit"}
                      </span>
                      <span className="text-xs font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        Edit →
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Modal */}
        {selectedPlayer && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) closeEditor();
            }}
          >
            <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Edit player</h2>
                    <div className="mt-2 flex items-center gap-2">
  <p className="text-sm text-slate-600">{displayName(selectedPlayer)}</p>

  <span
    className={[
      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border",
      memberDraft
        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
        : "bg-amber-50 text-amber-800 border-amber-200",
    ].join(" ")}
  >
    {memberDraft ? "Member" : "Guest"}
  </span>
</div>
                  </div>

                  <button
                    className="h-10 w-10 rounded-2xl hover:bg-slate-100 text-slate-600 flex items-center justify-center"
                    onClick={closeEditor}
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Name */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-800">Name</label>
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 shadow-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    disabled={!canEditName || saving}
                    placeholder="Enter player name"
                  />
                  {!canEditName && (
                    <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-2xl p-3">
                      You can only edit your own name.
                    </div>
                  )}
                </div>

                {/* Membership toggle (admin only) */}
                {isAdmin && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-800">Membership</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setMemberDraft(false)}
                        disabled={saving || !canEditMember}
                        className={[
                          "rounded-2xl border px-4 py-2.5 text-sm font-semibold transition shadow-sm",
                          memberDraft === false
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white hover:bg-slate-50 border-slate-200 text-slate-800",
                        ].join(" ")}
                      >
                        Guest
                      </button>

                      <button
                        type="button"
                        onClick={() => setMemberDraft(true)}
                        disabled={saving || !canEditMember}
                        className={[
                          "rounded-2xl border px-4 py-2.5 text-sm font-semibold transition shadow-sm",
                          memberDraft === true
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white hover:bg-slate-50 border-slate-200 text-slate-800",
                        ].join(" ")}
                      >
                        Member
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-100 flex items-center justify-between">
                <button
                  className="px-5 py-2.5 rounded-2xl text-sm font-medium bg-slate-100 hover:bg-slate-200 text-slate-800"
                  onClick={closeEditor}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  className={[
                    "px-5 py-2.5 rounded-2xl text-sm font-semibold transition",
                    hasChanges && !saving
                      ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                      : "bg-slate-200 text-slate-500 cursor-not-allowed",
                  ].join(" ")}
                  onClick={handleSave}
                  disabled={!hasChanges || saving}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-slate-900 text-white text-sm px-4 py-2.5 rounded-2xl shadow-lg">
              {toast}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
