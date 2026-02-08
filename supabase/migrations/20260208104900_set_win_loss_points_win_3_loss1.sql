create or replace function public._upsert_player_match_history_row(
  p_match_id uuid,
  p_player_id uuid,
  p_match_date date,
  p_match_time time without time zone,
  p_status text,
  p_winner_team smallint,
  p_team_no smallint,
  p_is_winner boolean,
  p_mission_comeback_flag smallint,
  p_tiebreak_win_flag smallint,
  p_win_8_0_flag smallint,
  p_win_7_1_flag smallint,
  p_win_6_2_flag smallint,
  p_mission_comeback_points integer,
  p_tiebreak_win_points integer,
  p_win_8_0_points integer,
  p_win_7_1_points integer,
  p_win_6_2_points integer
)
returns void
language plpgsql
as $$
begin
  if p_player_id is null then
    return;
  end if;

  insert into public.player_match_history (
    match_id, player_id, match_date, match_time,
    status, winner_team, team_no, is_winner,
    mission_comeback_flag, tiebreak_win_flag, win_8_0_flag, win_7_1_flag, win_6_2_flag,
    mission_comeback_points, tiebreak_win_points, win_8_0_points, win_7_1_points, win_6_2_points,
    win_loss_points, match_total_points
  )
  values (
    p_match_id, p_player_id, p_match_date, p_match_time,
    p_status, p_winner_team, p_team_no, p_is_winner,
    coalesce(p_mission_comeback_flag, 0), coalesce(p_tiebreak_win_flag, 0),
    coalesce(p_win_8_0_flag, 0), coalesce(p_win_7_1_flag, 0), coalesce(p_win_6_2_flag, 0),
    coalesce(p_mission_comeback_points, 0), coalesce(p_tiebreak_win_points, 0),
    coalesce(p_win_8_0_points, 0), coalesce(p_win_7_1_points, 0), coalesce(p_win_6_2_points, 0),

    -- ✅ win=3, loss=1
    case
      when p_status = 'completed' and coalesce(p_is_winner, false) then 3
      when p_status = 'completed' then 1
      else 0
    end,

    -- ✅ total = win/loss + bonuses (manual points preserved on update)
    (case
      when p_status = 'completed' and coalesce(p_is_winner, false) then 3
      when p_status = 'completed' then 1
      else 0
    end)
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
end;
$$;