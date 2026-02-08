create or replace function public.refresh_player_match_history()
returns trigger
language plpgsql
as $$
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
    new.id, new.team1_player1_id, new.match_date, new.match_time,
    new.status, new.winner_team, 1::smallint, t1_is_winner,
    new.mission_comeback_flag, new.tiebreak_win_flag, new.win_8_0_flag, new.win_7_1_flag, new.win_6_2_flag,
    mission_t1, tiebreak_t1, w80_t1, w71_t1, w62_t1
  );

  -- Team 1 player 2
  perform public._upsert_player_match_history_row(
    new.id, new.team1_player2_id, new.match_date, new.match_time,
    new.status, new.winner_team, 1::smallint, t1_is_winner,
    new.mission_comeback_flag, new.tiebreak_win_flag, new.win_8_0_flag, new.win_7_1_flag, new.win_6_2_flag,
    mission_t1, tiebreak_t1, w80_t1, w71_t1, w62_t1
  );

  -- Team 2 player 1
  perform public._upsert_player_match_history_row(
    new.id, new.team2_player1_id, new.match_date, new.match_time,
    new.status, new.winner_team, 2::smallint, t2_is_winner,
    new.mission_comeback_flag, new.tiebreak_win_flag, new.win_8_0_flag, new.win_7_1_flag, new.win_6_2_flag,
    mission_t2, tiebreak_t2, w80_t2, w71_t2, w62_t2
  );

  -- Team 2 player 2
  perform public._upsert_player_match_history_row(
    new.id, new.team2_player2_id, new.match_date, new.match_time,
    new.status, new.winner_team, 2::smallint, t2_is_winner,
    new.mission_comeback_flag, new.tiebreak_win_flag, new.win_8_0_flag, new.win_7_1_flag, new.win_6_2_flag,
    mission_t2, tiebreak_t2, w80_t2, w71_t2, w62_t2
  );

  return new;
end;
$$;