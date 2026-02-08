import Link from "next/link";

export default function Nav() {
  return (
    <nav style={{ display: "flex", gap: 16, padding: 16, borderBottom: "1px solid #eee" }}>
      <Link href="/leaderboard">Leaderboard</Link>
      <Link href="/matches/new">Add Match</Link>
      <Link href="/matches">History</Link>
      <Link href="/matches/today">Schedule</Link>
      <Link href="/matches/points">Bonus Points</Link>
      <Link href="/profiles">Profiles</Link>
      <form action="/logout" method="post" style={{ marginLeft: "auto" }}>
        <button type="submit">Logout</button>
      </form>
    </nav>
  );
}