import { PrefixedId } from '@long-game/common';
import { SpeciesType } from './speciesData';
import { ClassType } from './classData';
import { WeatherType } from './weatherData';
import { BallparkType } from './ballparkData';
import { ActualPitch } from './pitchData';
import { StatusType } from './statusData';

export type TeamId = string;
export type PlayerId = string;
export type GameId = string;

export type PositionChartKey = Exclude<Position, 'sp' | 'rp' | 'if' | 'of'>;

export type PositionChart = Record<PositionChartKey, PlayerId | null>;

export type Team = {
  icon: string;
  name: string;
  ownerId: PrefixedId<'u'> | null;
  id: TeamId;
  playerIds: PlayerId[];
  battingOrder: (PositionChartKey | 'sp')[];
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
export type CompositeType = BattingCompositeType | PitchingCompositeType;

export type Player = {
  name: string;
  id: PlayerId;
  teamId: TeamId | null;
  positions: Position[];
  species: SpeciesType;
  class: ClassType;
  perkIds: string[];
  statusIds: Partial<Record<StatusType, number>>;
  itemIds: string[];
  attributes: PlayerAttributes;
  advantageTypes: CompositeType[];
  disadvantageTypes: CompositeType[];
  stamina: number;
  xp: number;
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
  | 'rp'
  | 'if'
  | 'of';

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
  // fielding stats
  doublePlays: number;
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

export type LogsPitchData = Omit<ActualPitch, 'hitModifierTable'>;

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
      kind: 'injury';
      playerId: PlayerId;
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
      pitchData: LogsPitchData;
    }
  | {
      kind: 'foul';
      batterId: PlayerId;
      pitcherId: PlayerId;
      strikes: number;
      balls: number;
      pitchData: LogsPitchData;
    }
  | {
      kind: 'strike';
      batterId: PlayerId;
      pitcherId: PlayerId;
      strikes: number;
      balls: number;
      swung: boolean;
      pitchData: LogsPitchData;
    }
  | {
      kind: 'strikeout';
      batterId: PlayerId;
      pitcherId: PlayerId;
      swung: boolean;
      pitchData: LogsPitchData;
    }
  | {
      kind: 'walk';
      batterId: PlayerId;
      pitcherId: PlayerId;
      pitchData: LogsPitchData;
    };

export type HitGameLogEvent = {
  kind: Exclude<PitchOutcome, 'strike' | 'ball' | 'foul'> | 'doublePlay';
  batterId: PlayerId;
  pitcherId: PlayerId;
  direction: HitArea;
  power: HitPower;
  type: HitType;
  defender: Position | null;
  defenderId: PlayerId | null;
  pitchData: LogsPitchData;
  hitTable: HitTable;
  defenderRating: number;
};

export type GameLog = Array<GameLogEvent>;

export type HitTable = Record<
  Exclude<PitchOutcome, 'ball' | 'strike' | 'foul'>,
  number
>;

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

export type PitchOutcome =
  | 'ball'
  | 'strike'
  | 'hit'
  | 'out'
  | 'double'
  | 'triple'
  | 'homeRun'
  | 'foul';

export type AtBatOutcome =
  | 'strikeout'
  | 'walk'
  | 'hit'
  | 'out'
  | 'double'
  | 'triple'
  | 'homeRun';
