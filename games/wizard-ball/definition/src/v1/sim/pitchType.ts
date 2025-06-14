import { GameRandom } from '@long-game/game-definition';
import { getPlayerOverall } from '../attributes';
import type { Player, LeagueGameState, League } from '../gameTypes';
import { ActualPitch, pitchTypes, PitchKind } from '../pitchData';
import { scaleAttributePercent, scaleAttribute, clamp } from '../utils';
import { runnersOnBases } from './runners';
import { getCountAdvantage } from './utils';
import {
  getModifiedCompositeBattingRatings,
  getModifiedCompositePitchingRatings,
  getActivePlayerPerks,
} from './ratings';

export function determinePitchType(
  random: GameRandom,
  batter: Player,
  pitcher: Player,
  game: LeagueGameState,
  league: League,
): ActualPitch {
  const pitchKind = random.item(Object.keys(pitchTypes) as PitchKind[]);
  const activePerks = getActivePlayerPerks(pitcher.id, league, game, pitchKind);
  const batterComposite = getModifiedCompositeBattingRatings(
    batter.id,
    league,
    game,
    activePerks,
  );

  const pitcherComposite = getModifiedCompositePitchingRatings(
    pitcher.id,
    league,
    game,
    activePerks,
  );

  const randomMod = 5 * random.float(-1, 1);
  let attributeTotal = 10 + randomMod;
  const duelingFactor =
    0.5 * (pitcherComposite.dueling - batterComposite.dueling);
  const duelingAmount =
    0.2 * Math.pow(Math.abs(duelingFactor), 2) * Math.sign(duelingFactor);
  const strikeoutAmount =
    0.2 * (pitcherComposite.strikeout - 10) * game.strikes;
  const composureAmount =
    (0.2 * (pitcherComposite.composure - 10) * game.balls * 2) / 3;

  const pitchFactor = 0.4;
  let pitchAmount = 0;

  switch (pitchKind) {
    case 'fastball':
      pitchAmount = pitchFactor * (pitcherComposite.velocity - 10);
    case 'curveball':
      pitchAmount = pitchFactor * (pitcherComposite.movement - 10);
      break;
    case 'changeup':
      pitchAmount =
        pitchFactor * 0.7 * (pitcherComposite.velocity - 10) +
        pitchFactor * 0.3 * (pitcherComposite.accuracy - 10);
      break;
    case 'slider':
      pitchAmount =
        pitchFactor * 0.5 * (pitcherComposite.velocity - 10) +
        pitchFactor * 0.5 * (pitcherComposite.movement - 10);
      break;
    case 'sinker':
      pitchAmount =
        pitchFactor * 0.7 * (pitcherComposite.movement - 10) +
        pitchFactor * 0.3 * (pitcherComposite.accuracy - 10);
      break;
    default:
      throw new Error(`Unknown pitch kind: ${pitchKind}`);
  }
  let perkAmount = 0;
  activePerks.forEach((perk) => {
    const qb = perk.effect.qualityBonus;
    if (qb) {
      perkAmount += qb;
    }
  });
  attributeTotal +=
    duelingAmount +
    strikeoutAmount +
    composureAmount +
    pitchAmount +
    perkAmount;

  const qualityModifier = attributeTotal - 10;

  const countAdvantage = getCountAdvantage(game.balls, game.strikes);
  const countFactor =
    {
      behind: 5,
      neutral: 1,
      ahead: -4,
    }[countAdvantage] ?? 0;
  const strikeDesireChance =
    0.66 *
    scaleAttributePercent(
      10 +
        0.2 * (10 - getPlayerOverall(batter) / 6) +
        countFactor +
        runnersOnBases(game) * 2,
      1.5,
    );
  const strikeDesire = random.float(0, 1) < strikeDesireChance;

  const modifiedAccuracy = pitcherComposite.accuracy + qualityModifier;

  const strikeFactor =
    0.55 +
    scaleAttribute(
      modifiedAccuracy + pitchTypes[pitchKind]().accuracyBonus,
      0.4,
    );

  const isAccurate = random.float(0, 1) < strikeFactor;

  const isStrike = isAccurate ? strikeDesire : random.float(0, 1) < 0.3;

  const modifiedMovement = clamp(
    pitcherComposite.movement + qualityModifier,
    0,
    20,
  );
  const modifiedVelocity = clamp(
    pitcherComposite.velocity + qualityModifier,
    0,
    20,
  );
  let quality = scaleAttributePercent(attributeTotal, 2);
  const basePitchData = pitchTypes[pitchKind]({
    quality,
    accuracy: modifiedAccuracy,
    movement: modifiedMovement,
    velocity: modifiedVelocity,
  });

  if (!quality) {
    throw new Error(
      `Pitch quality can't be zero or negative ${JSON.stringify({
        pitcher,
        strikeDesire,
        duelingFactor,
        qualityModifier,
        attributeTotal,
        basePitchData,
      })}`,
    );
  }
  // if (modifiedMovement > 30 || modifiedMovement < -10) {
  //   console.log(
  //     `Extreme pitch: ${quality} for ${pitchKind} by ${pitcher.name} ${JSON.stringify(
  //       {
  //         pitcher,
  //         pitcherComposite,
  //         strikeDesire,
  //         duelingFactor,
  //         duelingAmount,
  //         strikeoutAmount,
  //         composureAmount,
  //         pitchAmount,
  //         perkAmount,
  //         randomMod,
  //         qualityModifier,
  //         attributeTotal,
  //         basePitchData,
  //       },
  //     )}`,
  //   );
  // }
  const {
    contactStrikeFactor,
    contactBallFactor,
    swingStrikeFactor,
    swingBallFactor,
    ...rest
  } = basePitchData;
  const pitchData: ActualPitch = {
    ...rest,
    contactFactor: isStrike ? contactStrikeFactor : contactBallFactor,
    swingFactor: isStrike ? swingStrikeFactor : swingBallFactor,
    velocity: modifiedVelocity,
    movement: modifiedMovement,
    kind: pitchKind,
    quality,
    isStrike,
  };
  // console.log('base pitch data', pitchData);
  // logger.debug(JSON.stringify(pitchData));
  // STR = strikeouts = more strikes, fewer swings at strikes
  // AGI = finesse = less contact
  // CON = higher counts, fewer swings in general
  // WIS = poor decisions, swing more at balls and less at strikes
  // INT = deception = higher pitch quality
  // CHA = higher pitch quality in clutch situations
  // if (isStrike) {
  //   pitchData.swingFactor *=
  //     1 /
  //     scaleAttributePercent(modifiedVelocity, 2) /
  //     scaleAttributePercent(pitcherComposite.accuracy, 1.5);
  //   pitchData.contactFactor *= 1 / scaleAttributePercent(modifiedVelocity, 2);
  // } else {
  //   pitchData.swingFactor *=
  //     scaleAttributePercent(modifiedMovement, 2) *
  //     scaleAttributePercent(pitcherComposite.accuracy, 1.5);
  //   pitchData.contactFactor *= 1 / scaleAttributePercent(modifiedMovement, 2);
  // }
  // Object.keys(pitchData.hitModifierTable.power).forEach((key) => {
  //   if (!key || !pitchData.hitModifierTable.power[key as HitPower]) {
  //     return;
  //   }
  //   pitchData.hitModifierTable.power[key as HitPower] =
  //     (pitchData.hitModifierTable.power[key as HitPower] ?? 1) ** quality;
  // });
  // Object.keys(pitchData.hitModifierTable.type).forEach((key) => {
  //   if (!key || !pitchData.hitModifierTable.type[key as HitType]) {
  //     return;
  //   }
  //   pitchData.hitModifierTable.type[key as HitType] =
  //     (pitchData.hitModifierTable.type[key as HitType] ?? 1) ** quality;
  // });
  pitchData.hitModifierTable.type.grounder =
    (pitchData.hitModifierTable.type.grounder ?? 1) *
    scaleAttributePercent(pitcherComposite.hitAngle, 2);
  pitchData.hitModifierTable.power.strong =
    (pitchData.hitModifierTable.power.strong ?? 1) /
    scaleAttributePercent(pitcherComposite.hitPower, 2);

  return pitchData;
}
