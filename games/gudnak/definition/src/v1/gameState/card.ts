import {
  type Card,
  Trait,
  cardDefinitions,
  ValidCardId,
  GlobalState,
} from '../gameDefinition';

export function hasTrait(card: Card, trait: Trait): boolean {
  const cardDef = cardDefinitions[card.cardId as ValidCardId];
  if (!cardDef) {
    throw new Error('Invalid card');
  }
  if (cardDef.kind !== 'fighter') {
    throw new Error('Not a fighter');
  }
  return (cardDef.traits as Trait[]).includes(trait);
}

export function matchingTag(a: ValidCardId, b: ValidCardId): boolean {
  const aDef = cardDefinitions[a];
  const bDef = cardDefinitions[b];
  if (aDef.kind !== 'fighter') {
    return false;
  }
  if (bDef.kind !== 'fighter') {
    return false;
  }
  return aDef.traits.some((trait) => (bDef.traits as Trait[]).includes(trait));
}

export function applyFatigue(
  gameState: GlobalState,
  cardInstanceId: string,
): GlobalState {
  return {
    ...gameState,
    cardState: {
      ...gameState.cardState,
      [cardInstanceId]: {
        ...gameState.cardState[cardInstanceId],
        fatigued: true,
      },
    },
  };
}
