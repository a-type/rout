import {
  continuousEffectDefinitions,
  ValidContinuousEffectKey,
} from '../definitions/continuousEffectDefinitions';
import { type GlobalState, type Card } from '../gameDefinition';
import {
  cardDefinitions,
  ValidCardId,
  FighterCard,
} from '../definitions/cardDefinition';
import {
  abilityDefinitions,
  type ValidAbilityId,
} from '../definitions/abilityDefinition';

export function determineCombatPower(
  gameState: GlobalState,
  isAttacker: boolean,
  attacker: Card,
  defender: Card,
) {
  const attackerDef = cardDefinitions[
    attacker.cardId as ValidCardId
  ] as FighterCard;
  const defenderDef = cardDefinitions[
    defender.cardId as ValidCardId
  ] as FighterCard;
  const cardDefinition = isAttacker ? attackerDef : defenderDef;
  if (!cardDefinition) {
    throw new Error('Invalid card');
  }
  const abilities = cardDefinition.abilities.map((a) => {
    return abilityDefinitions[a.id];
  });
  let power = abilities.reduce((acc, ability) => {
    if ('modifyCombatPower' in ability.effect) {
      return ability.effect.modifyCombatPower({
        attacker: attackerDef,
        defender: defenderDef,
        basePower: acc,
      });
    }
    return acc;
  }, cardDefinition.power);
  for (const effect of gameState.continuousEffects) {
    const effectDef =
      continuousEffectDefinitions[effect.id as ValidContinuousEffectKey];
    if ('apply' in effectDef && 'modifyCombatPower' in effectDef.apply) {
      power = effectDef.apply.modifyCombatPower({
        globalState: gameState,
        card: isAttacker ? attacker : defender,
        effectOwnerId: effect.ownerId,
        attacker: isAttacker,
        power,
      });
    }
  }
  return power;
}

export function resolveCombat(
  gameState: GlobalState,
  attacker: Card,
  defender: Card,
) {
  const attackerDef = cardDefinitions[attacker.cardId as ValidCardId];
  const defenderDef = cardDefinitions[defender.cardId as ValidCardId];
  if (!attackerDef || !defenderDef) {
    throw new Error('Invalid card');
  }
  if (attackerDef.kind !== 'fighter' || defenderDef.kind !== 'fighter') {
    throw new Error('Not a fighter');
  }
  const attackerPower = determineCombatPower(
    gameState,
    true,
    attacker,
    defender,
  );
  const defenderPower = determineCombatPower(
    gameState,
    false,
    attacker,
    defender,
  );
  if (attackerPower > defenderPower) {
    console.log('attacker wins');
    return attacker;
  } else if (attackerPower < defenderPower) {
    console.log('defender wins');
    return defender;
  }
  console.log('tie');
  return null;
}
