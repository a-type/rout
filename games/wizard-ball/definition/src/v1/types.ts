export type TeamId = string;
export type PlayerId = string;
export type GameId = string;

export type Team = {
  name: string;
  id: TeamId;
  playerIds: PlayerId[];
  wins: number;
  losses: number;
};

export type Player = {
  name: string;
  id: PlayerId;
  positions: Position[];
};

export type Position =
  | 'c'
  | '1b'
  | '2b'
  | '3b'
  | 'ss'
  | 'lf'
  | 'cf'
  | 'rf'
  | 'p';

export type LeagueGame = {
  id: GameId;
  homeTeamId: TeamId;
  awayTeamId: TeamId;
};

export type LeagueRound = Array<LeagueGame>;

export type League = {
  name: string;
  teamIds: TeamId[];
  playerLookup: Record<PlayerId, Player>;
  teamLookup: Record<TeamId, Team>;
  schedule: Array<LeagueRound>;
  gameResults: Array<RoundResult>;
  currentWeek: number;
};

export type RoundResult = Array<GameResult>;

export type GameResult = {
  winner: TeamId;
  loser: TeamId;
  score: {
    [teamId: string]: number;
  };
};
