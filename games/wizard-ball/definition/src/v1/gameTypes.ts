import { PrefixedId } from '@long-game/common';

export type TeamId = string;
export type PlayerId = string;
export type GameId = string;

export type Team = {
  icon: string;
  name: string;
  ownerId: PrefixedId<'u'> | null;
  id: TeamId;
  playerIds: PlayerId[];
  battingOrder: PlayerId[];
  wins: number;
  losses: number;
};

export type Player = {
  name: string;
  id: PlayerId;
  teamId: TeamId | null;
  positions: Position[];
  attributes: {
    strength: number;
    agility: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
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

export type Base = 1 | 2 | 3;

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
  id: GameId;
  playerStats: Record<PlayerId, PlayerStats>;
  homeTeamId: TeamId;
  awayTeamId: TeamId;
  teamData: Record<
    TeamId,
    {
      battingOrder: PlayerId[];
      pitcher: PlayerId;
    }
  >;
  inningData: Array<{
    runs: number;
    battingTeam: TeamId;
    pitchingTeam: TeamId;
  }>;
  score: {
    [teamId: string]: number;
  };
};

export type PlayerStats = {
  atBats: number;
  hits: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  runsBattedIn: number;
  runs: number;
  walks: number;
  strikeouts: number;
};

export type LeagueGameState = {
  battingTeam: TeamId;
  pitchingTeam: TeamId;
  teamData: Record<
    TeamId,
    {
      battingOrder: PlayerId[];
      pitcher: PlayerId;
      score: number;
    }
  >;
  inningData: Array<{
    runs: number;
    battingTeam: TeamId;
    pitchingTeam: TeamId;
  }>;
  currentInning: number;
  currentBatterIndex: Record<TeamId, number>;
  bases: Record<Base, PlayerId | null>;
  strikes: number;
  balls: number;
  outs: number;
  playerStats: Record<PlayerId, PlayerStats>;
};
