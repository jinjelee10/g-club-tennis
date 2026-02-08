"use client";

import { useState } from "react";

export default function LegendToggle() {
  const [lang, setLang] = useState<"en" | "ko">("en");

  return (
    <div style={{ marginTop: 14 }}>
      {/* Toggle buttons */}
      <div style={toggleWrapStyle}>
        <button
          type="button"
          onClick={() => setLang("en")}
          style={{
            ...toggleBtnStyle,
            ...(lang === "en" ? toggleBtnActiveStyle : {}),
          }}
        >
          English
        </button>
        <button
          type="button"
          onClick={() => setLang("ko")}
          style={{
            ...toggleBtnStyle,
            ...(lang === "ko" ? toggleBtnActiveStyle : {}),
          }}
        >
          한국어
        </button>
      </div>

      {/* Legend content */}
      {lang === "en" ? <LegendEnglish /> : <LegendKorean />}
    </div>
  );
}

/* ---------------- English legend ---------------- */

function LegendEnglish() {
  return (
    <details style={legendDetailsStyle}>
      <summary style={legendSummaryStyle}>How points are calculated (Legend)</summary>

      <div style={{ marginTop: 10, display: "grid", gap: 12 }}>
        <div>
          <div style={legendSectionTitleStyle}>Leaderboard Total Points</div>
          <div style={legendTextStyle}>
            <strong>Total Points</strong> = <strong>Match Points</strong> +{" "}
            <strong>Attendance Points</strong>
          </div>
          <ul style={legendListStyle}>
            <li>
              <strong>Match Points</strong> are the sum of{" "}
              <code>match_total_points</code> for <strong>completed</strong> matches.
            </li>
            <li>
              <strong>Attendance Points</strong> = <strong>2 points per day attended</strong>, where
              a day is counted if you have at least one <strong>completed</strong> match on that date.
            </li>
          </ul>
        </div>

        <div>
          <div style={legendSectionTitleStyle}>Match Points (per completed match)</div>

          <div style={legendSubTitleStyle}>Base points</div>
          <ul style={legendListStyle}>
            <li>Winner: <strong>3</strong> points</li>
            <li>Loser: <strong>1</strong> point</li>
          </ul>

          <div style={legendSubTitleStyle}>Double Point (<code>double_point_flag = 1</code>)</div>
          <ul style={legendListStyle}>
            <li>Doubles the <strong>base</strong> win/loss points only</li>
            <li>Winner base becomes <strong>6</strong>, loser base becomes <strong>2</strong></li>
            <li>Bonus points (below) are <strong>not doubled</strong></li>
          </ul>

          <div style={legendSubTitleStyle}>Winner-only bonuses</div>
          <ul style={legendListStyle}>
            <li>Mission comeback: <strong>+2</strong></li>
            <li>Tiebreak win: <strong>+2</strong></li>
            <li>8–0 win: <strong>+3</strong></li>
            <li>7–1 win: <strong>+2</strong></li>
            <li>6–2 win: <strong>+1</strong></li>
          </ul>

          <div style={legendSubTitleStyle}>Individual bonuses (winners & losers)</div>
          <ul style={legendListStyle}>
            <li>No fault miss: <strong>+1</strong></li>
            <li>No return miss: <strong>+1</strong></li>
          </ul>
        </div>

        <div>
          <div style={legendSectionTitleStyle}>How columns are counted</div>
          <ul style={legendListStyle}>
            <li>
              <strong>Attendances</strong> = number of <strong>days</strong> with ≥ 1 completed match.
            </li>
            <li>
              <strong>Wins</strong> / <strong>Losses</strong> exclude double-point matches.
            </li>
            <li>
              <strong>DP Wins</strong> / <strong>DP Losses</strong> count only matches with{" "}
              <code>double_point_flag = 1</code>.
            </li>
            <li>
              <strong>Total Matches Played</strong> = Wins + Losses + DP Wins + DP Losses.
            </li>
          </ul>
        </div>
      </div>
    </details>
  );
}

/* ---------------- Korean legend (Korean-only terms) ---------------- */

function LegendKorean() {
  return (
    <details style={legendDetailsStyle}>
      <summary style={legendSummaryStyle}>점수 계산 방식 (레전드)</summary>

      <div style={{ marginTop: 10, display: "grid", gap: 12 }}>
        <div>
          <div style={legendSectionTitleStyle}>리더보드 총점</div>
          <div style={legendTextStyle}>
            <strong>총점</strong> = <strong>경기 점수</strong> + <strong>출석 점수</strong>
          </div>
          <ul style={legendListStyle}>
            <li>
              <strong>경기 점수</strong>는 <strong>완료된(completed)</strong> 경기의{" "}
              <code>match_total_points</code>를 모두 합산한 값입니다.
            </li>
            <li>
              <strong>출석 점수</strong>는 <strong>출석한 하루당 2점</strong>입니다. 출석한 날은 해당 날짜에{" "}
              <strong>완료된(completed)</strong> 경기가 최소 1개 이상 있는 경우로 계산됩니다.
            </li>
          </ul>
        </div>

        <div>
          <div style={legendSectionTitleStyle}>경기 점수 (완료된 경기 1회 기준)</div>

          <div style={legendSubTitleStyle}>기본 점수</div>
          <ul style={legendListStyle}>
            <li>승리: <strong>3</strong>점</li>
            <li>패배: <strong>1</strong>점</li>
          </ul>

          <div style={legendSubTitleStyle}>
            더블 포인트 (<code>double_point_flag = 1</code>)
          </div>
          <ul style={legendListStyle}>
            <li>
              <strong>기본 승/패 점수만</strong> 2배로 적용됩니다.
            </li>
            <li>
              승리 기본점수는 <strong>6</strong>점, 패배 기본점수는 <strong>2</strong>점이 됩니다.
            </li>
            <li>
              아래 보너스 점수는 <strong>2배 적용되지 않습니다</strong>.
            </li>
          </ul>

          <div style={legendSubTitleStyle}>승리 시에만 적용되는 보너스</div>
          <ul style={legendListStyle}>
            <li>미션 컴백: <strong>+2</strong>점</li>
            <li>타이브레이크 승리: <strong>+2</strong>점</li>
            <li>8–0 승리: <strong>+3</strong>점</li>
            <li>7–1 승리: <strong>+2</strong>점</li>
            <li>6–2 승리: <strong>+1</strong>점</li>
          </ul>

          <div style={legendSubTitleStyle}>개인 보너스 (승/패 모두 적용)</div>
          <ul style={legendListStyle}>
            <li>노 폴트 미스: <strong>+1</strong>점</li>
            <li>노 리턴 미스: <strong>+1</strong>점</li>
          </ul>
        </div>

        <div>
          <div style={legendSectionTitleStyle}>지표(컬럼) 계산 방식</div>
          <ul style={legendListStyle}>
            <li>
              <strong>출석</strong> = <strong>출석한 일수</strong> (완료된 경기가 1개 이상인 날짜 수)
            </li>
            <li>
              <strong>승</strong> / <strong>패</strong> = 더블 포인트 경기를 <strong>제외</strong>한 승/패 횟수
            </li>
            <li>
              <strong>더블 포인트 승</strong> / <strong>더블 포인트 패</strong> ={" "}
              <code>double_point_flag = 1</code>인 경기만 집계
            </li>
            <li>
              <strong>총 경기 수</strong> = 승 + 패 + 더블 포인트 승 + 더블 포인트 패
            </li>
          </ul>
        </div>
      </div>
    </details>
  );
}

/* ---------------- styles ---------------- */

const toggleWrapStyle: React.CSSProperties = {
  display: "inline-flex",
  gap: 8,
  padding: 6,
  border: "1px solid #d1d5db",
  borderRadius: 999,
  background: "#fff",
  marginBottom: 10,
};

const toggleBtnStyle: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid transparent",
  background: "transparent",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 800,
  opacity: 0.8,
};

const toggleBtnActiveStyle: React.CSSProperties = {
  background: "#111827",
  color: "white",
  opacity: 1,
};

const legendDetailsStyle: React.CSSProperties = {
  border: "1px solid #d1d5db",
  borderRadius: 12,
  padding: 12,
  background: "#ffffff",
};

const legendSummaryStyle: React.CSSProperties = {
  cursor: "pointer",
  fontWeight: 900,
  listStyle: "none",
};

const legendSectionTitleStyle: React.CSSProperties = {
  fontWeight: 900,
  marginBottom: 6,
};

const legendSubTitleStyle: React.CSSProperties = {
  fontWeight: 800,
  marginTop: 10,
  marginBottom: 6,
  opacity: 0.9,
};

const legendTextStyle: React.CSSProperties = {
  fontSize: 14,
  opacity: 0.9,
};

const legendListStyle: React.CSSProperties = {
  marginTop: 8,
  marginBottom: 0,
  paddingLeft: 18,
  fontSize: 14,
  lineHeight: 1.6,
  opacity: 0.9,
};