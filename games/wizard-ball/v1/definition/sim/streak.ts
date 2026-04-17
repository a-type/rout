import type { AtBatOutcome, League, PlayerId } from '../gameTypes.js';

type HeatOutcome =
  | AtBatOutcome
  | 'steal'
  | 'caughtStealing'
  | 'run'
  | 'rbi'
  | 'win'
  | 'loss'
  | 'save'
  | 'doublePlay';
const heatLookup = {
  strikeout: -3,
  walk: 1,
  out: -1,
  hit: 2,
  double: 3,
  triple: 4,
  homeRun: 5,
  steal: 2,
  caughtStealing: -2,
  run: 1,
  rbi: 2,
  win: -2,
  loss: 2,
  save: -5,
  doublePlay: -2,
} satisfies Record<HeatOutcome, number>;

export function updatePlayerHeat(
  kind: 'batting' | 'pitching',
  playerId: PlayerId,
  league: League,
  outcome: HeatOutcome,
): League {
  const player = league.playerLookup[playerId];
  if (!player) {
    throw new Error(`Player with ID ${playerId} not found in league`);
  }

  const isReliever =
    kind === 'pitching' && player.positions.some((pos) => pos === 'rp');

  const factor = kind === 'batting' ? 1 : isReliever ? -1 : -0.5;

  const count = factor * heatLookup[outcome];
  player.statusIds.streak = (player.statusIds.streak ?? 0) + count;
  return league;
}
