
begin
  -- If the slot is empty (player_id null), do nothing
  if p_player_id is null then
    return;
  end if;

  insert into public.player_match_history (
    match_id,
    player_id,
    match_date,
    match_time,
    status,
    winner_team,
    team_no,
    is_winner,

    mission_comeback_flag,
    tiebreak_win_flag,
    win_8_0_flag,
    win_7_1_flag,
    win_6_2_flag,

    mission_comeback_points,
    tiebreak_win_points,
    win_8_0_points,
    win_7_1_points,
    win_6_2_points,

    -- IMPORTANT: we set these to 0 on insert to avoid NULL totals.
    -- Manual flags may later override points; we preserve them on conflict update.
    win_loss_points,
    match_total_points
  )
  values (
    p_match_id,
    p_player_id,
    p_match_date,
    p_match_time,
    p_status,
    p_winner_team,
    p_team_no,
    p_is_winner,

    coalesce(p_mission_comeback_flag, 0),
    coalesce(p_tiebreak_win_flag, 0),
    coalesce(p_win_8_0_flag, 0),
    coalesce(p_win_7_1_flag, 0),
    coalesce(p_win_6_2_flag, 0),

    coalesce(p_mission_comeback_points, 0),
    coalesce(p_tiebreak_win_points, 0),
    coalesce(p_win_8_0_points, 0),
    coalesce(p_win_7_1_points, 0),
    coalesce(p_win_6_2_points, 0),

    -- If you have a specific win/loss scoring system, change these constants.
    -- Safe default: win=3, loss=0 when completed.
    case
      when p_status = 'completed' and coalesce(p_is_winner, false) then 3
      when p_status = 'completed' then 0
      else 0
    end,

    -- Total points = win/loss + match-derived bonuses.
    -- Manual bonus points (no_fault/no_return) are NOT included here on insert; those get added later.
    case
      when p_status = 'completed' and coalesce(p_is_winner, false) then 3 else 0
    end
    + coalesce(p_mission_comeback_points, 0)
    + coalesce(p_tiebreak_win_points, 0)
    + coalesce(p_win_8_0_points, 0)
    + coalesce(p_win_7_1_points, 0)
    + coalesce(p_win_6_2_points, 0)
  )
  on conflict (match_id, player_id)
  do update set
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
    win_6_2_points = excluded.win_6_2_points,

    -- Update win/loss + recompute match_total_points,
    -- BUT preserve manual points that already exist in the row.
    win_loss_points = excluded.win_loss_points,
    match_total_points =
      excluded.win_loss_points
      + excluded.mission_comeback_points
      + excluded.tiebreak_win_points
      + excluded.win_8_0_points
      + excluded.win_7_1_points
      + excluded.win_6_2_points
      + coalesce(public.player_match_history.no_fault_miss_points, 0)
      + coalesce(public.player_match_history.no_return_miss_points, 0);

  -- NOTE: We intentionally do NOT set/overwrite:
  -- double_point_flag, no_fault_miss_flag, no_return_miss_flag
  -- no_fault_miss_points, no_return_miss_points
  -- so manual flags/points are preserved.
end;



with filtered_pmh as (
  select pmh.*
  from public.player_match_history pmh
  where pmh.status = 'completed'
    and (p_start_date is null or pmh.match_date >= p_start_date)
    and (p_end_date   is null or pmh.match_date <= p_end_date)
),
per_player as (
  select
    p.id as player_id,
    p.name as player_name,

    -- These bonuses only count when the player actually won (consistent with how points are awarded)
    coalesce(sum(case when f.is_winner = true and coalesce(f.mission_comeback_flag, 0) = 1 then 1 else 0 end), 0)::int as comeback_mission_count,
    coalesce(sum(case when f.is_winner = true and coalesce(f.tiebreak_win_flag, 0) = 1 then 1 else 0 end), 0)::int as tiebreak_wins_count,
    coalesce(sum(case when f.is_winner = true and coalesce(f.win_8_0_flag, 0) = 1 then 1 else 0 end), 0)::int as win_8_0_count,
    coalesce(sum(case when f.is_winner = true and coalesce(f.win_7_1_flag, 0) = 1 then 1 else 0 end), 0)::int as win_7_1_count,
    coalesce(sum(case when f.is_winner = true and coalesce(f.win_6_2_flag, 0) = 1 then 1 else 0 end), 0)::int as win_6_2_count,

    -- Manual per-player flags (count regardless of winner)
    coalesce(sum(case when coalesce(f.no_fault_miss_flag, 0) = 1 then 1 else 0 end), 0)::int as no_double_fault_games_count,
    coalesce(sum(case when coalesce(f.no_return_miss_flag, 0) = 1 then 1 else 0 end), 0)::int as no_return_miss_games_count,

    -- Total mission points = sum of mission point components from PMH (NOT match_total_points)
    coalesce(sum(
      coalesce(f.mission_comeback_points, 0)
      + coalesce(f.tiebreak_win_points, 0)
      + coalesce(f.win_8_0_points, 0)
      + coalesce(f.win_7_1_points, 0)
      + coalesce(f.win_6_2_points, 0)
      + coalesce(f.no_fault_miss_points, 0)
      + coalesce(f.no_return_miss_points, 0)
    ), 0)::int as total_mission_points

  from public.players p
  left join filtered_pmh f
    on f.player_id = p.id
  where p.is_active = true
  group by p.id, p.name
)
select
  player_id,
  player_name,
  comeback_mission_count,
  tiebreak_wins_count,
  no_double_fault_games_count,
  no_return_miss_games_count,
  win_8_0_count,
  win_7_1_count,
  win_6_2_count,
  total_mission_points
from per_player
order by player_name asc;
