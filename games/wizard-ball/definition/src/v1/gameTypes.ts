import { PrefixedId } from '@long-game/common';
import { SpeciesType } from './speciesData';
import { ClassType } from './classData';
import { PitchOutcome } from './simGames';

export type TeamId = string;
export type PlayerId = string;
export type GameId = string;

export type PositionChart = Record<Exclude<Position, 'p'>, PlayerId | null>;

export type Team = {
  icon: string;
  name: string;
  ownerId: PrefixedId<'u'> | null;
  id: TeamId;
  playerIds: PlayerId[];
  battingOrder: Position[];
  pitchingOrder: PlayerId[];
  positionChart: PositionChart;
  nextPitcherIndex: number;
  wins: number;
  losses: number;
};

export type PlayerAttributes = {
  strength: number;
  agility: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
};

export type AttributeType = keyof PlayerAttributes;

export type Player = {
  name: string;
  id: PlayerId;
  teamId: TeamId | null;
  positions: Position[];
  species: SpeciesType;
  class: ClassType;
  perkIds: string[];
  attributes: PlayerAttributes;
  stamina: number;
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
  awayPitcher: PlayerId;
  homePitcher: PlayerId;
  score: {
    [teamId: string]: number;
  };
  gameLog: GameLog;
};

export type PlayerStats = {
  // batting stats
  atBats: number;
  hits: number;
  doubles: number;
  triples: number;
  homeRuns: number;
  runsBattedIn: number;
  runs: number;
  walks: number;
  strikeouts: number;
  // baserunning stats
  stolenBases: number;
  caughtStealing: number;
  // pitching stats
  wins: number;
  losses: number;
  outsPitched: number;
  earnedRuns: number;
  ks: number;
  pWalks: number;
  hitsAllowed: number;
  homeRunsAllowed: number;
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
  gameLog: GameLog;
};

export type GameLogEvent =
  | BattingGameLogEvent
  | {
      kind: 'inningStart';
      inning: number;
      battingTeam: TeamId;
      pitchingTeam: TeamId;
      score: Record<TeamId, number>;
    }
  | {
      kind: 'strike' | 'ball' | 'foul';
      batterId: PlayerId;
      pitcherId: PlayerId;
      strikes: number;
      balls: number;
    };

export type BattingGameLogEvent = {
  kind:
    | Exclude<PitchOutcome, 'strike' | 'ball' | 'foul'>
    | 'walk'
    | 'strikeout';
  batterId: PlayerId;
  pitcherId: PlayerId;
};

export type GameLog = Array<GameLogEvent>;
