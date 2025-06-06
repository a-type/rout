import { PrefixedId } from '@long-game/common';
import { SpeciesType } from './speciesData';
import { ClassType } from './classData';
import { PitchOutcome } from './simGames';
import { WeatherType } from './weatherData';
import { BallparkType } from './ballparkData';

export type TeamId = string;
export type PlayerId = string;
export type GameId = string;

export type PositionChart = Record<
  Exclude<Position, 'sp' | 'rp'>,
  PlayerId | null
>;

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
  runDifferential: number;
  ballpark: BallparkType;
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

export type BattingCompositeRatings = {
  extraBases: number;
  hitAngle: number;
  hitPower: number;
  homeRuns: number;
  contact: number;
  stealing: number;
  fielding: number;
  durability: number;
  plateDiscipline: number;
  dueling: number;
};

export type PitchingCompositeRatings = {
  contact: number;
  hitAngle: number;
  movement: number;
  strikeout: number;
  accuracy: number;
  hitPower: number;
  velocity: number;
  durability: number;
  composure: number;
  dueling: number;
};

export type BattingCompositeType = keyof BattingCompositeRatings;
export type PitchingCompositeType = keyof PitchingCompositeRatings;

export type Player = {
  name: string;
  id: PlayerId;
  teamId: TeamId | null;
  positions: Position[];
  species: SpeciesType;
  class: ClassType;
  perkIds: string[];
  itemIds: string[];
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
  | 'sp'
  | 'rp';

export type Base = 1 | 2 | 3;

export type LeagueGame = {
  id: GameId;
  homeTeamId: TeamId;
  awayTeamId: TeamId;
  weather: WeatherType;
  ballpark: BallparkType;
};

export type LeagueRound = Array<LeagueGame>;

export type League = {
  name: string;
  teamIds: TeamId[];
  playerLookup: Record<PlayerId, Player>;
  teamLookup: Record<TeamId, Team>;
  itemLookup: Record<
    string,
    {
      itemDef: string;
      teamId: TeamId | null;
    }
  >;
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
      pitchers: PlayerId[];
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
  gameLog?: GameLog;
  weather: WeatherType;
  ballpark: BallparkType;
};

export type PlayerStats = Partial<{
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
  saves: number;
}>;

export type LeagueGameState = {
  leagueGame: LeagueGame;
  battingTeam: TeamId;
  pitchingTeam: TeamId;
  teamData: Record<
    TeamId,
    {
      battingOrder: PlayerId[];
      pitchers: PlayerId[];
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
  weather: WeatherType;
  ballpark: BallparkType;
  winningPitcherId: PlayerId | null;
  losingPitcherId: PlayerId | null;
  saveElligiblePitcherId: PlayerId | null;
};

export type GameLogEvent =
  | HitGameLogEvent
  | {
      kind: 'inningStart';
      inning: number;
      battingTeam: TeamId;
      pitchingTeam: TeamId;
      score: Record<TeamId, number>;
    }
  | {
      kind: 'pitcherChange';
      teamId: TeamId;
      oldPitcherId: PlayerId;
      newPitcherId: PlayerId;
    }
  | {
      kind: 'ball';
      batterId: PlayerId;
      pitcherId: PlayerId;
      strikes: number;
      balls: number;
      pitchQuality: number;
    }
  | {
      kind: 'foul';
      batterId: PlayerId;
      pitcherId: PlayerId;
      strikes: number;
      balls: number;
      inStrikeZone: boolean;
      pitchQuality: number;
    }
  | {
      kind: 'strike';
      batterId: PlayerId;
      pitcherId: PlayerId;
      strikes: number;
      balls: number;
      inStrikeZone: boolean;
      swung: boolean;
      pitchQuality: number;
    }
  | {
      kind: 'strikeout';
      batterId: PlayerId;
      pitcherId: PlayerId;
      inStrikeZone: boolean;
      swung: boolean;
      pitchQuality: number;
    }
  | {
      kind: 'walk';
      batterId: PlayerId;
      pitcherId: PlayerId;
      pitchQuality: number;
    };

export type HitGameLogEvent = {
  kind: Exclude<PitchOutcome, 'strike' | 'ball' | 'foul'>;
  batterId: PlayerId;
  pitcherId: PlayerId;
  direction: HitArea;
  power: HitPower;
  type: HitType;
  defender: Position | null;
  defenderId: PlayerId | null;
  inStrikeZone: boolean;
  pitchQuality: number;
};

export type GameLog = Array<GameLogEvent>;

export type HitArea = 'farLeft' | 'left' | 'center' | 'right' | 'farRight';
export type HitPower = 'weak' | 'normal' | 'strong';
export type HitType = 'grounder' | 'fly' | 'lineDrive' | 'popUp';

export type Choice =
  | {
      id: string;
      kind: 'item';
      itemDefId: string;
    }
  | {
      id: string;
      kind: 'attributeBoost';
      attribute: AttributeType;
      amount: number;
      playerId: PlayerId;
    }
  | {
      id: string;
      kind: 'teamBoost';
      attribute: AttributeType;
      amount: number;
    }
  | {
      id: string;
      kind: 'perk';
      perkId: string;
      playerId: PlayerId;
    };

export type ChoiceKind = Choice['kind'];
