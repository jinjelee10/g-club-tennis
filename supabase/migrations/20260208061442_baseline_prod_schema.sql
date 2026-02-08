


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."_upsert_player_match_history_row"("p_match_id" "uuid", "p_player_id" "uuid", "p_match_date" "date", "p_status" "text", "p_winner_team" smallint, "p_team_no" smallint, "p_is_winner" boolean, "p_mission_flag" smallint, "p_tiebreak_flag" smallint, "p_w80_flag" smallint, "p_w71_flag" smallint, "p_w62_flag" smallint, "p_mission_pts" integer, "p_tiebreak_pts" integer, "p_w80_pts" integer, "p_w71_pts" integer, "p_w62_pts" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
  insert into public.player_match_history (
    match_id, player_id, match_date, status, winner_team, team_no, is_winner,
    mission_comeback_flag, tiebreak_win_flag, win_8_0_flag, win_7_1_flag, win_6_2_flag,
    mission_comeback_points, tiebreak_win_points, win_8_0_points, win_7_1_points, win_6_2_points,
    updated_at
  )
  values (
    p_match_id, p_player_id, p_match_date, p_status, p_winner_team, p_team_no, p_is_winner,
    p_mission_flag, p_tiebreak_flag, p_w80_flag, p_w71_flag, p_w62_flag,
    p_mission_pts, p_tiebreak_pts, p_w80_pts, p_w71_pts, p_w62_pts,
    now()
  )
  on conflict (match_id, player_id) do update set
    match_date = excluded.match_date,
    status = excluded.status,
    winner_team = excluded.winner_team,
    team_no = excluded.team_no,
    is_winner = excluded.is_winner,

    mission_comeback_flag = excluded.mission_comeback_flag,
    tiebreak_win_flag = excluded.tiebreak_win_flag,
    win_8_0_flag = excluded.win_8_0_flag,
    win_7_1_flag = excluded.win_7_1_flag,
    win_6_2_flag = excluded.win_6_2_flag,

    mission_comeback_points = excluded.mission_comeback_points,
    tiebreak_win_points = excluded.tiebreak_win_points,
    win_8_0_points = excluded.win_8_0_points,
    win_7_1_points = excluded.win_7_1_points,
    win_6_2_points = excluded.win_6_2_points,

    -- ✅ PRESERVE manual per-player flags
    double_point_flag = public.player_match_history.double_point_flag,
    no_fault_miss_flag = public.player_match_history.no_fault_miss_flag,
    no_return_miss_flag = public.player_match_history.no_return_miss_flag,

    updated_at = now();
end $$;


ALTER FUNCTION "public"."_upsert_player_match_history_row"("p_match_id" "uuid", "p_player_id" "uuid", "p_match_date" "date", "p_status" "text", "p_winner_team" smallint, "p_team_no" smallint, "p_is_winner" boolean, "p_mission_flag" smallint, "p_tiebreak_flag" smallint, "p_w80_flag" smallint, "p_w71_flag" smallint, "p_w62_flag" smallint, "p_mission_pts" integer, "p_tiebreak_pts" integer, "p_w80_pts" integer, "p_w71_pts" integer, "p_w62_pts" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."_upsert_player_match_history_row"("p_match_id" "uuid", "p_player_id" "uuid", "p_match_date" "date", "p_status" "text", "p_winner_team" smallint, "p_team_no" integer, "p_is_winner" boolean, "p_mission_comeback_flag" smallint, "p_tiebreak_win_flag" smallint, "p_win_8_0_flag" smallint, "p_win_7_1_flag" smallint, "p_win_6_2_flag" smallint, "p_mission_points" integer, "p_tiebreak_points" integer, "p_w80_points" integer, "p_w71_points" integer, "p_w62_points" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
  insert into public.player_match_history (
    match_id, player_id, match_date, status, winner_team, team_no, is_winner,

    mission_comeback_flag, tiebreak_win_flag, win_8_0_flag, win_7_1_flag, win_6_2_flag,

    mission_comeback_points, tiebreak_win_points, win_8_0_points, win_7_1_points, win_6_2_points,
    updated_at
  )
  values (
    p_match_id, p_player_id, p_match_date, p_status, p_winner_team,
    p_team_no::smallint,
    p_is_winner,

    p_mission_comeback_flag, p_tiebreak_win_flag, p_win_8_0_flag, p_win_7_1_flag, p_win_6_2_flag,

    p_mission_points, p_tiebreak_points, p_w80_points, p_w71_points, p_w62_points,
    now()
  )
  on conflict (match_id, player_id) do update set
    match_date = excluded.match_date,
    status = excluded.status,
    winner_team = excluded.winner_team,
    team_no = excluded.team_no,
    is_winner = excluded.is_winner,

    mission_comeback_flag = excluded.mission_comeback_flag,
    tiebreak_win_flag = excluded.tiebreak_win_flag,
    win_8_0_flag = excluded.win_8_0_flag,
    win_7_1_flag = excluded.win_7_1_flag,
    win_6_2_flag = excluded.win_6_2_flag,

    mission_comeback_points = excluded.mission_comeback_points,
    tiebreak_win_points = excluded.tiebreak_win_points,
    win_8_0_points = excluded.win_8_0_points,
    win_7_1_points = excluded.win_7_1_points,
    win_6_2_points = excluded.win_6_2_points,

    -- Preserve manual double-point choice
    double_point_flag = public.player_match_history.double_point_flag,

    updated_at = now();
end $$;


ALTER FUNCTION "public"."_upsert_player_match_history_row"("p_match_id" "uuid", "p_player_id" "uuid", "p_match_date" "date", "p_status" "text", "p_winner_team" smallint, "p_team_no" integer, "p_is_winner" boolean, "p_mission_comeback_flag" smallint, "p_tiebreak_win_flag" smallint, "p_win_8_0_flag" smallint, "p_win_7_1_flag" smallint, "p_win_6_2_flag" smallint, "p_mission_points" integer, "p_tiebreak_points" integer, "p_w80_points" integer, "p_w71_points" integer, "p_w62_points" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."_upsert_player_match_history_row"("p_match_id" "uuid", "p_player_id" "uuid", "p_match_date" "date", "p_match_time" time without time zone, "p_status" "text", "p_winner_team" smallint, "p_team_no" smallint, "p_is_winner" boolean, "p_mission_comeback_flag" smallint, "p_tiebreak_win_flag" smallint, "p_win_8_0_flag" smallint, "p_win_7_1_flag" smallint, "p_win_6_2_flag" smallint, "p_mission_comeback_points" integer, "p_tiebreak_win_points" integer, "p_win_8_0_points" integer, "p_win_7_1_points" integer, "p_win_6_2_points" integer) RETURNS "void"
    LANGUAGE "sql"
    AS $$
  insert into public.player_match_history (
    match_id, player_id, match_date, match_time, status, winner_team,
    team_no, is_winner,
    mission_comeback_flag, tiebreak_win_flag, win_8_0_flag, win_7_1_flag, win_6_2_flag,
    mission_comeback_points, tiebreak_win_points, win_8_0_points, win_7_1_points, win_6_2_points
  )
  values (
    p_match_id, p_player_id, p_match_date, p_match_time, p_status, p_winner_team,
    p_team_no, p_is_winner,
    p_mission_comeback_flag, p_tiebreak_win_flag, p_win_8_0_flag, p_win_7_1_flag, p_win_6_2_flag,
    p_mission_comeback_points, p_tiebreak_win_points, p_win_8_0_points, p_win_7_1_points, p_win_6_2_points
  )
  on conflict (match_id, player_id) do update set
    match_date = excluded.match_date,
    match_time = excluded.match_time,
    status = excluded.status,
    winner_team = excluded.winner_team,
    team_no = excluded.team_no,
    is_winner = excluded.is_winner,
    mission_comeback_flag = excluded.mission_comeback_flag,
    tiebreak_win_flag = excluded.tiebreak_win_flag,
    win_8_0_flag = excluded.win_8_0_flag,
    win_7_1_flag = excluded.win_7_1_flag,
    win_6_2_flag = excluded.win_6_2_flag,
    mission_comeback_points = excluded.mission_comeback_points,
    tiebreak_win_points = excluded.tiebreak_win_points,
    win_8_0_points = excluded.win_8_0_points,
    win_7_1_points = excluded.win_7_1_points,
    win_6_2_points = excluded.win_6_2_points;
$$;


ALTER FUNCTION "public"."_upsert_player_match_history_row"("p_match_id" "uuid", "p_player_id" "uuid", "p_match_date" "date", "p_match_time" time without time zone, "p_status" "text", "p_winner_team" smallint, "p_team_no" smallint, "p_is_winner" boolean, "p_mission_comeback_flag" smallint, "p_tiebreak_win_flag" smallint, "p_win_8_0_flag" smallint, "p_win_7_1_flag" smallint, "p_win_6_2_flag" smallint, "p_mission_comeback_points" integer, "p_tiebreak_win_points" integer, "p_win_8_0_points" integer, "p_win_7_1_points" integer, "p_win_6_2_points" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."_upsert_player_match_history_row"("p_match_id" "uuid", "p_player_id" "uuid", "p_match_date" "date", "p_status" "text", "p_winner_team" smallint, "p_team_no" smallint, "p_is_winner" boolean, "p_points_win_flag" smallint, "p_points_loss_flag" smallint, "p_mission_comeback_flag" smallint, "p_tiebreak_win_flag" smallint, "p_win_8_0_flag" smallint, "p_win_7_1_flag" smallint, "p_win_6_2_flag" smallint, "p_mission_points" integer, "p_tiebreak_points" integer, "p_w80_points" integer, "p_w71_points" integer, "p_w62_points" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
  insert into public.player_match_history (
    match_id, player_id, match_date, status, winner_team, team_no, is_winner,
    points_win_flag, points_loss_flag,
    mission_comeback_flag, tiebreak_win_flag, win_8_0_flag, win_7_1_flag, win_6_2_flag,
    mission_comeback_points, tiebreak_win_points, win_8_0_points, win_7_1_points, win_6_2_points,
    updated_at
  )
  values (
    p_match_id, p_player_id, p_match_date, p_status, p_winner_team, p_team_no, p_is_winner,
    p_points_win_flag, p_points_loss_flag,
    p_mission_comeback_flag, p_tiebreak_win_flag, p_win_8_0_flag, p_win_7_1_flag, p_win_6_2_flag,
    p_mission_points, p_tiebreak_points, p_w80_points, p_w71_points, p_w62_points,
    now()
  )
  on conflict (match_id, player_id) do update set
    match_date = excluded.match_date,
    status = excluded.status,
    winner_team = excluded.winner_team,
    team_no = excluded.team_no,
    is_winner = excluded.is_winner,

    points_win_flag = excluded.points_win_flag,
    points_loss_flag = excluded.points_loss_flag,

    mission_comeback_flag = excluded.mission_comeback_flag,
    tiebreak_win_flag = excluded.tiebreak_win_flag,
    win_8_0_flag = excluded.win_8_0_flag,
    win_7_1_flag = excluded.win_7_1_flag,
    win_6_2_flag = excluded.win_6_2_flag,

    mission_comeback_points = excluded.mission_comeback_points,
    tiebreak_win_points = excluded.tiebreak_win_points,
    win_8_0_points = excluded.win_8_0_points,
    win_7_1_points = excluded.win_7_1_points,
    win_6_2_points = excluded.win_6_2_points,

    -- ✅ preserve manual double point choice
    double_point_flag = public.player_match_history.double_point_flag,

    updated_at = now();
end $$;


ALTER FUNCTION "public"."_upsert_player_match_history_row"("p_match_id" "uuid", "p_player_id" "uuid", "p_match_date" "date", "p_status" "text", "p_winner_team" smallint, "p_team_no" smallint, "p_is_winner" boolean, "p_points_win_flag" smallint, "p_points_loss_flag" smallint, "p_mission_comeback_flag" smallint, "p_tiebreak_win_flag" smallint, "p_win_8_0_flag" smallint, "p_win_7_1_flag" smallint, "p_win_6_2_flag" smallint, "p_mission_points" integer, "p_tiebreak_points" integer, "p_w80_points" integer, "p_w71_points" integer, "p_w62_points" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."_upsert_player_match_history_row"("p_match_id" "uuid", "p_player_id" "uuid", "p_match_date" "date", "p_status" "text", "p_winner_team" smallint, "p_team_no" integer, "p_is_winner" boolean, "p_points_win_flag" smallint, "p_points_loss_flag" smallint, "p_mission_comeback_flag" smallint, "p_tiebreak_win_flag" smallint, "p_win_8_0_flag" smallint, "p_win_7_1_flag" smallint, "p_win_6_2_flag" smallint, "p_mission_points" integer, "p_tiebreak_points" integer, "p_w80_points" integer, "p_w71_points" integer, "p_w62_points" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
  insert into public.player_match_history (
    match_id, player_id, match_date, status, winner_team, team_no, is_winner,
    points_win_flag, points_loss_flag,
    mission_comeback_flag, tiebreak_win_flag, win_8_0_flag, win_7_1_flag, win_6_2_flag,
    mission_comeback_points, tiebreak_win_points, win_8_0_points, win_7_1_points, win_6_2_points,
    updated_at
  )
  values (
    p_match_id, p_player_id, p_match_date, p_status, p_winner_team,
    p_team_no::smallint,       -- cast here
    p_is_winner,
    p_points_win_flag, p_points_loss_flag,
    p_mission_comeback_flag, p_tiebreak_win_flag, p_win_8_0_flag, p_win_7_1_flag, p_win_6_2_flag,
    p_mission_points, p_tiebreak_points, p_w80_points, p_w71_points, p_w62_points,
    now()
  )
  on conflict (match_id, player_id) do update set
    match_date = excluded.match_date,
    status = excluded.status,
    winner_team = excluded.winner_team,
    team_no = excluded.team_no,
    is_winner = excluded.is_winner,

    points_win_flag = excluded.points_win_flag,
    points_loss_flag = excluded.points_loss_flag,

    mission_comeback_flag = excluded.mission_comeback_flag,
    tiebreak_win_flag = excluded.tiebreak_win_flag,
    win_8_0_flag = excluded.win_8_0_flag,
    win_7_1_flag = excluded.win_7_1_flag,
    win_6_2_flag = excluded.win_6_2_flag,

    mission_comeback_points = excluded.mission_comeback_points,
    tiebreak_win_points = excluded.tiebreak_win_points,
    win_8_0_points = excluded.win_8_0_points,
    win_7_1_points = excluded.win_7_1_points,
    win_6_2_points = excluded.win_6_2_points,

    -- preserve manual double-point choice
    double_point_flag = public.player_match_history.double_point_flag,

    updated_at = now();
end $$;


ALTER FUNCTION "public"."_upsert_player_match_history_row"("p_match_id" "uuid", "p_player_id" "uuid", "p_match_date" "date", "p_status" "text", "p_winner_team" smallint, "p_team_no" integer, "p_is_winner" boolean, "p_points_win_flag" smallint, "p_points_loss_flag" smallint, "p_mission_comeback_flag" smallint, "p_tiebreak_win_flag" smallint, "p_win_8_0_flag" smallint, "p_win_7_1_flag" smallint, "p_win_6_2_flag" smallint, "p_mission_points" integer, "p_tiebreak_points" integer, "p_w80_points" integer, "p_w71_points" integer, "p_w62_points" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."apply_score_driven_flags"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  m text[];
  a int;
  b int;
  hi int;
  lo int;
begin
  -- Only derive flags when match is completed and score exists
  if new.status <> 'completed' or new.score is null then
    new.tiebreak_win_flag := 0;
    new.win_8_0_flag := 0;
    new.win_7_1_flag := 0;
    new.win_6_2_flag := 0;
    return new;
  end if;

  -- Extract the FIRST "X-Y" occurrence from score (e.g. "8-0", "7-6")
  m := regexp_match(new.score, '(\d{1,2})-(\d{1,2})');
  if m is null then
    -- If score doesn't contain X-Y, clear derived flags
    new.tiebreak_win_flag := 0;
    new.win_8_0_flag := 0;
    new.win_7_1_flag := 0;
    new.win_6_2_flag := 0;
    return new;
  end if;

  a := m[1]::int;
  b := m[2]::int;

  -- Normalize so we can check patterns regardless of order
  hi := greatest(a, b);
  lo := least(a, b);

  -- Reset derived flags first
  new.tiebreak_win_flag := 0;
  new.win_8_0_flag := 0;
  new.win_7_1_flag := 0;
  new.win_6_2_flag := 0;

  -- win_* flags: exact score patterns
  if hi = 8 and lo = 0 then
    new.win_8_0_flag := 1;
  elsif hi = 7 and lo = 1 then
    new.win_7_1_flag := 1;
  elsif hi = 6 and lo = 2 then
    new.win_6_2_flag := 1;
  end if;

  -- tiebreak_win_flag: score patterns 5-4, 6-5, 7-6 (difference of 1 at those endpoints)
  if (hi = 5 and lo = 4)
     or (hi = 6 and lo = 5)
     or (hi = 7 and lo = 6) then
    new.tiebreak_win_flag := 1;
  end if;

  -- Note: mission_comeback_flag is manual -> do NOT alter it here

  return new;
end $$;


ALTER FUNCTION "public"."apply_score_driven_flags"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."enforce_double_point_fortnight"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  -- Only validate when switching to 1
  if new.double_point_flag = 1 and coalesce(old.double_point_flag, 0) <> 1 then
    if exists (
      select 1
      from public.player_match_history h
      where h.player_id = new.player_id
        and h.double_point_flag = 1
        and h.match_id <> new.match_id
        and h.match_date between (new.match_date - 13) and (new.match_date + 13)
    ) then
      raise exception 'Double point already used within 14 days for this player.';
    end if;
  end if;

  return new;
end $$;


ALTER FUNCTION "public"."enforce_double_point_fortnight"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."ensure_player_for_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.players (profile_id, name)
  values (new.id, new.display_name)
  on conflict (profile_id) do nothing;

  return new;
end;
$$;


ALTER FUNCTION "public"."ensure_player_for_profile"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    SET "row_security" TO 'off'
    AS $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."leaderboard_range"("p_start_date" "date" DEFAULT NULL::"date", "p_end_date" "date" DEFAULT NULL::"date") RETURNS TABLE("player_id" "uuid", "player_name" "text", "total_attendances" integer, "wins" integer, "losses" integer, "double_point_wins" integer, "double_point_losses" integer, "mission_points_total" integer, "total_points" integer, "rank" integer)
    LANGUAGE "sql" STABLE
    AS $$
with filtered_pmh as (
  select pmh.*
  from public.player_match_history pmh
  where pmh.status = 'completed'
    and (p_start_date is null or pmh.match_date >= p_start_date)
    and (p_end_date is null or pmh.match_date <= p_end_date)
),
per_player as (
  select
    p.id as player_id,
    p.name as player_name,

    -- Attendances = days attended in range (distinct completed match dates)
    coalesce(count(distinct f.match_date), 0)::int as total_attendances,

    -- Wins/Losses EXCLUDING double point matches (mutually exclusive)
    coalesce(count(*) filter (
      where f.is_winner = true and coalesce(f.double_point_flag, 0) = 0
    ), 0)::int as wins,

    coalesce(count(*) filter (
      where f.is_winner = false and coalesce(f.double_point_flag, 0) = 0
    ), 0)::int as losses,

    -- Double Point wins/losses
    coalesce(count(*) filter (
      where f.is_winner = true and coalesce(f.double_point_flag, 0) = 1
    ), 0)::int as double_point_wins,

    coalesce(count(*) filter (
      where f.is_winner = false and coalesce(f.double_point_flag, 0) = 1
    ), 0)::int as double_point_losses,

    -- Mission Points Total (bonus points from flags within range)
    coalesce(
      sum(
        (case when f.is_winner = true and coalesce(f.mission_comeback_flag, 0) = 1 then 2 else 0 end) +
        (case when f.is_winner = true and coalesce(f.tiebreak_win_flag, 0) = 1 then 2 else 0 end) +
        (case when f.is_winner = true and coalesce(f.win_8_0_flag, 0) = 1 then 3 else 0 end) +
        (case when f.is_winner = true and coalesce(f.win_7_1_flag, 0) = 1 then 2 else 0 end) +
        (case when f.is_winner = true and coalesce(f.win_6_2_flag, 0) = 1 then 1 else 0 end) +
        (case when coalesce(f.no_fault_miss_flag, 0) = 1 then 1 else 0 end) +
        (case when coalesce(f.no_return_miss_flag, 0) = 1 then 1 else 0 end)
      ),
      0
    )::int as mission_points_total,

    -- Match points total within range (already computed in PMH)
    coalesce(sum(f.match_total_points), 0)::int as match_points_total

  from public.players p
  left join filtered_pmh f
    on f.player_id = p.id
  where p.is_active = true
  group by p.id, p.name
),
final as (
  select
    *,
    (total_attendances * 2) as attendance_points,
    (match_points_total + (total_attendances * 2)) as total_points_calc,
    (wins + double_point_wins) as total_wins_calc
  from per_player
),
ranked as (
  select
    player_id,
    player_name,
    total_attendances,
    wins,
    losses,
    double_point_wins,
    double_point_losses,
    mission_points_total,
    total_points_calc as total_points,
    dense_rank() over (
      order by total_points_calc desc,
               total_wins_calc desc,
               total_attendances desc,
               player_name asc
    )::int as rank
  from final
)
select * from ranked;
$$;


ALTER FUNCTION "public"."leaderboard_range"("p_start_date" "date", "p_end_date" "date") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."recalc_player_match_history_points"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  WIN_POINTS int := 3;
  LOSS_POINTS int := 1;
  multiplier int;
begin
  new.updated_at := now();

  -- Individual points always depend only on their flags (not win/loss)
  new.no_fault_miss_points := case when new.no_fault_miss_flag = 1 then 1 else 0 end;
  new.no_return_miss_points := case when new.no_return_miss_flag = 1 then 1 else 0 end;

  -- Only award match points when completed
  if new.status <> 'completed' or new.winner_team is null then
    new.win_loss_points := 0;
    new.match_total_points := 0;
    return new;
  end if;

  multiplier := case when new.double_point_flag = 1 then 2 else 1 end;

  -- Win/loss points per your rules
  new.win_loss_points :=
    (case when new.is_winner then WIN_POINTS else LOSS_POINTS end) * multiplier;

  -- Total = win/loss points + match bonuses + individual points
  -- (Bonuses are NOT doubled)
  new.match_total_points :=
    new.win_loss_points
    + coalesce(new.mission_comeback_points, 0)
    + coalesce(new.tiebreak_win_points, 0)
    + coalesce(new.win_8_0_points, 0)
    + coalesce(new.win_7_1_points, 0)
    + coalesce(new.win_6_2_points, 0)
    + coalesce(new.no_fault_miss_points, 0)
    + coalesce(new.no_return_miss_points, 0);

  return new;
end $$;


ALTER FUNCTION "public"."recalc_player_match_history_points"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."refresh_player_match_history"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
declare
  MISSION_POINTS int := 2;
  TIEBREAK_POINTS int := 2;
  W80_POINTS int := 3;
  W71_POINTS int := 2;
  W62_POINTS int := 1;

  t1_is_winner boolean;
  t2_is_winner boolean;

  mission_t1 int; tiebreak_t1 int; w80_t1 int; w71_t1 int; w62_t1 int;
  mission_t2 int; tiebreak_t2 int; w80_t2 int; w71_t2 int; w62_t2 int;
begin
  t1_is_winner := (new.status = 'completed' and new.winner_team = 1);
  t2_is_winner := (new.status = 'completed' and new.winner_team = 2);

  -- winners-only bonuses
  mission_t1 := case when t1_is_winner then new.mission_comeback_flag * MISSION_POINTS else 0 end;
  tiebreak_t1 := case when t1_is_winner then new.tiebreak_win_flag * TIEBREAK_POINTS else 0 end;
  w80_t1 := case when t1_is_winner then new.win_8_0_flag * W80_POINTS else 0 end;
  w71_t1 := case when t1_is_winner then new.win_7_1_flag * W71_POINTS else 0 end;
  w62_t1 := case when t1_is_winner then new.win_6_2_flag * W62_POINTS else 0 end;

  mission_t2 := case when t2_is_winner then new.mission_comeback_flag * MISSION_POINTS else 0 end;
  tiebreak_t2 := case when t2_is_winner then new.tiebreak_win_flag * TIEBREAK_POINTS else 0 end;
  w80_t2 := case when t2_is_winner then new.win_8_0_flag * W80_POINTS else 0 end;
  w71_t2 := case when t2_is_winner then new.win_7_1_flag * W71_POINTS else 0 end;
  w62_t2 := case when t2_is_winner then new.win_6_2_flag * W62_POINTS else 0 end;

  -- Team 1 player 1
  perform public._upsert_player_match_history_row(
    new.id, new.team1_player1_id, new.match_date, new.status, new.winner_team, 1::smallint, t1_is_winner,
    new.mission_comeback_flag, new.tiebreak_win_flag, new.win_8_0_flag, new.win_7_1_flag, new.win_6_2_flag,
    mission_t1, tiebreak_t1, w80_t1, w71_t1, w62_t1
  );

  -- Team 1 player 2
  perform public._upsert_player_match_history_row(
    new.id, new.team1_player2_id, new.match_date, new.status, new.winner_team, 1::smallint, t1_is_winner,
    new.mission_comeback_flag, new.tiebreak_win_flag, new.win_8_0_flag, new.win_7_1_flag, new.win_6_2_flag,
    mission_t1, tiebreak_t1, w80_t1, w71_t1, w62_t1
  );

  -- Team 2 player 1
  perform public._upsert_player_match_history_row(
    new.id, new.team2_player1_id, new.match_date, new.status, new.winner_team, 2::smallint, t2_is_winner,
    new.mission_comeback_flag, new.tiebreak_win_flag, new.win_8_0_flag, new.win_7_1_flag, new.win_6_2_flag,
    mission_t2, tiebreak_t2, w80_t2, w71_t2, w62_t2
  );

  -- Team 2 player 2
  perform public._upsert_player_match_history_row(
    new.id, new.team2_player2_id, new.match_date, new.status, new.winner_team, 2::smallint, t2_is_winner,
    new.mission_comeback_flag, new.tiebreak_win_flag, new.win_8_0_flag, new.win_7_1_flag, new.win_6_2_flag,
    mission_t2, tiebreak_t2, w80_t2, w71_t2, w62_t2
  );

  return new;
end $$;


ALTER FUNCTION "public"."refresh_player_match_history"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."matches" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "match_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "team1_player1_id" "uuid" NOT NULL,
    "team1_player2_id" "uuid" NOT NULL,
    "team2_player1_id" "uuid" NOT NULL,
    "team2_player2_id" "uuid" NOT NULL,
    "winner_team" smallint,
    "score" "text",
    "created_by" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "mission_comeback_flag" smallint DEFAULT 0 NOT NULL,
    "tiebreak_win_flag" smallint DEFAULT 0 NOT NULL,
    "win_8_0_flag" smallint DEFAULT 0 NOT NULL,
    "win_7_1_flag" smallint DEFAULT 0 NOT NULL,
    "win_6_2_flag" smallint DEFAULT 0 NOT NULL,
    "match_time" time without time zone NOT NULL,
    CONSTRAINT "matches_bonus_flags_check" CHECK ((("mission_comeback_flag" = ANY (ARRAY[0, 1])) AND ("tiebreak_win_flag" = ANY (ARRAY[0, 1])) AND ("win_8_0_flag" = ANY (ARRAY[0, 1])) AND ("win_7_1_flag" = ANY (ARRAY[0, 1])) AND ("win_6_2_flag" = ANY (ARRAY[0, 1])))),
    CONSTRAINT "matches_completed_has_result" CHECK ((("status" <> 'completed'::"text") OR ("winner_team" IS NOT NULL))),
    CONSTRAINT "matches_match_time_allowed" CHECK (("match_time" = ANY (ARRAY['08:30:00'::time without time zone, '09:00:00'::time without time zone, '09:30:00'::time without time zone, '10:00:00'::time without time zone]))),
    CONSTRAINT "matches_scheduled_has_no_result" CHECK ((("status" <> 'scheduled'::"text") OR (("winner_team" IS NULL) AND ("score" IS NULL)))),
    CONSTRAINT "matches_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'completed'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "matches_unique_players_check" CHECK ((("team1_player1_id" <> "team1_player2_id") AND ("team1_player1_id" <> "team2_player1_id") AND ("team1_player1_id" <> "team2_player2_id") AND ("team1_player2_id" <> "team2_player1_id") AND ("team1_player2_id" <> "team2_player2_id") AND ("team2_player1_id" <> "team2_player2_id"))),
    CONSTRAINT "matches_winner_team_check" CHECK (("winner_team" = ANY (ARRAY[1, 2]))),
    CONSTRAINT "no_duplicate_players" CHECK ((("team1_player1_id" <> "team2_player1_id") AND ("team1_player1_id" <> "team2_player2_id") AND ("team1_player2_id" <> "team2_player1_id") AND ("team1_player2_id" <> "team2_player2_id"))),
    CONSTRAINT "team1_distinct" CHECK (("team1_player1_id" <> "team1_player2_id")),
    CONSTRAINT "team2_distinct" CHECK (("team2_player1_id" <> "team2_player2_id"))
);


ALTER TABLE "public"."matches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."player_match_history" (
    "id" bigint NOT NULL,
    "match_id" "uuid" NOT NULL,
    "player_id" "uuid" NOT NULL,
    "match_date" "date" NOT NULL,
    "status" "text" NOT NULL,
    "winner_team" smallint,
    "team_no" smallint NOT NULL,
    "is_winner" boolean DEFAULT false NOT NULL,
    "mission_comeback_flag" smallint DEFAULT 0 NOT NULL,
    "tiebreak_win_flag" smallint DEFAULT 0 NOT NULL,
    "win_8_0_flag" smallint DEFAULT 0 NOT NULL,
    "win_7_1_flag" smallint DEFAULT 0 NOT NULL,
    "win_6_2_flag" smallint DEFAULT 0 NOT NULL,
    "double_point_flag" smallint DEFAULT 0 NOT NULL,
    "win_loss_points" integer DEFAULT 0 NOT NULL,
    "mission_comeback_points" integer DEFAULT 0 NOT NULL,
    "tiebreak_win_points" integer DEFAULT 0 NOT NULL,
    "win_8_0_points" integer DEFAULT 0 NOT NULL,
    "win_7_1_points" integer DEFAULT 0 NOT NULL,
    "win_6_2_points" integer DEFAULT 0 NOT NULL,
    "match_total_points" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "no_fault_miss_flag" smallint DEFAULT 0 NOT NULL,
    "no_return_miss_flag" smallint DEFAULT 0 NOT NULL,
    "no_fault_miss_points" integer DEFAULT 0 NOT NULL,
    "no_return_miss_points" integer DEFAULT 0 NOT NULL,
    "match_time" time without time zone,
    CONSTRAINT "player_match_history_double_point_flag_check" CHECK (("double_point_flag" = ANY (ARRAY[0, 1]))),
    CONSTRAINT "player_match_history_mission_comeback_flag_check" CHECK (("mission_comeback_flag" = ANY (ARRAY[0, 1]))),
    CONSTRAINT "player_match_history_team_no_check" CHECK (("team_no" = ANY (ARRAY[1, 2]))),
    CONSTRAINT "player_match_history_tiebreak_win_flag_check" CHECK (("tiebreak_win_flag" = ANY (ARRAY[0, 1]))),
    CONSTRAINT "player_match_history_win_6_2_flag_check" CHECK (("win_6_2_flag" = ANY (ARRAY[0, 1]))),
    CONSTRAINT "player_match_history_win_7_1_flag_check" CHECK (("win_7_1_flag" = ANY (ARRAY[0, 1]))),
    CONSTRAINT "player_match_history_win_8_0_flag_check" CHECK (("win_8_0_flag" = ANY (ARRAY[0, 1]))),
    CONSTRAINT "pmh_match_time_allowed" CHECK (("match_time" = ANY (ARRAY['08:30:00'::time without time zone, '09:00:00'::time without time zone, '09:30:00'::time without time zone, '10:00:00'::time without time zone])))
);


ALTER TABLE "public"."player_match_history" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."player_match_history_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."player_match_history_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."player_match_history_id_seq" OWNED BY "public"."player_match_history"."id";



CREATE TABLE IF NOT EXISTS "public"."players" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid",
    "name" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."players" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "display_name" "text" NOT NULL,
    "is_admin" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "member" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_leaderboard" AS
 WITH "per_player" AS (
         SELECT "pmh"."player_id",
            "p"."name" AS "player_name",
            COALESCE("count"(DISTINCT "pmh"."match_date") FILTER (WHERE ("pmh"."status" = 'completed'::"text")), (0)::bigint) AS "total_attendances",
            (COALESCE("count"(DISTINCT "pmh"."match_date") FILTER (WHERE ("pmh"."status" = 'completed'::"text")), (0)::bigint) * 2) AS "attendance_points",
            "count"(*) FILTER (WHERE (("pmh"."status" = 'completed'::"text") AND ("pmh"."is_winner" = true) AND (COALESCE(("pmh"."double_point_flag")::integer, 0) = 0))) AS "wins",
            "count"(*) FILTER (WHERE (("pmh"."status" = 'completed'::"text") AND ("pmh"."is_winner" = false) AND (COALESCE(("pmh"."double_point_flag")::integer, 0) = 0))) AS "losses",
            "count"(*) FILTER (WHERE (("pmh"."status" = 'completed'::"text") AND ("pmh"."is_winner" = true) AND (COALESCE(("pmh"."double_point_flag")::integer, 0) = 1))) AS "double_point_wins",
            "count"(*) FILTER (WHERE (("pmh"."status" = 'completed'::"text") AND ("pmh"."is_winner" = false) AND (COALESCE(("pmh"."double_point_flag")::integer, 0) = 1))) AS "double_point_losses",
            COALESCE("sum"(
                CASE
                    WHEN ("pmh"."status" <> 'completed'::"text") THEN 0
                    ELSE ((((((
                    CASE
                        WHEN (("pmh"."is_winner" = true) AND (COALESCE(("pmh"."mission_comeback_flag")::integer, 0) = 1)) THEN 2
                        ELSE 0
                    END +
                    CASE
                        WHEN (("pmh"."is_winner" = true) AND (COALESCE(("pmh"."tiebreak_win_flag")::integer, 0) = 1)) THEN 2
                        ELSE 0
                    END) +
                    CASE
                        WHEN (("pmh"."is_winner" = true) AND (COALESCE(("pmh"."win_8_0_flag")::integer, 0) = 1)) THEN 3
                        ELSE 0
                    END) +
                    CASE
                        WHEN (("pmh"."is_winner" = true) AND (COALESCE(("pmh"."win_7_1_flag")::integer, 0) = 1)) THEN 2
                        ELSE 0
                    END) +
                    CASE
                        WHEN (("pmh"."is_winner" = true) AND (COALESCE(("pmh"."win_6_2_flag")::integer, 0) = 1)) THEN 1
                        ELSE 0
                    END) +
                    CASE
                        WHEN (COALESCE(("pmh"."no_fault_miss_flag")::integer, 0) = 1) THEN 1
                        ELSE 0
                    END) +
                    CASE
                        WHEN (COALESCE(("pmh"."no_return_miss_flag")::integer, 0) = 1) THEN 1
                        ELSE 0
                    END)
                END), (0)::bigint) AS "mission_points_total",
            COALESCE("sum"("pmh"."match_total_points") FILTER (WHERE ("pmh"."status" = 'completed'::"text")), (0)::bigint) AS "match_points_total"
           FROM ("public"."player_match_history" "pmh"
             JOIN "public"."players" "p" ON (("p"."id" = "pmh"."player_id")))
          WHERE ("p"."is_active" = true)
          GROUP BY "pmh"."player_id", "p"."name"
        ), "final" AS (
         SELECT "per_player"."player_id",
            "per_player"."player_name",
            "per_player"."total_attendances",
            "per_player"."attendance_points",
            "per_player"."wins",
            "per_player"."losses",
            "per_player"."double_point_wins",
            "per_player"."double_point_losses",
            "per_player"."mission_points_total",
            "per_player"."match_points_total",
            ("per_player"."match_points_total" + "per_player"."attendance_points") AS "total_points_for_leaderboard",
            ("per_player"."wins" + "per_player"."double_point_wins") AS "total_wins"
           FROM "per_player"
        ), "ranked" AS (
         SELECT "final"."player_id",
            "final"."player_name",
            "final"."total_attendances",
            "final"."attendance_points",
            "final"."wins",
            "final"."losses",
            "final"."double_point_wins",
            "final"."double_point_losses",
            "final"."mission_points_total",
            "final"."match_points_total",
            "final"."total_points_for_leaderboard",
            "final"."total_wins",
            "dense_rank"() OVER (ORDER BY "final"."total_points_for_leaderboard" DESC, "final"."total_wins" DESC, "final"."total_attendances" DESC, "final"."player_name") AS "rank"
           FROM "final"
        )
 SELECT "player_id",
    "player_name",
    "total_attendances",
    "wins",
    "losses",
    "double_point_wins",
    "double_point_losses",
    "mission_points_total",
    "total_points_for_leaderboard" AS "total_points",
    "rank"
   FROM "ranked";


ALTER VIEW "public"."v_leaderboard" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_player_match_history" AS
 SELECT "h"."match_id",
    "h"."match_date",
    "h"."status",
    "h"."player_id",
    "p"."name" AS "player_name",
    "h"."team_no",
    "h"."is_winner",
    "h"."double_point_flag",
    "h"."win_loss_points" AS "base_points",
    "h"."mission_comeback_points",
    "h"."tiebreak_win_points",
    "h"."win_8_0_points",
    "h"."win_7_1_points",
    "h"."win_6_2_points",
    "h"."match_total_points"
   FROM ("public"."player_match_history" "h"
     JOIN "public"."players" "p" ON (("p"."id" = "h"."player_id")));


ALTER VIEW "public"."v_player_match_history" OWNER TO "postgres";


ALTER TABLE ONLY "public"."player_match_history" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."player_match_history_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."player_match_history"
    ADD CONSTRAINT "player_match_history_match_id_player_id_key" UNIQUE ("match_id", "player_id");



ALTER TABLE ONLY "public"."player_match_history"
    ADD CONSTRAINT "player_match_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_profile_id_key" UNIQUE ("profile_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_matches_date" ON "public"."matches" USING "btree" ("match_date");



CREATE INDEX "idx_matches_t1p1" ON "public"."matches" USING "btree" ("team1_player1_id");



CREATE INDEX "idx_matches_t1p2" ON "public"."matches" USING "btree" ("team1_player2_id");



CREATE INDEX "idx_matches_t2p1" ON "public"."matches" USING "btree" ("team2_player1_id");



CREATE INDEX "idx_matches_t2p2" ON "public"."matches" USING "btree" ("team2_player2_id");



CREATE INDEX "matches_date_status_idx" ON "public"."matches" USING "btree" ("match_date", "status");



CREATE INDEX "player_match_history_match_idx" ON "public"."player_match_history" USING "btree" ("match_id");



CREATE INDEX "player_match_history_player_date_idx" ON "public"."player_match_history" USING "btree" ("player_id", "match_date");



CREATE INDEX "pmh_match_idx" ON "public"."player_match_history" USING "btree" ("match_id");



CREATE INDEX "pmh_player_date_idx" ON "public"."player_match_history" USING "btree" ("player_id", "match_date");



CREATE UNIQUE INDEX "uq_players_profile_id" ON "public"."players" USING "btree" ("profile_id");



CREATE UNIQUE INDEX "uq_pmh_player_per_timeslot" ON "public"."player_match_history" USING "btree" ("player_id", "match_date", "match_time") WHERE ("status" <> 'cancelled'::"text");



CREATE OR REPLACE TRIGGER "on_profile_created_make_player" AFTER INSERT ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."ensure_player_for_profile"();



CREATE OR REPLACE TRIGGER "set_matches_updated_at" BEFORE UPDATE ON "public"."matches" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_apply_score_driven_flags" BEFORE INSERT OR UPDATE OF "score", "status" ON "public"."matches" FOR EACH ROW EXECUTE FUNCTION "public"."apply_score_driven_flags"();



CREATE OR REPLACE TRIGGER "trg_enforce_double_point_fortnight" BEFORE INSERT OR UPDATE OF "double_point_flag", "match_date", "player_id" ON "public"."player_match_history" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_double_point_fortnight"();



CREATE OR REPLACE TRIGGER "trg_recalc_player_match_history_points" BEFORE INSERT OR UPDATE OF "status", "winner_team", "is_winner", "double_point_flag", "no_fault_miss_flag", "no_return_miss_flag", "mission_comeback_points", "tiebreak_win_points", "win_8_0_points", "win_7_1_points", "win_6_2_points" ON "public"."player_match_history" FOR EACH ROW EXECUTE FUNCTION "public"."recalc_player_match_history_points"();



CREATE OR REPLACE TRIGGER "trg_refresh_player_match_history" AFTER INSERT OR UPDATE OF "match_date", "status", "winner_team", "mission_comeback_flag", "tiebreak_win_flag", "win_8_0_flag", "win_7_1_flag", "win_6_2_flag", "team1_player1_id", "team1_player2_id", "team2_player1_id", "team2_player2_id" ON "public"."matches" FOR EACH ROW EXECUTE FUNCTION "public"."refresh_player_match_history"();



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_team1_player1_id_fkey" FOREIGN KEY ("team1_player1_id") REFERENCES "public"."players"("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_team1_player2_id_fkey" FOREIGN KEY ("team1_player2_id") REFERENCES "public"."players"("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_team2_player1_id_fkey" FOREIGN KEY ("team2_player1_id") REFERENCES "public"."players"("id");



ALTER TABLE ONLY "public"."matches"
    ADD CONSTRAINT "matches_team2_player2_id_fkey" FOREIGN KEY ("team2_player2_id") REFERENCES "public"."players"("id");



ALTER TABLE ONLY "public"."player_match_history"
    ADD CONSTRAINT "player_match_history_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."player_match_history"
    ADD CONSTRAINT "player_match_history_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."players"
    ADD CONSTRAINT "players_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."matches" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "matches_admin_delete" ON "public"."matches" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "matches_admin_update" ON "public"."matches" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "matches_creator_delete_24h" ON "public"."matches" FOR DELETE TO "authenticated" USING ((("created_by" = "auth"."uid"()) AND ("created_at" > ("now"() - '24:00:00'::interval))));



CREATE POLICY "matches_creator_update_24h" ON "public"."matches" FOR UPDATE TO "authenticated" USING ((("created_by" = "auth"."uid"()) AND ("created_at" > ("now"() - '24:00:00'::interval)))) WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "matches_insert_member" ON "public"."matches" FOR INSERT TO "authenticated" WITH CHECK (("created_by" = "auth"."uid"()));



CREATE POLICY "matches_read_all" ON "public"."matches" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "matches_update_auth" ON "public"."matches" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



ALTER TABLE "public"."players" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "players_admin_write" ON "public"."players" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "players_read_all" ON "public"."players" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "players_update_own" ON "public"."players" FOR UPDATE TO "authenticated" USING (("profile_id" = "auth"."uid"())) WITH CHECK (("profile_id" = "auth"."uid"()));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_read_own" ON "public"."profiles" FOR SELECT TO "authenticated" USING ((("id" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((("id" = "auth"."uid"()) OR "public"."is_admin"())) WITH CHECK ((("id" = "auth"."uid"()) OR "public"."is_admin"()));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."_upsert_player_match_history_row"("p_match_id" "uuid", "p_player_id" "uuid", "p_match_date" "date", "p_status" "text", "p_winner_team" smallint, "p_team_no" smallint, "p_is_winner" boolean, "p_mission_flag" smallint, "p_tiebreak_flag" smallint, "p_w80_flag" smallint, "p_w71_flag" smallint, "p_w62_flag" smallint, "p_mission_pts" integer, "p_tiebreak_pts" integer, "p_w80_pts" integer, "p_w71_pts" integer, "p_w62_pts" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."_upsert_player_match_history_row"("p_match_id" "uuid", "p_player_id" "uuid", "p_match_date" "date", "p_status" "text", "p_winner_team" smallint, "p_team_no" smallint, "p_is_winner" boolean, "p_mission_flag" smallint, "p_tiebreak_flag" smallint, "p_w80_flag" smallint, "p_w71_flag" smallint, "p_w62_flag" smallint, "p_mission_pts" integer, "p_tiebreak_pts" integer, "p_w80_pts" integer, "p_w71_pts" integer, "p_w62_pts" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_upsert_player_match_history_row"("p_match_id" "uuid", "p_player_id" "uuid", "p_match_date" "date", "p_status" "text", "p_winner_team" smallint, "p_team_no" smallint, "p_is_winner" boolean, "p_mission_flag" smallint, "p_tiebreak_flag" smallint, "p_w80_flag" smallint, "p_w71_flag" smallint, "p_w62_flag" smallint, "p_mission_pts" integer, "p_tiebreak_pts" integer, "p_w80_pts" integer, "p_w71_pts" integer, "p_w62_pts" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."_upsert_player_match_history_row"("p_match_id" "uuid", "p_player_id" "uuid", "p_match_date" "date", "p_status" "text", "p_winner_team" smallint, "p_team_no" integer, "p_is_winner" boolean, "p_mission_comeback_flag" smallint, "p_tiebreak_win_flag" smallint, "p_win_8_0_flag" smallint, "p_win_7_1_flag" smallint, "p_win_6_2_flag" smallint, "p_mission_points" integer, "p_tiebreak_points" integer, "p_w80_points" integer, "p_w71_points" integer, "p_w62_points" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."_upsert_player_match_history_row"("p_match_id" "uuid", "p_player_id" "uuid", "p_match_date" "date", "p_status" "text", "p_winner_team" smallint, "p_team_no" integer, "p_is_winner" boolean, "p_mission_comeback_flag" smallint, "p_tiebreak_win_flag" smallint, "p_win_8_0_flag" smallint, "p_win_7_1_flag" smallint, "p_win_6_2_flag" smallint, "p_mission_points" integer, "p_tiebreak_points" integer, "p_w80_points" integer, "p_w71_points" integer, "p_w62_points" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_upsert_player_match_history_row"("p_match_id" "uuid", "p_player_id" "uuid", "p_match_date" "date", "p_status" "text", "p_winner_team" smallint, "p_team_no" integer, "p_is_winner" boolean, "p_mission_comeback_flag" smallint, "p_tiebreak_win_flag" smallint, "p_win_8_0_flag" smallint, "p_win_7_1_flag" smallint, "p_win_6_2_flag" smallint, "p_mission_points" integer, "p_tiebreak_points" integer, "p_w80_points" integer, "p_w71_points" integer, "p_w62_points" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."_upsert_player_match_history_row"("p_match_id" "uuid", "p_player_id" "uuid", "p_match_date" "date", "p_match_time" time without time zone, "p_status" "text", "p_winner_team" smallint, "p_team_no" smallint, "p_is_winner" boolean, "p_mission_comeback_flag" smallint, "p_tiebreak_win_flag" smallint, "p_win_8_0_flag" smallint, "p_win_7_1_flag" smallint, "p_win_6_2_flag" smallint, "p_mission_comeback_points" integer, "p_tiebreak_win_points" integer, "p_win_8_0_points" integer, "p_win_7_1_points" integer, "p_win_6_2_points" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."_upsert_player_match_history_row"("p_match_id" "uuid", "p_player_id" "uuid", "p_match_date" "date", "p_match_time" time without time zone, "p_status" "text", "p_winner_team" smallint, "p_team_no" smallint, "p_is_winner" boolean, "p_mission_comeback_flag" smallint, "p_tiebreak_win_flag" smallint, "p_win_8_0_flag" smallint, "p_win_7_1_flag" smallint, "p_win_6_2_flag" smallint, "p_mission_comeback_points" integer, "p_tiebreak_win_points" integer, "p_win_8_0_points" integer, "p_win_7_1_points" integer, "p_win_6_2_points" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_upsert_player_match_history_row"("p_match_id" "uuid", "p_player_id" "uuid", "p_match_date" "date", "p_match_time" time without time zone, "p_status" "text", "p_winner_team" smallint, "p_team_no" smallint, "p_is_winner" boolean, "p_mission_comeback_flag" smallint, "p_tiebreak_win_flag" smallint, "p_win_8_0_flag" smallint, "p_win_7_1_flag" smallint, "p_win_6_2_flag" smallint, "p_mission_comeback_points" integer, "p_tiebreak_win_points" integer, "p_win_8_0_points" integer, "p_win_7_1_points" integer, "p_win_6_2_points" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."_upsert_player_match_history_row"("p_match_id" "uuid", "p_player_id" "uuid", "p_match_date" "date", "p_status" "text", "p_winner_team" smallint, "p_team_no" smallint, "p_is_winner" boolean, "p_points_win_flag" smallint, "p_points_loss_flag" smallint, "p_mission_comeback_flag" smallint, "p_tiebreak_win_flag" smallint, "p_win_8_0_flag" smallint, "p_win_7_1_flag" smallint, "p_win_6_2_flag" smallint, "p_mission_points" integer, "p_tiebreak_points" integer, "p_w80_points" integer, "p_w71_points" integer, "p_w62_points" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."_upsert_player_match_history_row"("p_match_id" "uuid", "p_player_id" "uuid", "p_match_date" "date", "p_status" "text", "p_winner_team" smallint, "p_team_no" smallint, "p_is_winner" boolean, "p_points_win_flag" smallint, "p_points_loss_flag" smallint, "p_mission_comeback_flag" smallint, "p_tiebreak_win_flag" smallint, "p_win_8_0_flag" smallint, "p_win_7_1_flag" smallint, "p_win_6_2_flag" smallint, "p_mission_points" integer, "p_tiebreak_points" integer, "p_w80_points" integer, "p_w71_points" integer, "p_w62_points" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_upsert_player_match_history_row"("p_match_id" "uuid", "p_player_id" "uuid", "p_match_date" "date", "p_status" "text", "p_winner_team" smallint, "p_team_no" smallint, "p_is_winner" boolean, "p_points_win_flag" smallint, "p_points_loss_flag" smallint, "p_mission_comeback_flag" smallint, "p_tiebreak_win_flag" smallint, "p_win_8_0_flag" smallint, "p_win_7_1_flag" smallint, "p_win_6_2_flag" smallint, "p_mission_points" integer, "p_tiebreak_points" integer, "p_w80_points" integer, "p_w71_points" integer, "p_w62_points" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."_upsert_player_match_history_row"("p_match_id" "uuid", "p_player_id" "uuid", "p_match_date" "date", "p_status" "text", "p_winner_team" smallint, "p_team_no" integer, "p_is_winner" boolean, "p_points_win_flag" smallint, "p_points_loss_flag" smallint, "p_mission_comeback_flag" smallint, "p_tiebreak_win_flag" smallint, "p_win_8_0_flag" smallint, "p_win_7_1_flag" smallint, "p_win_6_2_flag" smallint, "p_mission_points" integer, "p_tiebreak_points" integer, "p_w80_points" integer, "p_w71_points" integer, "p_w62_points" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."_upsert_player_match_history_row"("p_match_id" "uuid", "p_player_id" "uuid", "p_match_date" "date", "p_status" "text", "p_winner_team" smallint, "p_team_no" integer, "p_is_winner" boolean, "p_points_win_flag" smallint, "p_points_loss_flag" smallint, "p_mission_comeback_flag" smallint, "p_tiebreak_win_flag" smallint, "p_win_8_0_flag" smallint, "p_win_7_1_flag" smallint, "p_win_6_2_flag" smallint, "p_mission_points" integer, "p_tiebreak_points" integer, "p_w80_points" integer, "p_w71_points" integer, "p_w62_points" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."_upsert_player_match_history_row"("p_match_id" "uuid", "p_player_id" "uuid", "p_match_date" "date", "p_status" "text", "p_winner_team" smallint, "p_team_no" integer, "p_is_winner" boolean, "p_points_win_flag" smallint, "p_points_loss_flag" smallint, "p_mission_comeback_flag" smallint, "p_tiebreak_win_flag" smallint, "p_win_8_0_flag" smallint, "p_win_7_1_flag" smallint, "p_win_6_2_flag" smallint, "p_mission_points" integer, "p_tiebreak_points" integer, "p_w80_points" integer, "p_w71_points" integer, "p_w62_points" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."apply_score_driven_flags"() TO "anon";
GRANT ALL ON FUNCTION "public"."apply_score_driven_flags"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."apply_score_driven_flags"() TO "service_role";



GRANT ALL ON FUNCTION "public"."enforce_double_point_fortnight"() TO "anon";
GRANT ALL ON FUNCTION "public"."enforce_double_point_fortnight"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."enforce_double_point_fortnight"() TO "service_role";



GRANT ALL ON FUNCTION "public"."ensure_player_for_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."ensure_player_for_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."ensure_player_for_profile"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."leaderboard_range"("p_start_date" "date", "p_end_date" "date") TO "anon";
GRANT ALL ON FUNCTION "public"."leaderboard_range"("p_start_date" "date", "p_end_date" "date") TO "authenticated";
GRANT ALL ON FUNCTION "public"."leaderboard_range"("p_start_date" "date", "p_end_date" "date") TO "service_role";



GRANT ALL ON FUNCTION "public"."recalc_player_match_history_points"() TO "anon";
GRANT ALL ON FUNCTION "public"."recalc_player_match_history_points"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."recalc_player_match_history_points"() TO "service_role";



GRANT ALL ON FUNCTION "public"."refresh_player_match_history"() TO "anon";
GRANT ALL ON FUNCTION "public"."refresh_player_match_history"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."refresh_player_match_history"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."matches" TO "anon";
GRANT ALL ON TABLE "public"."matches" TO "authenticated";
GRANT ALL ON TABLE "public"."matches" TO "service_role";



GRANT ALL ON TABLE "public"."player_match_history" TO "anon";
GRANT ALL ON TABLE "public"."player_match_history" TO "authenticated";
GRANT ALL ON TABLE "public"."player_match_history" TO "service_role";



GRANT ALL ON SEQUENCE "public"."player_match_history_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."player_match_history_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."player_match_history_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."players" TO "anon";
GRANT ALL ON TABLE "public"."players" TO "authenticated";
GRANT ALL ON TABLE "public"."players" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."v_leaderboard" TO "anon";
GRANT ALL ON TABLE "public"."v_leaderboard" TO "authenticated";
GRANT ALL ON TABLE "public"."v_leaderboard" TO "service_role";



GRANT ALL ON TABLE "public"."v_player_match_history" TO "anon";
GRANT ALL ON TABLE "public"."v_player_match_history" TO "authenticated";
GRANT ALL ON TABLE "public"."v_player_match_history" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

/* Commented out as per copilot
CREATE TRIGGER objects_delete_delete_prefix AFTER DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();

CREATE TRIGGER objects_insert_create_prefix BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger();

CREATE TRIGGER objects_update_create_prefix BEFORE UPDATE ON storage.objects FOR EACH ROW WHEN (((new.name <> old.name) OR (new.bucket_id <> old.bucket_id))) EXECUTE FUNCTION storage.objects_update_prefix_trigger();

CREATE TRIGGER prefixes_create_hierarchy BEFORE INSERT ON storage.prefixes FOR EACH ROW WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger();

CREATE TRIGGER prefixes_delete_hierarchy AFTER DELETE ON storage.prefixes FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();
*/

