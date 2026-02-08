"use client";

import { useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  defaultView: "all" | "daily" | "monthly";
  defaultDate: string;  // YYYY-MM-DD
  defaultMonth: string; // YYYY-MM
};

export default function LeaderboardViewControls({
  defaultView,
  defaultDate,
  defaultMonth,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ✅ IMPORTANT: use a string dependency that actually changes when the query changes
  const qs = searchParams.toString();

  const current = useMemo(() => {
    const view = (searchParams.get("view") as Props["defaultView"]) || defaultView;
    const date = searchParams.get("date") || defaultDate;
    const month = searchParams.get("month") || defaultMonth;
    return { view, date, month };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs, defaultView, defaultDate, defaultMonth]);

  // ✅ Refresh AFTER the navigation is applied (fixes race condition)
  useEffect(() => {
    router.refresh();
  }, [qs, router]);

  const setParams = (next: Partial<typeof current>) => {
    const params = new URLSearchParams(searchParams.toString());
    const view = next.view ?? current.view;

    if (view === "all") {
      params.delete("view");
      params.delete("date");
      params.delete("month");
    } else if (view === "daily") {
      params.set("view", "daily");
      params.set("date", next.date ?? current.date);
      params.delete("month");
    } else {
      params.set("view", "monthly");
      params.set("month", next.month ?? current.month);
      params.delete("date");
    }

    const nextQs = params.toString();
    const url = nextQs ? `${pathname}?${nextQs}` : pathname;

    // ✅ Replace is good to avoid spamming history for date/month changes
    router.replace(url);
    // ❌ Do NOT call router.refresh() here anymore — useEffect will do it reliably.
  };

  return (
    <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
      <div style={segWrapStyle}>
        <button
          type="button"
          onClick={() => setParams({ view: "all" })}
          style={{
            ...segBtnStyle,
            ...(current.view === "all" ? segBtnActiveStyle : {}),
          }}
        >
          All-time
        </button>

        <button
          type="button"
          onClick={() => setParams({ view: "daily" })}
          style={{
            ...segBtnStyle,
            ...(current.view === "daily" ? segBtnActiveStyle : {}),
          }}
        >
          Daily
        </button>

        <button
          type="button"
          onClick={() => setParams({ view: "monthly" })}
          style={{
            ...segBtnStyle,
            ...(current.view === "monthly" ? segBtnActiveStyle : {}),
          }}
        >
          Monthly
        </button>
      </div>

      {current.view === "daily" && (
        <div style={controlRowStyle}>
          <label style={labelStyle}>Select date</label>
          <input
            type="date"
            value={current.date}
            onChange={(e) => setParams({ date: e.target.value })}
            style={inputStyle}
          />
        </div>
      )}

      {current.view === "monthly" && (
        <div style={controlRowStyle}>
          <label style={labelStyle}>Select month</label>
          <input
            type="month"
            value={current.month}
            onChange={(e) => setParams({ month: e.target.value })}
            style={inputStyle}
          />
        </div>
      )}
    </div>
  );
}

/* ----- styles ----- */

const segWrapStyle: React.CSSProperties = {
  display: "inline-flex",
  gap: 8,
  padding: 6,
  border: "1px solid #d1d5db",
  borderRadius: 999,
  background: "#fff",
};

const segBtnStyle: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid transparent",
  background: "transparent",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 900,
  opacity: 0.8,
};

const segBtnActiveStyle: React.CSSProperties = {
  background: "#111827",
  color: "white",
  opacity: 1,
};

const controlRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 900,
  opacity: 0.75,
};

const inputStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 10,
  border: "1px solid #d1d5db",
  background: "white",
};