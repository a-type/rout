import { GameRandom } from '@long-game/game-definition';
import type {
  HitArea,
  HitPower,
  HitType,
  Position,
  PlayerId,
  PitchOutcome,
  HitTable,
  LeagueGameState,
  League,
} from '../gameTypes';
import { ActualPitch } from '../pitchData';
import { multiplyObjects, scaleAttributePercent } from '../utils';
import { determineDefender, multiplyHitTables } from './utils';
import { getCurrentBatter } from './utils';
import {
  getModifiedCompositeBattingRatings,
  getActivePlayerPerks,
} from './ratings';

export type HitResult = {
  hitArea: HitArea;
  hitPower: HitPower;
  hitType: HitType;
  defender: Exclude<Position, 'p'> | null;
  defenderId: PlayerId | null;
  outcome: PitchOutcome;
  hitTable: HitTable;
  defenderRating: number;
};
export function determineHitResult(
  random: GameRandom,
  pitchData: ActualPitch,
  isStrike: boolean,
  gameState: LeagueGameState,
  league: League,
): HitResult {
  const batter = getCurrentBatter(gameState);
  const activePerks = getActivePlayerPerks(
    batter,
    league,
    gameState,
    pitchData.kind,
  );
  activePerks.forEach((perk) => {
    const h = perk.effect.hitModifierTable;
    if (h?.power)
      pitchData.hitModifierTable.power = multiplyObjects(
        pitchData.hitModifierTable.power,
        h.power,
      );

    if (h?.type) {
      pitchData.hitModifierTable.type = multiplyObjects(
        pitchData.hitModifierTable.type,
        h.type,
      );
    }
  });

  const batterCompositeRatings = getModifiedCompositeBattingRatings(
    batter,
    league,
    gameState,
    activePerks,
  );
  const hitAreaTable: Record<HitArea, number> = {
    farLeft: 1,
    left: 3,
    center: 4,
    right: 2,
    farRight: 1,
  };
  const hitArea = random.table(hitAreaTable);
  const hitPowerTable: Record<HitPower, number> = multiplyObjects(
    isStrike
      ? {
          weak: 1,
          normal: 3,
          strong: 2 * scaleAttributePercent(batterCompositeRatings.hitPower, 2),
        }
      : {
          weak: 2,
          normal: 1,
          strong: scaleAttributePercent(batterCompositeRatings.hitPower, 2),
        },
    pitchData.hitModifierTable.power,
  );
  const hitPower = random.table(hitPowerTable);
  const hitTypeTable: Record<HitType, number> = multiplyObjects(
    isStrike
      ? {
          grounder: 4,
          fly: 3 * scaleAttributePercent(batterCompositeRatings.hitAngle, 2),
          lineDrive:
            2 * scaleAttributePercent(batterCompositeRatings.hitAngle, 2),
          popUp: 1,
        }
      : {
          grounder: 6,
          fly: 2 * scaleAttributePercent(batterCompositeRatings.hitAngle, 2),
          lineDrive:
            1 * scaleAttributePercent(batterCompositeRatings.hitAngle, 2),
          popUp: 2,
        },
    pitchData.hitModifierTable.type,
  );
  const hitType = random.table(hitTypeTable);

  // Determine defender based on hit direction and type
  const defender = determineDefender(random, hitArea, hitType);
  const defendingPlayerId =
    league.teamLookup[gameState.pitchingTeam].positionChart[defender];
  if (!defendingPlayerId) {
    throw new Error(`No player found for defender position: ${defender}`);
  }
  const defenderComposite = getModifiedCompositeBattingRatings(
    defendingPlayerId,
    league,
    gameState,
    activePerks,
  );
  const defenseModifier = scaleAttributePercent(defenderComposite.fielding, 3);
  let baseHitTable: Partial<HitTable> = {};
  if (hitType === 'grounder') {
    if (hitPower === 'weak') {
      baseHitTable = {
        hit: 1,
        out: 9,
      };
    } else if (hitPower === 'normal') {
      baseHitTable = {
        hit: 1,
        out: 3,
      };
    } else if (hitPower === 'strong') {
      baseHitTable = {
        double:
          0.3 * scaleAttributePercent(batterCompositeRatings.extraBases, 2),
        hit: 3,
        out: 5,
        triple:
          0.1 * scaleAttributePercent(batterCompositeRatings.extraBases, 4),
      };
    }
  } else if (hitType === 'fly') {
    if (hitPower === 'weak') {
      baseHitTable = {
        hit: 1,
        out: 20,
      };
    } else if (hitPower === 'normal') {
      baseHitTable = {
        hit: 2,
        double: 1 * scaleAttributePercent(batterCompositeRatings.extraBases, 4),
        out: 15,
        triple:
          0.3 * scaleAttributePercent(batterCompositeRatings.extraBases, 8),
        homeRun:
          0.5 * scaleAttributePercent(batterCompositeRatings.homeRuns, 4),
      };
    } else if (hitPower === 'strong') {
      baseHitTable = {
        hit: 0.5,
        double: 1 * scaleAttributePercent(batterCompositeRatings.extraBases, 5),
        out: 2,
        triple:
          0.5 * scaleAttributePercent(batterCompositeRatings.extraBases, 10),
        homeRun: 6 * scaleAttributePercent(batterCompositeRatings.homeRuns, 3),
      };
    }
  } else if (hitType === 'lineDrive') {
    if (hitPower === 'weak') {
      baseHitTable = {
        hit: 2,
        out: 1,
      };
    } else if (hitPower === 'normal') {
      baseHitTable = {
        hit: 4,
        out: 1,
        double:
          0.5 * scaleAttributePercent(batterCompositeRatings.extraBases, 3),
        triple:
          0.3 * scaleAttributePercent(batterCompositeRatings.extraBases, 6),
      };
    } else if (hitPower === 'strong') {
      baseHitTable = {
        hit: 8,
        double: 2 * scaleAttributePercent(batterCompositeRatings.extraBases, 4),
        out: 1,
        triple: 1 * scaleAttributePercent(batterCompositeRatings.extraBases, 8),
        homeRun:
          0.5 * scaleAttributePercent(batterCompositeRatings.homeRuns, 5),
      };
    }
  } else if (hitType === 'popUp') {
    baseHitTable = {
      hit: 1,
      out: 99,
    };
  }

  let hitTable: HitTable = {
    hit: 0,
    out: 0,
    double: 0,
    triple: 0,
    homeRun: 0,
    ...baseHitTable,
  };
  hitTable = multiplyHitTables(hitTable, { out: defenseModifier });
  for (const perk of activePerks) {
    const h = perk.effect.hitTableFactor;
    if (h) {
      hitTable = multiplyHitTables(hitTable, h);
    }
  }
  // TODO: more specific calculation for foul balls
  const isFoul = random.float(0, 1) < 0.5;

  const result = isFoul ? (random.table(hitTable) as PitchOutcome) : 'foul';
  return {
    hitArea,
    hitPower,
    hitType,
    defender,
    defenderId: defendingPlayerId,
    outcome: result,
    hitTable,
    defenderRating: defenderComposite.fielding,
  };
}
