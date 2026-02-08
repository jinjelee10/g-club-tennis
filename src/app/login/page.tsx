"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabaseBrowser } from "@/lib/supabase/browser";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const supabase = supabaseBrowser();
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Sign-up only
  const [displayName, setDisplayName] = useState("");
  const [isMember, setIsMember] = useState<boolean>(true);

  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    if (!email.trim() || !password.trim()) return false;
    if (mode === "signup" && !displayName.trim()) return false;
    return true;
  }, [email, password, mode, displayName]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setStatus(error.message);
      setLoading(false);
      return;
    }

    setStatus("Logged in! Redirecting...");
    setLoading(false);

    router.push("/leaderboard");
    router.refresh();
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    // Store extra fields in user metadata.
    // A DB trigger (recommended) should copy these into public.profiles on signup,
    // and then your existing profiles->players trigger can set players.name.
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          display_name: displayName.trim(),
          member: isMember,
        },
      },
    });

    if (error) {
      setStatus(error.message);
      setLoading(false);
      return;
    }

    // If email confirmations are disabled in Supabase, data.session is typically present.
    // If confirmations are enabled, you may need email verification.
    const hasSession = !!data.session;

    setStatus(
      hasSession
        ? "Account created! Redirecting..."
        : "Account created! If you are not redirected, email confirmation may be enabled."
    );
    setLoading(false);

    // Redirect (will work immediately if auto-verified / session is created)
    router.push("/leaderboard");
    router.refresh();
  }

  const onSubmit = mode === "signin" ? signIn : signUp;

  return (
    <main style={{ maxWidth: 420, margin: "40px auto", padding: "0 16px" }}>
      <h1 style={{ marginBottom: 6 }}>G Club Tennis</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setStatus(null);
          }}
          disabled={loading}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #ddd",
            background: mode === "signin" ? "#111" : "#fff",
            color: mode === "signin" ? "#fff" : "#111",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          Sign in
        </button>

        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setStatus(null);
          }}
          disabled={loading}
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #ddd",
            background: mode === "signup" ? "#111" : "#fff",
            color: mode === "signup" ? "#fff" : "#111",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          Sign up
        </button>
      </div>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 10 }}>
        <label>
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            style={{ width: "100%", padding: 10, marginTop: 6 }}
            disabled={loading}
          />
        </label>

        <label>
          Password
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            style={{ width: "100%", padding: 10, marginTop: 6 }}
            disabled={loading}
          />
        </label>

        {mode === "signup" && (
          <>
            <label>
              Display name
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                type="text"
                required
                style={{ width: "100%", padding: 10, marginTop: 6 }}
                disabled={loading}
                placeholder="e.g., Andrew"
              />
            </label>

            <div>
              <div style={{ marginBottom: 6 }}>Member type</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsMember(false)}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #ddd",
                    background: !isMember ? "#111" : "#fff",
                    color: !isMember ? "#fff" : "#111",
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  Guest
                </button>

                <button
                  type="button"
                  onClick={() => setIsMember(true)}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    borderRadius: 8,
                    border: "1px solid #ddd",
                    background: isMember ? "#111" : "#fff",
                    color: isMember ? "#fff" : "#111",
                    cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  Member
                </button>
              </div>
            </div>
          </>
        )}

        <button type="submit" disabled={loading || !canSubmit}>
          {loading
            ? mode === "signin"
              ? "Signing in..."
              : "Creating account..."
            : mode === "signin"
            ? "Sign in"
            : "Create account"}
        </button>

        {/* ✅ JPEG below the sign-in / create button */}
        <div style={{ marginTop: 14 }}>
          <Image
            src="/login-photo.jpg"
            alt="G Club Tennis"
            width={900}
            height={600}
            priority
            style={{
              width: "100%",
              height: "auto",
              borderRadius: 12,
              border: "1px solid #e5e7eb",
            }}
          />
        </div>

        {status && <p style={{ marginTop: 6 }}>{status}</p>}
      </form>
    </main>
  );
}